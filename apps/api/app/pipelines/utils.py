"""Shared helpers for architect pipelines."""
from app.core.config import settings


def is_groq_configured() -> bool:
    key = (settings.GROQ_API_KEY or "").strip()
    return bool(key) and not key.lower().startswith("your_")


def is_gemini_configured() -> bool:
    key = (settings.GEMINI_API_KEY or "").strip()
    return bool(key) and not key.lower().startswith("your_")


def normalize_graph_definition(graph: dict) -> dict:
    """Normalize LLM output so API and UI share one graph shape."""
    if not graph:
        return graph

    normalized = dict(graph)
    nodes_out = []

    for index, node in enumerate(graph.get("nodes") or []):
        if isinstance(node, str):
            nodes_out.append({
                "id": node,
                "name": node.replace("_", " ").title(),
                "type": "agent",
                "description": "",
                "tools": [],
            })
            continue

        item = dict(node)
        if "model_config_data" not in item and item.get("model_config"):
            item["model_config_data"] = item["model_config"]
        if "model_config" not in item and item.get("model_config_data"):
            item["model_config"] = item["model_config_data"]

        item.setdefault("id", f"node_{index}")
        item.setdefault("name", item["id"].replace("_", " ").title())
        item.setdefault("type", "agent")
        item.setdefault("description", "")
        item.setdefault("tools", item.get("tools") or [])
        nodes_out.append(item)

    normalized["nodes"] = nodes_out

    edges_out = []
    for edge in graph.get("edges") or []:
        if isinstance(edge, dict):
            edges_out.append(dict(edge))
    normalized["edges"] = edges_out

    if not normalized.get("entry_point") and nodes_out:
        normalized["entry_point"] = nodes_out[0]["id"]

    normalized.setdefault("state_schema", {})
    normalized.setdefault("memory_type", "thread")

    return normalized
