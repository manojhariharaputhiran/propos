from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
import uuid


# ── Question schemas ──────────────────────────────────────────────────────────

class QuestionBase(BaseModel):
    text: str
    sort_order: int = 0


class QuestionCreate(QuestionBase):
    rfp_id: uuid.UUID


class QuestionUpdate(BaseModel):
    draft_answer: Optional[str] = None
    confidence: Optional[float] = None
    needs_sme: Optional[bool] = None
    sme_provided_answer: Optional[str] = None
    final_answer: Optional[str] = None


class QuestionOut(BaseModel):
    id: uuid.UUID
    rfp_id: uuid.UUID
    text: str
    draft_answer: Optional[str] = None
    confidence: Optional[float] = None
    needs_sme: bool = False
    sme_provided_answer: Optional[str] = None
    final_answer: Optional[str] = None
    sort_order: int = 0

    class Config:
        from_attributes = True


# ── Critic report ─────────────────────────────────────────────────────────────

class CriticReport(BaseModel):
    win_probability: int = Field(..., ge=0, le=100)
    completeness: int = Field(..., ge=0, le=100)
    persuasiveness: int = Field(..., ge=0, le=100)
    compliance: int = Field(..., ge=0, le=100)
    suggestions: List[str] = []
    critical_flags: List[str] = []


# ── RFP schemas ───────────────────────────────────────────────────────────────

class RFPCreate(BaseModel):
    org_id: uuid.UUID
    title: Optional[str] = None


class RFPOut(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    status: str
    title: Optional[str] = None
    file_name: Optional[str] = None
    raw_text: Optional[str] = None
    critic_report: Optional[dict] = None
    export_format: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionOut] = []

    class Config:
        from_attributes = True


class RFPSummary(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    status: str
    title: Optional[str] = None
    file_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    question_count: int = 0
    critic_report: Optional[dict] = None

    class Config:
        from_attributes = True


class QualifyRequest(BaseModel):
    proceed: bool
    reason: Optional[str] = None


class SMEAnswerRequest(BaseModel):
    question_id: uuid.UUID
    answer: str


class ApproveRequest(BaseModel):
    approved: bool
    notes: Optional[str] = None


# ── Organisation schemas ──────────────────────────────────────────────────────

class OrganisationOut(BaseModel):
    id: uuid.UUID
    name: str
    brand_voice: str
    default_ppt_template_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PPTTemplateUpload(BaseModel):
    name: str


# ── Custom agent schemas ──────────────────────────────────────────────────────

class AgentCreate(BaseModel):
    name: str
    type: str = Field(..., pattern="^(skill|critic)$")
    system_prompt: str
    trigger_keywords: List[str] = []
    tools: List[str] = []


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    system_prompt: Optional[str] = None
    trigger_keywords: Optional[List[str]] = None
    tools: Optional[List[str]] = None
    is_active: Optional[bool] = None


class AgentOut(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    type: str
    system_prompt: Optional[str] = None
    trigger_keywords: List[str] = []
    tools: List[str] = []
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Auth schemas ──────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: uuid.UUID
    org_id: Optional[uuid.UUID] = None
    email: str
    name: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total: int
    in_progress: int
    completed: int
    needs_review: int
