from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, List

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime
    architecture_count: int = 0

    model_config = {"from_attributes": True}

class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int
