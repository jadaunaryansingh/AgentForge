import json
import logging
from groq import AsyncGroq
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import AgentPattern

logger = logging.getLogger("agentforge.planner")

SYSTEM_PROMPT = """You are an elite LangGraph Solutions Architect. Given structured project requirements and relevant design patterns, design a highly specific, professional multi-agent graph architecture.

CRITICAL INSTRUCTIONS FOR QUALITY:
1. AGENT IDENTITY & NAMES:
   - Do NOT use generic names like "coder_agent", "worker_coder", "qa_agent", "agent1", or "Code Generator".
   - Create highly specific, domain-appropriate professional titles for the `name` (e.g., "Lead Code Synthesis Engineer", "Automated Regression Test Runner", "Context-Aware Semantic Search Engine", "Recursive Optimization Reviewer").
   - Match the `id` to a clean, descriptive snake_case version of the professional title (e.g., "lead_code_synthesizer", "automated_regression_tester", "semantic_search_engine", "recursive_optimization_reviewer").

2. AGENT SYSTEM PROMPTS (DIRECTIVES):
   - The `system_prompt` must NOT be a generic single sentence.
   - It MUST be a detailed, comprehensive system prompt (80-150 words) that outlines:
     * The agent's specific role, expertise, and persona.
     * The inputs they consume and outputs they produce.
     * Exact step-by-step reasoning guidelines (e.g., ReAct, reflection, plan).
     * Operational constraints and formatting instructions (e.g., "Output code inside Markdown block", "Synthesize feedback as list").

3. AGENT DESCRIPTIONS:
   - The `description` should clearly explain the agent's unique business function and technical responsibility in the graph.

4. EDGES & LOGICAL ROUTING:
   - Every edge must have a descriptive `label` indicating the transition state or condition (e.g., "Code Draft Complete", "Validation Succeeded", "Refinement Required").
   - For router nodes, the `condition` must represent the logical path taken (e.g., "pass", "fail", "continue", "terminate").

5. STATE SCHEMA:
   - Define a detailed, application-specific State Schema. Do not just output a generic message list. Define specific fields for intermediary artifacts (e.g., `code_draft`, `test_results`, `review_feedback`, `search_queries`).

Return ONLY valid JSON matching this exact schema:
{
  "pattern_name": "string (the design pattern chosen)",
  "description": "detailed technical rationale for choosing this pattern and how the agents coordinate",
  "nodes": [
    {
      "id": "string (descriptive snake_case unique id)",
      "name": "string (highly specific, professional title)",
      "type": "agent|tool|router|memory|input|output",
      "description": "detailed functional summary",
      "model_config": {"model": "string (e.g. llama-3.3-70b-versatile)", "temperature": 0.1},
      "system_prompt": "string (comprehensive, detailed instructions, 80-150 words)",
      "tools": ["list of specific tool names related to their role"]
    }
  ],
  "edges": [
    {
      "source": "node_id",
      "target": "node_id",
      "condition": "optional condition expression for routing",
      "label": "descriptive transition label"
    }
  ],
  "entry_point": "node_id",
  "state_schema": {
    "messages": {"type": "list", "description": "Global conversation log", "reducer": "add"},
    "field_name": {"type": "string|list|dict", "description": "detailed purpose", "reducer": "optional_reducer_name"}
  },
  "memory_type": "thread|persistent|hybrid",
  "memory_strategy": {
    "type": "string",
    "storage_backend": "string",
    "description": "string"
  },
  "infrastructure": {
    "deployment_platform": "string",
    "container_strategy": "string",
    "database_tier": "string",
    "caching_strategy": "string",
    "scaling_approach": "string",
    "estimated_infra_cost_usd": 0.0
  },
  "cost_estimation": {
    "estimated_monthly_cost_usd": 0.0,
    "complexity_score": 5,
    "branching_factor": 2,
    "node_count": 4,
    "recommended_model": "string",
    "breakdown": {}
  }
}"""

STATIC_SUPERVISOR_PATTERN = {
    "pattern_name": "Supervisor Pattern",
    "description": "A single supervisor agent coordinates and delegates tasks to specialized worker agents, managing global state and routing.",
    "ideal_use_cases": ["Complex coding projects", "Multi-stage analytical workflows", "Task-oriented assistants"],
    "langgraph_structure": {
        "nodes": ["supervisor", "worker_coder", "worker_tester", "worker_writer"],
        "edges": ["supervisor -> worker_coder", "worker_coder -> worker_tester", "worker_tester -> supervisor"]
    },
    "template_code": "# Supervisor Pattern template"
}

