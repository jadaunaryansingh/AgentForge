from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
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
        await init_db()
        print("[AgentForge] PostgreSQL Database initialized.")
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

# ── CORS ─────────────────────────────────────────────────────────────────────
# Trusted deployment suffixes — any subdomain of these is allowed.
# This covers ALL Vercel preview URLs (e.g. web-abc123-user-projects.vercel.app)
# and ALL Netlify subdomain URLs without relying on regex or env vars.
_TRUSTED_SUFFIXES = (".vercel.app", ".netlify.app", ".render.com")

# Exact origins from settings (localhost + custom domains)
_EXACT_ORIGINS = set(settings.get_cors_origins())

_ALLOW_METHODS = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
_ALLOW_HEADERS = "Authorization, Content-Type, Accept, X-Requested-With"


def _is_allowed_origin(origin: str) -> bool:
    if not origin:
        return False
    if origin in _EXACT_ORIGINS:
        return True
    return any(origin.endswith(suffix) for suffix in _TRUSTED_SUFFIXES)


@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    """
    Custom CORS middleware that handles dynamic Vercel/Netlify preview URLs.
    Runs for every request and injects proper CORS headers.
    """
    origin = request.headers.get("origin", "")
    allowed = _is_allowed_origin(origin)

    # Handle preflight OPTIONS request immediately
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Methods": _ALLOW_METHODS,
            "Access-Control-Allow-Headers": _ALLOW_HEADERS,
            "Access-Control-Max-Age": "86400",
            "Vary": "Origin",
        }
        if allowed:
            headers["Access-Control-Allow-Origin"] = origin
            headers["Access-Control-Allow-Credentials"] = "true"
        return Response(status_code=200, headers=headers)

    # Process actual request
    response = await call_next(request)

    # Inject CORS headers on the response
    if allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"

    return response


# Mount Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(architect.router, prefix="/api/architect", tags=["architect"])


@app.get("/health")
async def health_check():
    from app.pipelines.utils import is_groq_configured, is_gemini_configured
    return {
        "status": "ok",
        "version": "1.0.0",
        "service": "AgentForge API",
        "env": settings.APP_ENV,
        "cors_origins": settings.get_cors_origins(),
        "cors_trusted_suffixes": list(_TRUSTED_SUFFIXES),
        "ai": {
            "groq_configured": is_groq_configured(),
            "gemini_configured": is_gemini_configured(),
            "demo_fallback": settings.ALLOW_DEMO_FALLBACK,
        },
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.APP_ENV == "development",
        log_level="info",
    )
