import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.connection import Base

def now_utc():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    last_login: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    projects: Mapped[list["Project"]] = relationship("Project", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    user: Mapped["User"] = relationship("User", back_populates="projects")
    architectures: Mapped[list["Architecture"]] = relationship("Architecture", back_populates="project", cascade="all, delete-orphan")

class Architecture(Base):
    __tablename__ = "architectures"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    graph_definition: Mapped[dict] = mapped_column(JSON, nullable=True)
    memory_strategy: Mapped[dict] = mapped_column(JSON, nullable=True)
    infrastructure_recommendations: Mapped[dict] = mapped_column(JSON, nullable=True)
    cost_estimation: Mapped[dict] = mapped_column(JSON, nullable=True)
    diagram_mermaid: Mapped[str] = mapped_column(Text, nullable=True)
    generated_code: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    project: Mapped["Project"] = relationship("Project", back_populates="architectures")
    export_logs: Mapped[list["ExportLog"]] = relationship("ExportLog", back_populates="architecture", cascade="all, delete-orphan")

class ExportLog(Base):
    __tablename__ = "export_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    architecture_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("architectures.id", ondelete="CASCADE"), nullable=False)
    format: Mapped[str] = mapped_column(String(50), nullable=False)
    exported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    architecture: Mapped["Architecture"] = relationship("Architecture", back_populates="export_logs")

class AgentPattern(Base):
    __tablename__ = "agent_patterns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pattern_name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    ideal_use_cases: Mapped[list] = mapped_column(JSON, default=list)
    langgraph_structure: Mapped[dict] = mapped_column(JSON, default=dict)
    template_code: Mapped[str] = mapped_column(Text, nullable=True)