async def search_patterns(requirements: dict, db: AsyncSession) -> list:
    """Finds matching agent design patterns in Neon PostgreSQL."""
    try:
        result = await db.execute(select(AgentPattern))
        patterns = result.scalars().all()
        
        # Format database items as dict list
        patterns_data = []
        for p in patterns:
            patterns_data.append({
                "pattern_name": p.pattern_name,
                "description": p.description,
                "ideal_use_cases": p.ideal_use_cases,
                "langgraph_structure": p.langgraph_structure,
                "template_code": p.template_code
            })
            
        if not patterns_data:
            return [STATIC_SUPERVISOR_PATTERN]
            
        # Match using keywords in description and capabilities
        query_text = f"{requirements.get('domain', '')} {requirements.get('project_name', '')}".lower()
        
        if "rag" in query_text or "search" in query_text or "retrieve" in query_text or "qa" in query_text:
            matched = [p for p in patterns_data if "rag" in p["pattern_name"].lower()]
            if matched: return matched
        elif "plan" in query_text or "execute" in query_text or "schedule" in query_text:
            matched = [p for p in patterns_data if "plan" in p["pattern_name"].lower()]
            if matched: return matched
        elif "writing" in query_text or "optimize" in query_text or "review" in query_text:
            matched = [p for p in patterns_data if "evaluator" in p["pattern_name"].lower() or "reflect" in p["pattern_name"].lower()]
            if matched: return matched
            
        return [patterns_data[0]]
    except Exception as e:
        logger.error(f"Error querying database patterns: {e}")
        return [STATIC_SUPERVISOR_PATTERN]

