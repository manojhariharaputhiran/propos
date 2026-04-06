"""
RFP router: handles upload, status, qualification, SME answers, drafts, approval, export.
"""
import asyncio
import io
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.deps import get_db, get_current_user
from app.models.database import RFP, Question, User, Organisation
from app.models.schemas import (
    RFPOut, RFPSummary, DashboardStats,
    QualifyRequest, SMEAnswerRequest, ApproveRequest, QuestionOut,
)
from app.agents.orchestrator import (
    run_rfp_pipeline, resume_after_qualification, resume_after_human_review,
)
from app.services.export_service import export_word, export_pdf, export_ppt, export_sheets

import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/rfp", tags=["rfp"])


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=RFPOut)
async def upload_rfp(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload an RFP file (PDF or DOCX) and kick off the processing pipeline."""
    if not file.filename:
        raise HTTPException(400, "No file provided")

    extension = file.filename.rsplit(".", 1)[-1].lower()
    if extension not in ("pdf", "docx", "txt"):
        raise HTTPException(400, "Unsupported file type. Use PDF, DOCX, or TXT.")

    content = await file.read()
    raw_text = _extract_text(content, extension, file.filename)

    rfp = RFP(
        org_id=current_user.org_id,
        status="uploaded",
        title=title or file.filename.rsplit(".", 1)[0].replace("-", " ").replace("_", " ").title(),
        file_name=file.filename,
        raw_text=raw_text,
    )
    db.add(rfp)
    await db.flush()
    await db.refresh(rfp)

    # Kick off pipeline in background
    rfp_id = rfp.id
    background_tasks.add_task(_run_pipeline_bg, rfp_id)

    # Return explicit dict to avoid lazy-loading the questions relationship
    # (which is empty at upload time and would trigger a MissingGreenlet error)
    return RFPOut(
        id=rfp.id,
        org_id=rfp.org_id,
        status=rfp.status,
        title=rfp.title,
        file_name=rfp.file_name,
        raw_text=rfp.raw_text,
        critic_report=rfp.critic_report,
        export_format=rfp.export_format,
        created_at=rfp.created_at,
        updated_at=rfp.updated_at,
        questions=[],
    )


def _extract_text(content: bytes, extension: str, filename: str) -> str:
    """Extract plain text from uploaded file."""
    if extension == "txt":
        return content.decode("utf-8", errors="replace")

    if extension == "pdf":
        try:
            from pdfminer.high_level import extract_text as pdfminer_extract
            return pdfminer_extract(io.BytesIO(content))
        except Exception:
            try:
                import PyPDF2
                reader = PyPDF2.PdfReader(io.BytesIO(content))
                return "\n".join(page.extract_text() or "" for page in reader.pages)
            except Exception:
                return f"[Could not extract text from {filename}]"

    if extension == "docx":
        try:
            from docx import Document
            doc = Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except Exception:
            return f"[Could not extract text from {filename}]"

    return ""


async def _run_pipeline_bg(rfp_id: uuid.UUID):
    """Background task: pipeline manages its own sessions internally."""
    await run_rfp_pipeline(rfp_id)


# ── Status ────────────────────────────────────────────────────────────────────

@router.get("/{rfp_id}/status", response_model=RFPOut)
async def get_rfp_status(
    rfp_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = await _get_rfp_or_404(rfp_id, current_user.org_id, db)
    return rfp


# ── List RFPs for dashboard ───────────────────────────────────────────────────

@router.get("/", response_model=List[RFPSummary])
async def list_rfps(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(RFP)
        .where(RFP.org_id == current_user.org_id)
        .order_by(RFP.created_at.desc())
    )
    rfps = result.scalars().all()

    summaries = []
    for rfp in rfps:
        q_result = await db.execute(
            select(func.count(Question.id)).where(Question.rfp_id == rfp.id)
        )
        count = q_result.scalar() or 0
        summaries.append(
            RFPSummary(
                id=rfp.id,
                org_id=rfp.org_id,
                status=rfp.status,
                title=rfp.title,
                file_name=rfp.file_name,
                created_at=rfp.created_at,
                updated_at=rfp.updated_at,
                question_count=count,
                critic_report=rfp.critic_report,
            )
        )
    return summaries


@router.get("/stats/dashboard", response_model=DashboardStats)
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(RFP).where(RFP.org_id == current_user.org_id)
    )
    rfps = result.scalars().all()

    in_progress_statuses = {"parsing", "qualification_needed", "qualified", "drafting", "sme_needed", "critic_done"}
    completed_statuses = {"export_ready", "completed"}
    review_statuses = {"human_review"}

    return DashboardStats(
        total=len(rfps),
        in_progress=sum(1 for r in rfps if r.status in in_progress_statuses),
        completed=sum(1 for r in rfps if r.status in completed_statuses),
        needs_review=sum(1 for r in rfps if r.status in review_statuses),
    )


# ── Qualify ───────────────────────────────────────────────────────────────────

@router.post("/{rfp_id}/qualify")
async def qualify_rfp(
    rfp_id: uuid.UUID,
    body: QualifyRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = await _get_rfp_or_404(rfp_id, current_user.org_id, db)

    if rfp.status != "qualification_needed":
        raise HTTPException(400, f"RFP is in '{rfp.status}' state, not qualification_needed")

    if body.proceed:
        rfp.status = "qualified"
        await db.commit()
        rfp_id_copy = rfp.id
        background_tasks.add_task(_resume_qualification_bg, rfp_id_copy, True)
        return {"message": "Qualification accepted. Drafting will begin shortly."}
    else:
        rfp.status = "rejected"
        await db.commit()
        return {"message": "RFP rejected. No further processing."}


async def _resume_qualification_bg(rfp_id: uuid.UUID, proceed: bool):
    await resume_after_qualification(rfp_id, proceed)


# ── SME Answer ────────────────────────────────────────────────────────────────

@router.post("/{rfp_id}/sme-answer")
async def submit_sme_answer(
    rfp_id: uuid.UUID,
    body: SMEAnswerRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = await _get_rfp_or_404(rfp_id, current_user.org_id, db)

    q_result = await db.execute(
        select(Question).where(Question.id == body.question_id, Question.rfp_id == rfp_id)
    )
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(404, "Question not found")

    question.sme_provided_answer = body.answer
    question.needs_sme = False

    # Check if all SME questions resolved
    pending_result = await db.execute(
        select(Question).where(Question.rfp_id == rfp_id, Question.needs_sme == True)
    )
    pending = pending_result.scalars().all()

    if not pending:
        rfp.status = "critic_done"
        await db.commit()
        rfp_id_copy = rfp.id
        background_tasks.add_task(_continue_after_sme_bg, rfp_id_copy)
    else:
        await db.commit()

    return {"message": "SME answer submitted.", "remaining_sme": len(pending)}


async def _continue_after_sme_bg(rfp_id: uuid.UUID):
    await run_rfp_pipeline(rfp_id)


# ── Draft ─────────────────────────────────────────────────────────────────────

@router.get("/{rfp_id}/draft", response_model=RFPOut)
async def get_draft(
    rfp_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _get_rfp_or_404(rfp_id, current_user.org_id, db)


# ── Approve ───────────────────────────────────────────────────────────────────

@router.post("/{rfp_id}/approve")
async def approve_rfp(
    rfp_id: uuid.UUID,
    body: ApproveRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = await _get_rfp_or_404(rfp_id, current_user.org_id, db)

    if rfp.status != "human_review":
        raise HTTPException(400, f"RFP must be in 'human_review' state to approve. Current: {rfp.status}")

    if body.approved:
        rfp.status = "export_ready"
        await db.commit()
        return {"message": "Proposal approved and ready for export."}
    else:
        rfp.status = "drafting"
        await db.commit()
        rfp_id_copy = rfp.id
        background_tasks.add_task(_run_pipeline_bg, rfp_id_copy)
        return {"message": "Proposal sent back for redrafting."}


# ── Export ────────────────────────────────────────────────────────────────────

@router.get("/{rfp_id}/export")
async def export_rfp(
    rfp_id: uuid.UUID,
    format: str = "word",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = await _get_rfp_or_404(rfp_id, current_user.org_id, db)

    if rfp.status not in ("export_ready", "completed", "human_review"):
        raise HTTPException(400, "RFP must be approved before export")

    title = rfp.title or "RFP Response"
    questions = [
        {
            "id": str(q.id),
            "text": q.text,
            "draft": q.draft_answer,
            "draft_answer": q.draft_answer,
            "confidence": q.confidence,
            "needs_sme": q.needs_sme,
            "final_answer": q.final_answer,
        }
        for q in rfp.questions
    ]
    critic_report = rfp.critic_report

    fmt = format.lower()
    if fmt == "word":
        data = export_word(title, questions, critic_report)
        filename = f"{title.replace(' ', '_')}.docx"
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif fmt == "pdf":
        data = export_pdf(title, questions, critic_report)
        filename = f"{title.replace(' ', '_')}.pdf"
        media_type = "application/pdf"
    elif fmt == "ppt":
        data = export_ppt(title, questions, critic_report)
        filename = f"{title.replace(' ', '_')}.pptx"
        media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    elif fmt == "sheets":
        data = export_sheets(title, questions, critic_report)
        filename = f"{title.replace(' ', '_')}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        raise HTTPException(400, f"Unsupported format: {fmt}. Use word, pdf, ppt, or sheets.")

    # Mark as completed
    rfp.status = "completed"
    rfp.export_format = fmt
    await db.commit()

    return StreamingResponse(
        io.BytesIO(data),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Helper ────────────────────────────────────────────────────────────────────

async def _get_rfp_or_404(rfp_id: uuid.UUID, org_id: uuid.UUID, db: AsyncSession) -> RFP:
    result = await db.execute(
        select(RFP)
        .options(selectinload(RFP.questions))
        .where(RFP.id == rfp_id, RFP.org_id == org_id)
    )
    rfp = result.scalar_one_or_none()
    if not rfp:
        raise HTTPException(404, "RFP not found")
    return rfp
