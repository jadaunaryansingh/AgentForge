import google.generativeai as genai
from app.core.config import settings
import re
import logging

logger = logging.getLogger("agentforge.diagrams")

# Cache the configured Gemini model to avoid re-initialization on each call
_gemini_model = None

def get_gemini_model():
    global _gemini_model
    if _gemini_model is None:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel(settings.GEMINI_MODEL)
    return _gemini_model

def generate_mermaid_programmatic(graph: dict) -> str:
    """Fallback generator to compile a styled Mermaid diagram directly from the JSON."""
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    
    # Custom Mermaid styling classes
    lines = [
        "flowchart LR",
        "    %% Node definitions with shapes",
    ]
    
    # Unique types definition
    for n in nodes:
        node_id = n["id"]
        name = n["name"]
        ntype = n.get("type", "agent").lower()
        
        # Determine shapes
        if ntype == "agent":
            lines.append(f'    {node_id}["🤖 {name}"]')
        elif ntype == "tool":
            lines.append(f'    {node_id}[/"🛠️ {name}"/]')
        elif ntype == "router":
            lines.append(f'    {node_id}{{{{"🔀 {name}"}}}}')
        elif ntype == "memory":
            lines.append(f'    {node_id}[("{name}")]')
        elif ntype in ["input", "output", "start", "end"]:
            lines.append(f'    {node_id}(["{name}"])')
        else:
            lines.append(f'    {node_id}["{name}"]')

    # Add default nodes if start/end not present in definition
    has_start = any(e["source"] == "START" for e in edges)
    has_end = any(e["target"] == "END" for e in edges)
    
    if has_start:
        lines.append('    START(["🎯 Start"])')
    if has_end:
        lines.append('    END(["🏁 End"])')

    lines.append("")
    lines.append("    %% Flow edges")
    
    for idx, e in enumerate(edges):
        src = e["source"]
        tgt = e["target"]
        cond = e.get("condition")
        label = e.get("label", "")
        
        # Link rendering
        arrow = "-->"
        if cond:
            edge_label = label if label else cond
            lines.append(f'    {src} -- "{edge_label}" {arrow} {tgt}')
        else:
            lines.append(f'    {src} {arrow} {tgt}')

    # Apply CSS classes for glow and glassmorphism styling
    lines += [
        "",
        "    %% Style declarations",
        "    classDef agent fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff;",
        "    classDef tool fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff;",
        "    classDef router fill:#581c87,stroke:#c084fc,stroke-width:2px,color:#fff;",
        "    classDef memory fill:#1c1917,stroke:#a8a29e,stroke-width:2px,color:#fff;",
        "    classDef start_end fill:#0c4a6e,stroke:#38bdf8,stroke-width:2px,color:#fff;",
    ]

    for n in nodes:
        ntype = n.get("type", "agent").lower()
        if ntype in ["agent", "tool", "router", "memory"]:
            lines.append(f"    class {n['id']} {ntype};")
        else:
            lines.append(f"    class {n['id']} start_end;")
            
    if has_start:
        lines.append("    class START start_end;")
    if has_end:
        lines.append("    class END start_end;")

    return "\n".join(lines)

def sanitize_mermaid_code(code: str) -> str:
    """Cleans Mermaid syntax errors, particularly around styling classes list with spaces."""
    if not code:
        return ""
    lines = []
    for line in code.split("\n"):
        trimmed = line.strip()
        # Fix class declarations with comma-spaces (e.g. class START, END style;)
        if trimmed.startswith("class ") and not trimmed.startswith("classDef "):
            parts = trimmed.split()
            if len(parts) >= 3:
                class_name = parts[-1]
                nodes_str = "".join(parts[1:-1])
                lines.append(f"    class {nodes_str} {class_name}")
                continue
        lines.append(line)
    return "\n".join(lines)

async def generate_mermaid_diagram(graph: dict) -> str:
    """Use Gemini to generate a beautiful Mermaid.js flowchart from graph JSON."""
    is_valid_key = settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("your_")
    
    if not is_valid_key:
        logger.info("Gemini key is missing. Creating programmatic Mermaid diagram.")
        return generate_mermaid_programmatic(graph)

    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    pattern = graph.get("pattern_name", "Custom Agentic System")

    nodes_summary = "\n".join(f"- {n['id']}: {n['name']} (Type: {n['type']}, Description: {n.get('description', '')})" for n in nodes)
    edges_summary = "\n".join(f"- {e['source']} -> {e['target']}" + (f" [Routes if: {e['condition']}]" if e.get("condition") else "") for e in edges)

    prompt = f"""You are a senior system solutions engineer and diagram mapping expert. Convert this LangGraph agent architecture structure into a professional, visually clean Mermaid.js flowchart.

Architecture Pattern: {pattern}

Nodes:
{nodes_summary}

Edges:
{edges_summary}

Generate a clear, clean Mermaid flowchart using `flowchart LR` (Left-to-Right).
Map the node shapes precisely:
- Agents (type: agent) -> use rounded corners `node_id["🤖 Name"]`
- Tools (type: tool) -> use parallelograms `node_id[/"🛠️ Name"/]`
- Routers (type: router) -> use diamonds `node_id{{"🔀 Name"}}`
- Memory (type: memory) -> use cylinders `node_id[("💾 Name")]`
- START / END nodes -> use stadium nodes `START(["🎯 Start"])` / `END(["🏁 End"])`

Include custom style class definitions to add futuristic high-tech colors:
1. Indigo style for Agents (e.g. fill:#1e1b4b, stroke:#818cf8, color:#fff)
2. Emerald green style for Tools (e.g. fill:#064e3b, stroke:#34d399, color:#fff)
3. Purple style for Routers/Deciders (e.g. fill:#581c87, stroke:#c084fc, color:#fff)
4. Slate style for Memory/Databases (e.g. fill:#1c1917, stroke:#a8a29e, color:#fff)
5. Deep blue style for Start/End endpoints (e.g. fill:#0c4a6e, stroke:#38bdf8, color:#fff)

CRITICAL PROMPT GUIDELINES FOR MERMAID:
1. Always enclose node labels in double quotes inside the shapes, e.g. node_id["🤖 Label Name"].
2. When applying style classes to nodes, do NOT list multiple nodes separated by commas with spaces (e.g. do NOT write 'class START, END start_end;'). Instead, apply the class to each node individually on its own line (e.g. write 'class START start_end;' and 'class END start_end;' on separate lines).

Return ONLY the Mermaid code block. Do NOT surround it in markdown tags or comments. Just the raw code starting with 'flowchart LR'."""

    try:
        model = get_gemini_model()
        response = await model.generate_content_async(prompt)
        text = response.text
        
        # Remove any Markdown code fences if included
        match = re.search(r'```(?:mermaid)?\s*([\s\S]+?)```', text)
        if match:
            return sanitize_mermaid_code(match.group(1).strip())
        
        return sanitize_mermaid_code(text.strip())
    except Exception as e:
        logger.error(f"Failed to generate Mermaid diagram via Gemini: {e}. Compiling programmatically.")
        return generate_mermaid_programmatic(graph)