def get_default_fallback_graph(requirements: dict, pattern: dict) -> dict:
    """Generates a detailed dummy graph if Groq API is unavailable."""
    nodes = []
    edges = []
    
    if "rag" in pattern["pattern_name"].lower():
        nodes = [
            {
                "id": "semantic_query_analyzer",
                "name": "Semantic Query Analyzer",
                "type": "agent",
                "description": "Deconstructs incoming user prompts, resolves core intent, and generates structured vector search queries.",
                "system_prompt": "You are a Semantic Query Analyzer Agent. Your primary role is to dissect user questions, separate keywords from logical context, and formulate optimal database queries to maximize information retrieval accuracy.",
                "tools": []
            },
            {
                "id": "neon_vector_retriever",
                "name": "Neon SQL Context Retriever",
                "type": "tool",
                "description": "Queries Neon database tables using keyword matching and contextual filters.",
                "system_prompt": "",
                "tools": ["sql_search"]
            },
            {
                "id": "contextual_relevance_router",
                "name": "Contextual Relevance Router",
                "type": "router",
                "description": "Evaluates retrieved knowledge quality and dynamically routes to synthesis or query refinement.",
                "system_prompt": "You are a Contextual Relevance Router. Analyze the retrieved context against the user question. If the information is sufficient to construct a factual answer, route to synthesis. Otherwise, route back for query refinement.",
                "tools": []
            },
            {
                "id": "fact_synthesis_generator",
                "name": "Fact Synthesis Generator",
                "type": "agent",
                "description": "Synthesizes final comprehensive answers strictly based on retrieved factual context.",
                "system_prompt": "You are a Fact Synthesis Generator. Your task is to review the retrieved knowledge base documents and compile a coherent, technically precise response. Do not hallucinate any information outside the provided context.",
                "tools": []
            }
        ]
        edges = [
            {"source": "START", "target": "semantic_query_analyzer"},
            {"source": "semantic_query_analyzer", "target": "neon_vector_retriever"},
            {"source": "neon_vector_retriever", "target": "contextual_relevance_router"},
            {"source": "contextual_relevance_router", "target": "fact_synthesis_generator", "condition": "sufficient", "label": "Context Satisfied"},
            {"source": "contextual_relevance_router", "target": "semantic_query_analyzer", "condition": "insufficient", "label": "Refining Queries"},
            {"source": "fact_synthesis_generator", "target": "END"}
        ]
    else: # Supervisor Pattern default
        nodes = [
            {
                "id": "orchestration_supervisor",
                "name": "Orchestration Supervisor Agent",
                "type": "router",
                "description": "Manages global state, delegates coding and testing subtasks to specialized agents, and determines workflow termination.",
                "system_prompt": "You are the Orchestration Supervisor. Your role is to coordinate a team of developer and tester agents. Review the state history, delegate tasks to the appropriate team members, and merge final results when all criteria are satisfied.",
                "tools": []
            },
            {
                "id": "lead_software_engineer",
                "name": "Lead Software Engineer Agent",
                "type": "agent",
                "description": "Synthesizes Python scripts and software architectures according to specifications.",
                "system_prompt": "You are a Lead Software Engineer Agent. You write complete, highly optimized, and clean Python scripts conforming to pep8 standards based on task instructions received from the supervisor.",
                "tools": ["terminal"]
            },
            {
                "id": "automated_qa_test_runner",
                "name": "Automated QA Test Runner Agent",
                "type": "agent",
                "description": "Executes testing suites, parses output logs, and evaluates test coverage metrics.",
                "system_prompt": "You are an Automated QA Test Runner Agent. Your job is to construct robust test files, execute them in a mock validation environment, and return granular pass/fail statistics along with error tracebacks.",
                "tools": ["test_runner"]
            }
        ]
        edges = [
            {"source": "START", "target": "orchestration_supervisor"},
            {"source": "orchestration_supervisor", "target": "lead_software_engineer", "condition": "needs_code", "label": "Delegate Coding"},
            {"source": "orchestration_supervisor", "target": "automated_qa_test_runner", "condition": "needs_test", "label": "Delegate Testing"},
            {"source": "lead_software_engineer", "target": "orchestration_supervisor", "label": "Review Code Draft"},
            {"source": "automated_qa_test_runner", "target": "orchestration_supervisor", "label": "Review Test Results"},
            {"source": "orchestration_supervisor", "target": "END", "condition": "complete", "label": "Finalize Solution"}
        ]
        
    return {
        "pattern_name": pattern["pattern_name"],
        "description": pattern["description"],
        "nodes": nodes,
        "edges": edges,
        "entry_point": nodes[0]["id"],
        "state_schema": {
            "messages": {"type": "list", "description": "Chat log history", "reducer": "add"},
            "current_task": {"type": "str", "description": "The current task index", "reducer": None}
        },
        "memory_type": "thread",
        "memory_strategy": {
            "type": "Short-Term Threading",
            "storage_backend": "MemorySaver (Local Client)",
            "description": "Retains message history across threads"
        },
        "infrastructure": {
            "deployment_platform": "AWS ECS (Fargate)",
            "container_strategy": "Docker containerized FastAPI runner",
            "database_tier": "Neon Postgres Dev tier",
            "caching_strategy": "Redis Cache",
            "scaling_approach": "CPU-utilization auto-scaling",
            "estimated_infra_cost_usd": 30.0
        },
        "cost_estimation": {
            "estimated_monthly_cost_usd": 120.0,
            "complexity_score": 6,
            "branching_factor": 2,
            "node_count": len(nodes),
            "recommended_model": "llama-3.3-70b-versatile",
            "breakdown": {
                "LLM Invocations": 75.0,
                "Caching": 15.0,
                "Database Queries": 30.0
            }
        }
    }

async def plan_graph_architecture(requirements: dict, db: AsyncSession) -> dict:
    # 1. Fetch relevant template context from database patterns
    matched_patterns = await search_patterns(requirements, db)
    pattern_context = matched_patterns[0] if matched_patterns else STATIC_SUPERVISOR_PATTERN
    
    # Check if Groq key is configured
    is_valid_key = settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("your_")
    
    if not is_valid_key:
        logger.warning("Groq API key not configured or is placeholder. Using mock graph planning solver.")
        return get_default_fallback_graph(requirements, pattern_context)

    try:
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        user_prompt_content = f"""Structured Requirements:
{json.dumps(requirements, indent=2)}

Recommended Base Pattern Template:
{json.dumps(pattern_context, indent=2)}

Please design a comprehensive LangGraph multi-agent architecture JSON configuration tailored to these requirements."""

        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt_content},
            ],
            temperature=0.3,
            max_tokens=4000,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Error in graph planner: {e}. Falling back to default pattern matching.")
        return get_default_fallback_graph(requirements, pattern_context)
