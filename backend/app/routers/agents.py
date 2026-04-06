"""
Agents router: CRUD for custom agents.
"""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_db, get_current_user
from app.models.database import CustomAgent, User
from app.models.schemas import AgentCreate, AgentUpdate, AgentOut

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/", response_model=List[AgentOut])
async def list_agents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(CustomAgent)
        .where(CustomAgent.org_id == current_user.org_id)
        .order_by(CustomAgent.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=AgentOut, status_code=201)
async def create_agent(
    body: AgentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = CustomAgent(
        org_id=current_user.org_id,
        name=body.name,
        type=body.type,
        system_prompt=body.system_prompt,
        trigger_keywords=body.trigger_keywords,
        tools=body.tools,
        is_active=True,
    )
    db.add(agent)
    await db.flush()
    await db.refresh(agent)
    return agent


@router.put("/{agent_id}", response_model=AgentOut)
async def update_agent(
    agent_id: uuid.UUID,
    body: AgentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = await _get_agent_or_404(agent_id, current_user.org_id, db)

    if body.name is not None:
        agent.name = body.name
    if body.type is not None:
        agent.type = body.type
    if body.system_prompt is not None:
        agent.system_prompt = body.system_prompt
    if body.trigger_keywords is not None:
        agent.trigger_keywords = body.trigger_keywords
    if body.tools is not None:
        agent.tools = body.tools
    if body.is_active is not None:
        agent.is_active = body.is_active

    await db.commit()
    await db.refresh(agent)
    return agent


@router.post("/{agent_id}/disable", response_model=AgentOut)
async def disable_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = await _get_agent_or_404(agent_id, current_user.org_id, db)
    agent.is_active = False
    await db.commit()
    await db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = await _get_agent_or_404(agent_id, current_user.org_id, db)
    await db.delete(agent)
    await db.commit()


async def _get_agent_or_404(
    agent_id: uuid.UUID, org_id: uuid.UUID, db: AsyncSession
) -> CustomAgent:
    result = await db.execute(
        select(CustomAgent).where(
            CustomAgent.id == agent_id,
            CustomAgent.org_id == org_id,
        )
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(404, "Agent not found")
    return agent
