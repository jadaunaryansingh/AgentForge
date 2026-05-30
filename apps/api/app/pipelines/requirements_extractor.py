import json
import logging
from groq import AsyncGroq
from app.core.config import settings
from app.pipelines.utils import is_groq_configured, is_gemini_configured

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
    # 1. Try Groq if configured
    if is_groq_configured():
        try:
            llm_model = model or settings.GROQ_MODEL
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
            logger.error(f"Error in Groq requirements extractor: {e}")
            if not is_gemini_configured():
                if settings.ALLOW_DEMO_FALLBACK:
                    logger.warning("Falling back to demo requirements after Groq error.")
                    return _demo_requirements(prompt)
                raise RequirementsExtractionError(f"Groq requirements extraction failed: {e}") from e

    # 2. Robust fallback to Gemini if configured
    if is_gemini_configured():
        try:
            logger.info("Using Gemini for requirements extraction...")
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            gemini_model = genai.GenerativeModel(
                settings.GEMINI_MODEL,
                generation_config={"response_mime_type": "application/json"}
            )
            response = await gemini_model.generate_content_async(
                f"{SYSTEM_PROMPT}\n\nProject Description:\n{prompt}"
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Error in Gemini requirements extractor: {e}")
            if settings.ALLOW_DEMO_FALLBACK:
                logger.warning("Falling back to demo requirements after Gemini error.")
                return _demo_requirements(prompt)
            raise RequirementsExtractionError(f"Gemini requirements extraction failed: {e}") from e

    # 3. Fallback to demo mode if nothing is configured
    if settings.ALLOW_DEMO_FALLBACK:
        logger.warning("No LLM keys configured. Using demo requirements.")
        return _demo_requirements(prompt)

    raise RequirementsExtractionError(
        "Both GROQ_API_KEY and GEMINI_API_KEY are missing, invalid, or returned errors."
    )
