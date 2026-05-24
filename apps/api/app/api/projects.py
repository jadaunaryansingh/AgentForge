from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.connection import get_db
from app.database.models import User, Project, Architecture
from app.schemas.projects import ProjectCreate, ProjectResponse, ProjectListResponse
from app.core.security import get_current_user
import uuid

router = APIRouter()

async def get_user_from_token(current_user: dict, db: AsyncSession) -> User:
    email = current_user.get("email")
    if not email:
        # Fallback to local token id
        sub = current_user.get("sub")
        if sub:
            try:
                user_id = uuid.UUID(sub)
                result = await db.execute(select(User).where(User.id == user_id))
                user = result.scalar_one_or_none()
                if user:
                    return user
            except ValueError:
                pass
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found. Please sync your account first."
        )
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        # Auto-create/sync user in background for smoother UX
        display_name = current_user.get("name") or current_user.get("display_name") or email.split("@")[0]
        user = User(
            id=uuid.uuid4(),
            email=email,
            display_name=display_name,
            avatar_url=current_user.get("picture") or current_user.get("avatar_url")
        )
        db.add(user)
        await db.flush()
    return user

@router.get("", response_model=ProjectListResponse)
async def list_projects(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_from_token(current_user, db)
    result = await db.execute(
        select(Project).where(Project.user_id == user.id).order_by(Project.updated_at.desc())
    )
    projects = result.scalars().all()
    project_list = []
    for p in projects:
        arch_count_result = await db.execute(
            select(func.count(Architecture.id)).where(Architecture.project_id == p.id)
        )
        count = arch_count_result.scalar() or 0
        project_list.append(ProjectResponse(
            id=p.id, 
            name=p.name, 
            description=p.description, 
            tags=p.tags or [],
            created_at=p.created_at, 
            updated_at=p.updated_at, 
            architecture_count=count,
        ))
    return ProjectListResponse(projects=project_list, total=len(project_list))

@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    payload: ProjectCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_from_token(current_user, db)
    project = Project(
        id=uuid.uuid4(),
        user_id=user.id,
        name=payload.name,
        description=payload.description,
        tags=payload.tags or [],
    )
    db.add(project)
    await db.flush()
    return ProjectResponse(
        id=project.id, 
        name=project.name, 
        description=project.description,
        tags=project.tags or [], 
        created_at=project.created_at,
        updated_at=project.updated_at, 
        architecture_count=0,
    )

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_from_token(current_user, db)
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    arch_count_result = await db.execute(
        select(func.count(Architecture.id)).where(Architecture.project_id == project.id)
    )
    count = arch_count_result.scalar() or 0
    return ProjectResponse(
        id=project.id, 
        name=project.name, 
        description=project.description,
        tags=project.tags or [], 
        created_at=project.created_at,
        updated_at=project.updated_at, 
        architecture_count=count,
    )

@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_from_token(current_user, db)
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
