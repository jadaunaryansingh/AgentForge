from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.connection import get_db
from app.database.models import User, Project, Architecture, ExportLog
from app.schemas.architect import ArchitectRequest, ArchitectureResponse, GraphDefinition, CostEstimation, InfraRecommendation
from app.core.security import get_current_user
from app.core.config import settings
from app.pipelines.requirements_extractor import extract_requirements, RequirementsExtractionError
from app.pipelines.graph_planner import plan_graph_architecture, GraphPlanningError
from app.pipelines.utils import is_groq_configured, normalize_graph_definition
from app.pipelines.langgraph_codegen import generate_langgraph_code
from app.pipelines.diagram_generator import generate_mermaid_diagram

import json
import uuid
import asyncio
import io
import zipfile
import os
from datetime import datetime, timezone
import logging

logger = logging.getLogger("agentforge.architect")
router = APIRouter()

async def get_user_from_token(current_user: dict, db: AsyncSession) -> User:
    email = current_user.get("email")
    if not email:
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
        raise HTTPException(status_code=404, detail="User not found. Please sync your account.")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please sync your account.")
    return user

@router.post("/stream")
async def stream_architecture(
    payload: ArchitectRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Streams SSE events as the AI Solution Architect structures the LangGraph pipeline."""
    user = await get_user_from_token(current_user, db)
    
    # Verify project belongs to user
    proj_result = await db.execute(
        select(Project).where(Project.id == payload.project_id, Project.user_id == user.id)
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    async def event_generator():
        from app.database.connection import AsyncSessionLocal
        async with AsyncSessionLocal() as local_db:
            try:
                target_model = payload.target_model or settings.GROQ_MODEL
                ai_mode = "live" if is_groq_configured() else ("demo" if settings.ALLOW_DEMO_FALLBACK else "unconfigured")
                yield f"event: phase\ndata: {json.dumps({'phase': 'started', 'message': 'Connecting to Groq...', 'ai_mode': ai_mode, 'model': target_model})}\n\n"

                # Step 1: Requirements Extraction
                yield f"event: phase\ndata: {json.dumps({'phase': 'extracting', 'message': 'Parsing prompt requirements using Groq...', 'model': target_model})}\n\n"
                requirements = await extract_requirements(payload.prompt, model=target_model)
                yield f"event: phase\ndata: {json.dumps({'phase': 'extracted', 'requirements': requirements})}\n\n"
                
                # Step 2: Architecture Graph Planning
                yield f"event: phase\ndata: {json.dumps({'phase': 'planning', 'message': 'Searching patterns and compiling multi-agent topology...', 'model': target_model})}\n\n"
                graph = await plan_graph_architecture(requirements, local_db, model=target_model)
                yield f"event: phase\ndata: {json.dumps({'phase': 'planned', 'graph': graph})}\n\n"

                # Steps 3 & 4: Code generation (sync) and Mermaid diagram (async Gemini) — run concurrently
                yield f"event: phase\ndata: {json.dumps({'phase': 'codegen', 'message': 'Synthesizing LangGraph code and Mermaid diagram concurrently...'})}\n\n"

                loop = asyncio.get_event_loop()
                code_future = loop.run_in_executor(None, generate_langgraph_code, graph)
                diagram_future = generate_mermaid_diagram(graph)

                code, diagram = await asyncio.gather(code_future, diagram_future)

                yield f"event: phase\ndata: {json.dumps({'phase': 'code_generated', 'code': code})}\n\n"
                yield f"event: phase\ndata: {json.dumps({'phase': 'visualized', 'diagram': diagram})}\n\n"

                # Step 5: Save to Database
                yield f"event: phase\ndata: {json.dumps({'phase': 'saving', 'message': 'Writing architecture records to Neon PostgreSQL...'})}\n\n"
                
                # Fetch fresh project in local session
                proj_res = await local_db.execute(
                    select(Project).where(Project.id == payload.project_id)
                )
                local_project = proj_res.scalar_one_or_none()
                if not local_project:
                    raise Exception("Project not found in current streaming session")

                # Get latest version number
                version_result = await local_db.execute(
                    select(func.max(Architecture.version)).where(Architecture.project_id == local_project.id)
                )
                current_max = version_result.scalar() or 0
                new_version = current_max + 1

                architecture = Architecture(
                    id=uuid.uuid4(),
                    project_id=local_project.id,
                    version=new_version,
                    prompt=payload.prompt,
                    graph_definition=graph,
                    memory_strategy=graph.get("memory_strategy"),
                    infrastructure_recommendations=graph.get("infrastructure"),
                    cost_estimation=graph.get("cost_estimation"),
                    diagram_mermaid=diagram,
                    generated_code=code,
                    created_at=datetime.now(timezone.utc)
                )
                
                local_db.add(architecture)
                # Update project timestamp
                local_project.updated_at = datetime.now(timezone.utc)
                local_db.add(local_project)
                
                await local_db.commit()
                
                yield f"event: phase\ndata: {json.dumps({'phase': 'completed', 'architecture_id': str(architecture.id), 'version': new_version})}\n\n"
                
            except (RequirementsExtractionError, GraphPlanningError) as e:
                logger.error(f"Architect pipeline error: {e}")
                await local_db.rollback()
                yield f"event: error\ndata: {json.dumps({'error': str(e), 'code': 'llm_unavailable'})}\n\n"
            except Exception as e:
                logger.error(f"Error in SSE stream: {e}", exc_info=True)
                await local_db.rollback()
                yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/history/{project_id}", response_model=list[ArchitectureResponse])
async def get_architecture_history(
    project_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves all past architecture revisions generated under a project."""
    user = await get_user_from_token(current_user, db)
    
    # Verify project
    proj_result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(Architecture).where(Architecture.project_id == project_id).order_by(Architecture.version.desc())
    )
    return result.scalars().all()

