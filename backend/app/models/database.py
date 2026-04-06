from sqlalchemy import (
    Column, String, Text, Float, Boolean, Integer, ForeignKey,
    DateTime, JSON, ARRAY, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, relationship
import uuid

from app.core.config import settings


# Convert sync postgres:// URL to async asyncpg URL
def _make_async_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


engine = create_async_engine(
    _make_async_url(settings.database_url),
    echo=settings.debug,
    pool_pre_ping=True,
)

async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Organisation(Base):
    __tablename__ = "organisations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    brand_voice = Column(Text, default="professional")
    default_ppt_template_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    rfps = relationship("RFP", back_populates="organisation")
    custom_agents = relationship("CustomAgent", back_populates="organisation")
    users = relationship("User", back_populates="organisation")


class RFP(Base):
    __tablename__ = "rfps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=False)
    status = Column(Text, nullable=False, default="uploaded")
    title = Column(Text, nullable=True)
    raw_text = Column(Text, nullable=True)
    file_name = Column(Text, nullable=True)
    critic_report = Column(JSON, nullable=True)
    export_format = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organisation = relationship("Organisation", back_populates="rfps")
    questions = relationship("Question", back_populates="rfp", order_by="Question.sort_order")


class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    text = Column(Text, nullable=False)
    draft_answer = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    needs_sme = Column(Boolean, default=False)
    sme_provided_answer = Column(Text, nullable=True)
    final_answer = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)

    rfp = relationship("RFP", back_populates="questions")


class CustomAgent(Base):
    __tablename__ = "custom_agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=False)
    name = Column(Text, nullable=False)
    type = Column(Text, nullable=False)  # 'skill' or 'critic'
    system_prompt = Column(Text, nullable=True)
    trigger_keywords = Column(ARRAY(Text), default=[])
    tools = Column(ARRAY(Text), default=[])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organisation = relationship("Organisation", back_populates="custom_agents")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=True)
    email = Column(Text, unique=True, nullable=False)
    name = Column(Text, nullable=True)
    provider = Column(Text, nullable=True)
    provider_id = Column(Text, nullable=True)
    role = Column(Text, default="member")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organisation = relationship("Organisation", back_populates="users")


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
