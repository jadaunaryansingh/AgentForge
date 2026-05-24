from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

class Base(DeclarativeBase):
    pass

# Neon URLs usually start with postgresql:// or postgres://. 
# We need to ensure we use postgresql+asyncpg:// for async execution.
import re

db_url = settings.DATABASE_URL
if db_url:
    # Standardize scheme
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
        
    # Replace sslmode with ssl (asyncpg expects ssl)
    db_url = db_url.replace("sslmode=require", "ssl=require")
    db_url = db_url.replace("sslmode=disable", "ssl=disable")
    
    # Remove channel_binding (unsupported by asyncpg)
    db_url = re.sub(r'&?channel_binding=[^&]+', '', db_url)
    
    # Clean trailing query symbols or formatting errors
    db_url = db_url.replace("?&", "?").replace("&&", "&").rstrip("?").rstrip("&")
    
    # Ensure ssl=require is appended if it's a remote pg server and not present
    if "ssl=" not in db_url and "sqlite" not in db_url:
        if "?" in db_url:
            db_url += "&ssl=require"
        else:
            db_url += "?ssl=require"
else:
    db_url = "sqlite+aiosqlite:///./agentforge.db"

engine = create_async_engine(
    db_url,
    pool_pre_ping=True,
    # pool_size and max_overflow are only valid for queuepool (not sqlite)
    **({
        "pool_size": 10,
        "max_overflow": 20,
    } if not db_url.startswith("sqlite") else {})
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def seed_database_patterns():
    """Seed the default multi-agent design patterns in PostgreSQL if empty."""
    from app.database.models import AgentPattern
    from sqlalchemy import select
    import uuid

    DEFAULT_PATTERNS = [
        {
            "pattern_name": "Supervisor Pattern",
            "description": "A single supervisor agent coordinates and delegates tasks to specialized worker agents, managing global state and routing.",
            "ideal_use_cases": ["Complex coding projects", "Multi-stage analytical workflows", "Task-oriented assistants"],
            "langgraph_structure": {
                "nodes": ["supervisor", "worker_coder", "worker_tester", "worker_writer"],
                "edges": ["supervisor -> worker_coder", "worker_coder -> worker_tester", "worker_tester -> supervisor"]
            },
            "template_code": "# Supervisor Pattern template"
        },
        {
            "pattern_name": "RAG Pipeline Flow",
            "description": "Extracts search queries, queries a database or search API, refines context, and synthesizes answers with high accuracy.",
            "ideal_use_cases": ["Question answering over docs", "Knowledge bases", "Customer support search"],
            "langgraph_structure": {
                "nodes": ["query_generator", "retriever", "context_evaluator", "generator"],
                "edges": ["query_generator -> retriever", "retriever -> context_evaluator", "context_evaluator -> generator"]
            },
            "template_code": "# RAG Pipeline template"
        },
        {
            "pattern_name": "Plan-and-Execute",
            "description": "A planning agent divides a complex task into discrete subtasks. Executing agents run subtasks sequentially, updating progress until completion.",
            "ideal_use_cases": ["Autonomous research agents", "Complex database reporting", "Long-running multi-step jobs"],
            "langgraph_structure": {
                "nodes": ["planner", "executor", "replanner", "responder"],
                "edges": ["planner -> executor", "executor -> replanner", "replanner -> executor", "replanner -> responder"]
            },
            "template_code": "# Plan-and-Execute template"
        },
        {
            "pattern_name": "Evaluator-Optimizer (Reflection)",
            "description": "One agent creates a draft output, and another evaluates it against quality metrics, providing feedback for revision in a loop.",
            "ideal_use_cases": ["High-quality content writing", "Code generation with self-healing tests", "Translation refinement"],
            "langgraph_structure": {
                "nodes": ["generator", "evaluator"],
                "edges": ["generator -> evaluator", "evaluator -> generator", "evaluator -> END"]
            },
            "template_code": "# Evaluator-Optimizer template"
        }
    ]

    async with AsyncSessionLocal() as session:
        try:
            # Check if table already has rows
            result = await session.execute(select(AgentPattern).limit(1))
            if not result.scalar_one_or_none():
                print("[AgentForge] Seeding agent design patterns into Neon PostgreSQL...")
                for p in DEFAULT_PATTERNS:
                    pattern = AgentPattern(
                        id=uuid.uuid4(),
                        pattern_name=p["pattern_name"],
                        description=p["description"],
                        ideal_use_cases=p["ideal_use_cases"],
                        langgraph_structure=p["langgraph_structure"],
                        template_code=p["template_code"]
                    )
                    session.add(pattern)
                await session.commit()
                print("[AgentForge] Seeding completed successfully.")
            else:
                print("[AgentForge] Agent design patterns table is already populated.")
        except Exception as e:
            print(f"[AgentForge] Seeding database error: {e}")
            await session.rollback()

