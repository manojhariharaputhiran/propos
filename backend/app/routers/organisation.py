"""
Organisation router: PPT template management and org settings.
"""
import uuid
import os
import aiofiles
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_db, get_current_user
from app.models.database import Organisation, User
from app.models.schemas import OrganisationOut

router = APIRouter(prefix="/organisation", tags=["organisation"])

UPLOAD_DIR = "/tmp/rfp_templates"


@router.get("/", response_model=OrganisationOut)
async def get_organisation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Organisation).where(Organisation.id == current_user.org_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(404, "Organisation not found")
    return org


@router.post("/templates/ppt")
async def upload_ppt_template(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a .pptx template file for this organisation."""
    if not file.filename or not file.filename.endswith(".pptx"):
        raise HTTPException(400, "Only .pptx files are accepted")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    safe_name = f"{current_user.org_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    content = await file.read()
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Update org record
    result = await db.execute(
        select(Organisation).where(Organisation.id == current_user.org_id)
    )
    org = result.scalar_one_or_none()
    if org:
        org.default_ppt_template_url = file_path
        await db.commit()

    return {
        "message": "Template uploaded successfully",
        "filename": safe_name,
        "path": file_path,
    }


@router.get("/templates")
async def list_templates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List available PPT templates for this organisation."""
    result = await db.execute(
        select(Organisation).where(Organisation.id == current_user.org_id)
    )
    org = result.scalar_one_or_none()

    templates = []
    if org and org.default_ppt_template_url:
        fname = os.path.basename(org.default_ppt_template_url)
        templates.append({
            "id": str(current_user.org_id),
            "name": fname,
            "path": org.default_ppt_template_url,
            "is_default": True,
        })

    # Also scan template dir for any stored templates
    if os.path.exists(UPLOAD_DIR):
        prefix = str(current_user.org_id)
        for fn in os.listdir(UPLOAD_DIR):
            if fn.startswith(prefix) and fn not in [t["name"] for t in templates]:
                templates.append({
                    "id": fn,
                    "name": fn.replace(f"{prefix}_", ""),
                    "path": os.path.join(UPLOAD_DIR, fn),
                    "is_default": False,
                })

    return {"templates": templates}


@router.put("/brand-voice")
async def update_brand_voice(
    brand_voice: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Organisation).where(Organisation.id == current_user.org_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(404, "Organisation not found")

    allowed = {"professional", "consultative", "friendly", "technical", "executive"}
    if brand_voice not in allowed:
        raise HTTPException(400, f"brand_voice must be one of: {', '.join(allowed)}")

    org.brand_voice = brand_voice
    await db.commit()
    return {"message": "Brand voice updated", "brand_voice": brand_voice}
