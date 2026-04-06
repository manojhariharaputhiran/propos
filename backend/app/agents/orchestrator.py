"""
Orchestrator: coordinates the LangGraph state machine for a given RFP.
Delegates to individual agents and updates DB state after each step.
"""
import asyncio
import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import RFP, Question, async_session_maker
from app.graph.rfp_graph import build_rfp_graph, RFPState
from app.core.config import settings
import structlog

logger = structlog.get_logger()


async def run_rfp_pipeline(rfp_id: uuid.UUID) -> None:
    """
    Entry point called after upload. Builds the LangGraph graph and
    runs it step by step until a human-in-the-loop pause or completion.
    Each DB operation gets its own fresh session to avoid greenlet issues.
    """
    async with async_session_maker() as db:
        result = await db.execute(select(RFP).where(RFP.id == rfp_id))
        rfp = result.scalar_one_or_none()
        if not rfp:
            logger.error("RFP not found", rfp_id=str(rfp_id))
            return

        state: RFPState = {
            "rfp_id": str(rfp.id),
            "org_id": str(rfp.org_id),
            "status": rfp.status,
            "raw_text": rfp.raw_text or "",
            "questions": [],
            "critic_report": None,
            "export_format": rfp.export_format,
        }

    graph = build_rfp_graph()

    try:
        async for event in graph.astream(state, stream_mode="values"):
            new_status = event.get("status", state["status"])
            if new_status != state["status"]:
                await _persist_state(rfp_id, event)
                state = event
                logger.info("RFP state transition", rfp_id=str(rfp_id), status=new_status)

            if new_status in ("qualification_needed", "sme_needed", "human_review"):
                logger.info("Pausing for human input", rfp_id=str(rfp_id), status=new_status)
                break

    except Exception as exc:
        logger.exception("Pipeline error", rfp_id=str(rfp_id), error=str(exc))
        async with async_session_maker() as db:
            result = await db.execute(select(RFP).where(RFP.id == rfp_id))
            rfp = result.scalar_one_or_none()
            if rfp:
                rfp.status = "error"
                await db.commit()


async def resume_after_qualification(rfp_id: uuid.UUID, proceed: bool) -> None:
    """Resume pipeline after Go/No-Go decision."""
    async with async_session_maker() as db:
        result = await db.execute(select(RFP).where(RFP.id == rfp_id))
        rfp = result.scalar_one_or_none()
        if not rfp:
            return
        if not proceed:
            rfp.status = "rejected"
            await db.commit()
            return
        rfp.status = "qualified"
        await db.commit()

    await run_rfp_pipeline(rfp_id)


async def resume_after_human_review(rfp_id: uuid.UUID, approved: bool) -> None:
    """Resume pipeline after human review."""
    async with async_session_maker() as db:
        result = await db.execute(select(RFP).where(RFP.id == rfp_id))
        rfp = result.scalar_one_or_none()
        if not rfp:
            return
        rfp.status = "export_ready" if approved else "drafting"
        await db.commit()

    if approved:
        await run_rfp_pipeline(rfp_id)


async def _persist_state(rfp_id: uuid.UUID, state: RFPState) -> None:
    """Write graph state back to the database. Creates its own session."""
    async with async_session_maker() as db:
        result = await db.execute(select(RFP).where(RFP.id == rfp_id))
        rfp = result.scalar_one_or_none()
        if not rfp:
            return

        rfp.status = state.get("status", rfp.status)
        if state.get("critic_report"):
            rfp.critic_report = state["critic_report"]

        for q_data in state.get("questions", []):
            q_id = q_data.get("id")
            if not q_id:
                continue
            q_result = await db.execute(
                select(Question).where(Question.id == uuid.UUID(q_id))
            )
            question = q_result.scalar_one_or_none()
            if question:
                question.draft_answer = q_data.get("draft")
                question.confidence = q_data.get("confidence")
                question.needs_sme = q_data.get("needs_sme", False)
                question.sme_provided_answer = q_data.get("sme_answer")
                question.final_answer = q_data.get("final_answer")
            else:
                question = Question(
                    id=uuid.UUID(q_id),
                    rfp_id=rfp_id,
                    text=q_data.get("text", ""),
                    draft_answer=q_data.get("draft"),
                    confidence=q_data.get("confidence"),
                    needs_sme=q_data.get("needs_sme", False),
                    sme_provided_answer=q_data.get("sme_answer"),
                    final_answer=q_data.get("final_answer"),
                    sort_order=q_data.get("sort_order", 0),
                )
                db.add(question)

        await db.commit()
