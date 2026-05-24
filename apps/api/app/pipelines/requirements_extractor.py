import json
import logging
from groq import AsyncGroq
from app.core.config import settings

logger = logging.getLogger("agentforge.requirements")

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

async def extract_requirements(prompt: str) -> dict:
    # Check if API key is valid
    is_valid_key = settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("your_")
    
    if not is_valid_key:
        logger.warning("Groq API key not configured or is a placeholder. Using mock requirements extractor.")
        return {
            "project_name": "AgentForge Generated App",
            "domain": "Generic AI Agent System",
            "complexity": "medium",
            "key_capabilities": ["AI orchestration", "Task automation", "API integration"],
            "user_interaction_type": "conversational",
            "data_sources": ["User input files", "External APIs"],
            "performance_requirements": "Latency under 2 seconds per step",
            "integration_needs": ["REST APIs"],
            "constraints": ["Rate limits of LLM providers"],
            "suggested_agent_types": ["Supervisor Agent", "Execution Worker"],
            "memory_needs": "short-term",
            "tool_categories": ["search", "code"]
        }

    try:
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
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
        logger.error(f"Error in requirements extractor: {e}. Falling back to default payload.")
        return {
            "project_name": "AgentForge Recovered App",
            "domain": "Custom Multi-Agent Agentic Workflow",
            "complexity": "medium",
            "key_capabilities": ["Fallback processing", "Dynamic routing"],
            "user_interaction_type": "hybrid",
            "data_sources": [],
            "performance_requirements": "Standard latency",
            "integration_needs": [],
            "constraints": ["API availability"],
            "suggested_agent_types": ["Supervisor"],
            "memory_needs": "short-term",
            "tool_categories": []
        }
