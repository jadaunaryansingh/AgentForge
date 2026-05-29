import json
import logging
from groq import AsyncGroq
from app.core.config import settings
from app.pipelines.utils import is_groq_configured

logger = logging.getLogger("agentforge.requirements")

# Reuse a single client instance to avoid repeated TCP connection setup
_groq_client: AsyncGroq | None = None

def get_groq_client() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        _groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _groq_client

SYSTEM_PROMPT = """You are an expert AI Systems Analyst. Your task is to analyze a project description and extract structured requirements for building an agentic AI system.

Return ONLY valid JSON with this exact schema:
{
  "project_name": "string",
  "domain": "string (e.g., coding assistant, data analysis, customer support)",
  "complexity": "low|medium|high|enterprise",
  "key_capabilities": ["list of required capabilities"],
  "user_interaction_type": "conversational|automated|hybrid",
  "data_sources": ["list of data sources/APIs mentioned"],
  "performance_requirements": "string",
  "integration_needs": ["list of integrations"],
  "constraints": ["list of constraints or limitations"],
  "suggested_agent_types": ["list of agent types needed"],
  "memory_needs": "none|short-term|long-term|hybrid",
  "tool_categories": ["search", "code", "data", "communication"]
}"""


class RequirementsExtractionError(Exception):
    """Raised when requirements cannot be extracted from the LLM."""


def _demo_requirements(prompt: str) -> dict:
    """Prompt-aware demo payload (only when ALLOW_DEMO_FALLBACK is enabled)."""
    snippet = (prompt or "Custom workflow").strip()[:80]
    return {
        "project_name": snippet or "Custom Agent System",
        "domain": snippet,
        "complexity": "medium",
        "key_capabilities": ["AI orchestration", "Task automation"],
        "user_interaction_type": "conversational",
        "data_sources": ["User input"],
        "performance_requirements": "Standard latency",
        "integration_needs": ["REST APIs"],
        "constraints": ["Configure GROQ_API_KEY for live generation"],
        "suggested_agent_types": ["Supervisor Agent", "Worker Agent"],
        "memory_needs": "short-term",
        "tool_categories": ["search", "code"],
        "_demo_mode": True,
    }


async def extract_requirements(prompt: str, model: str | None = None) -> dict:
    llm_model = model or settings.GROQ_MODEL

    if not is_groq_configured():
        if settings.ALLOW_DEMO_FALLBACK:
            logger.warning("Groq API key not configured. Using demo requirements (ALLOW_DEMO_FALLBACK=true).")
            return _demo_requirements(prompt)
        raise RequirementsExtractionError(
            "GROQ_API_KEY is missing or still a placeholder. Set a valid key in apps/api/.env and restart the API."
        )

    try:
        client = get_groq_client()
        response = await client.chat.completions.create(
            model=llm_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Project Description:\n{prompt}"},
            ],
            temperature=0.2,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Error in requirements extractor: {e}")
        if settings.ALLOW_DEMO_FALLBACK:
            logger.warning("Falling back to demo requirements after Groq error.")
            return _demo_requirements(prompt)
        raise RequirementsExtractionError(f"Groq requirements extraction failed: {e}") from e