@router.get("/latest/{project_id}", response_model=ArchitectureResponse)
async def get_latest_architecture(
    project_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Gets the latest version of a generated architecture for a project."""
    user = await get_user_from_token(current_user, db)
    
    # Verify project
    proj_result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(Architecture)
        .where(Architecture.project_id == project_id)
        .order_by(Architecture.version.desc())
        .limit(1)
    )
    arch = result.scalar_one_or_none()
    if not arch:
        raise HTTPException(status_code=404, detail="No architectures generated yet for this project")
    return arch

@router.post("/export/{architecture_id}")
async def export_architecture(
    architecture_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bundles the generated LangGraph codebase into an exportable zip file."""
    user = await get_user_from_token(current_user, db)
    
    # Verify architecture exists and project belongs to user
    result = await db.execute(
        select(Architecture)
        .join(Project, Architecture.project_id == Project.id)
        .where(Architecture.id == architecture_id, Project.user_id == user.id)
    )
    arch = result.scalar_one_or_none()
    if not arch:
        raise HTTPException(status_code=404, detail="Architecture configuration not found")

    # Log export transaction
    log = ExportLog(
        id=uuid.uuid4(),
        architecture_id=arch.id,
        format="zip",
        exported_at=datetime.now(timezone.utc)
    )
    db.add(log)

    # Compile zip file in memory
    zip_buffer = io.BytesIO()
    
    readme_content = f"""# {arch.graph_definition.get('pattern_name', 'AgentForge LangGraph System')}
This multi-agent workflow was generated using **AgentForge AI Solutions Architect**.

## Description
{arch.graph_definition.get('description', 'An automated agentic pipeline.')}

## Architecture Topology (Mermaid)
```mermaid
{arch.diagram_mermaid}
```

## System Requirements
- Python 3.10+
- Groq Cloud API Key (configured in environment)

## Getting Started
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure your environment:
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your-groq-api-key-here
   ```
3. Run the application:
   ```bash
   python main.py
   ```
"""

    requirements_content = """langgraph>=0.1.4
langchain-core>=0.2.0
langchain-groq>=0.1.3
python-dotenv>=1.0.1
"""

    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        zip_file.writestr("README.md", readme_content)
        zip_file.writestr("requirements.txt", requirements_content)
        zip_file.writestr("main.py", arch.generated_code)
        
        # Add a placeholder sample configuration file
        zip_file.writestr(".env.example", "GROQ_API_KEY=your_groq_api_key_here\n")

    zip_buffer.seek(0)
    
    # Return ZIP file as streaming attachment response
    filename = f"agentforge_{arch.id.hex[:8]}_v{arch.version}.zip"
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    return StreamingResponse(
        io.BytesIO(zip_buffer.getvalue()),
        media_type="application/zip",
        headers=headers
    )
