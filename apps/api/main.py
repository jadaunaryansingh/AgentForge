from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
import os

# Ensure the apps/api folder is in Python search path for clean module importing
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.database.connection import init_db, seed_database_patterns
from app.api import auth, projects, architect

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("[AgentForge] Starting up...")
    try:
        # Initialize PostgreSQL models
        await init_db()
        print("[AgentForge] PostgreSQL Database initialized.")
        
        # Seed design patterns directly in Neon DB
        await seed_database_patterns()
    except Exception as e:
        print(f"[AgentForge] Database initialization/seeding error: {e}")
        
    yield
    print("[AgentForge] Shutting down...")

app = FastAPI(
    title="AgentForge API",
    description="AI Solutions Architect backend powering LangGraph architecture generation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
    lifespan=lifespan,
)

# CORS configuration
origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(architect.router, prefix="/api/architect", tags=["architect"])

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "version": "1.0.0", 
        "service": "AgentForge API",
        "env": settings.APP_ENV,
        "cors_origins": settings.get_cors_origins()
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.APP_ENV == "development",
        log_level="info",
    )
