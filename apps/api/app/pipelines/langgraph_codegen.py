from typing import Any

def generate_langgraph_code(graph: dict) -> str:
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    state_schema = graph.get("state_schema", {})
    entry_point = graph.get("entry_point", "")
    memory_type = graph.get("memory_type", "thread")

    lines = [
        '"""',
        f'AgentForge Generated LangGraph Architecture',
        f'Pattern: {graph.get("pattern_name", "Custom Multi-Agent Flow")}',
        f'Memory: {memory_type.capitalize()} State Tracking',
        '"""',
        "",
        "from typing import Annotated, TypedDict, Optional, Literal, List, Dict, Any",
        "from langgraph.graph import StateGraph, END, START",
        "from langgraph.checkpoint.memory import MemorySaver",
        "from langchain_groq import ChatGroq",
        "from langchain_core.messages import HumanMessage, AIMessage, BaseMessage, SystemMessage",
        "import operator",
        "",
        "",
        "# ── State Definition ──────────────────────────────────────",
        "class AgentState(TypedDict):",
    ]

    # Render state fields
    has_messages = False
    for field_name, field_info in state_schema.items():
        if field_name == "messages":
            has_messages = True
        field_type_str = field_info.get("type", "str")
        # Map JSON types to Python types
        type_mapping = {
            "str": "str",
            "string": "str",
            "int": "int",
            "integer": "int",
            "float": "float",
            "bool": "bool",
            "boolean": "bool",
            "list": "List[Any]",
            "dict": "Dict[str, Any]",
            "object": "Dict[str, Any]"
        }
        py_type = type_mapping.get(field_type_str.lower(), "Any")
        reducer = field_info.get("reducer")
        
        if reducer == "add" or (field_name == "messages" and reducer is None):
            lines.append(f"    {field_name}: Annotated[List[BaseMessage], operator.add]")
            has_messages = True
        elif reducer:
            lines.append(f"    {field_name}: Annotated[{py_type}, operator.{reducer}]")
        else:
            lines.append(f"    {field_name}: Optional[{py_type}]")

    # Safe default state schema
    if not state_schema or not has_messages:
        if "messages" not in state_schema:
            lines.append("    messages: Annotated[List[BaseMessage], operator.add]")
        if "next_action" not in state_schema:
            lines.append("    next_action: Optional[str]")
        if "final_response" not in state_schema:
            lines.append("    final_response: Optional[str]")

    lines += [
        "",
        "",
        "# ── LLM Configuration ────────────────────────────────────",
        "llm = ChatGroq(",
        '    model="llama-3.3-70b-versatile",',
        "    temperature=0.1,",
        ")",
        "",
        "",
        "# ── Node Functions ────────────────────────────────────────",
    ]

    for node in nodes:
        node_id = node["id"]
        node_name = node["name"]
        node_type = node.get("type", "agent")
        system_prompt = node.get("system_prompt", f"You are the {node_name}.")
        tools = node.get("tools", [])

        # Clean prompt for embedding in python string
        clean_prompt = system_prompt.replace('"', '\\"')

        lines += [
            f"async def {node_id}(state: AgentState) -> Dict[str, Any]:",
            f'    """',
            f'    {node_name} — {node.get("description", "")}',
            f'    Node Type: {node_type.capitalize()}',
            f'    """',
        ]

        if node_type == "router":
            lines += [
                "    messages = state.get('messages', [])",
                f'    system_prompt = "{clean_prompt}"',
                "    # Route state flow based on conversation context",
                "    response = await llm.ainvoke([SystemMessage(content=system_prompt)] + messages)",
                "    decision = response.content.strip().lower()",
                "    return {'next_action': decision}",
            ]
        elif node_type == "tool":
            lines += [
                "    # Executing external operations or query lookup",
                f"    # Enabled Tools: {', '.join(tools) if tools else 'custom calculations'}",
                "    messages = state.get('messages', [])",
                "    last_message = messages[-1].content if messages else ''",
                "    # TODO: Implement actual execution logic for tools",
                "    result_message = AIMessage(content=f'Tool completed work: {last_message}')",
                "    return {'messages': [result_message]}",
            ]
        else: # agent, memory, input, output
            lines += [
                "    messages = state.get('messages', [])",
                f'    system_prompt = "{clean_prompt}"',
                "    response = await llm.ainvoke([SystemMessage(content=system_prompt)] + messages)",
                "    return {'messages': [response]}",
            ]
        lines.append("")

    lines += [
        "",
        "# ── Graph Construction ────────────────────────────────────",
        "def create_graph():",
        "    builder = StateGraph(AgentState)",
        "",
        "    # Register all nodes",
    ]

    for node in nodes:
        lines.append(f'    builder.add_node("{node["id"]}", {node["id"]})')

    lines += ["", "    # Establish connections"]

    # Filter out START/END from normal node transitions
    conditional_sources = {}
    
    # Process edges
    for edge in edges:
        src = edge["source"]
        tgt = edge["target"]
        cond = edge.get("condition")
        label = edge.get("label", "")

        # Handle entry point
        if src == "START":
            lines.append(f"    builder.add_edge(START, \"{tgt}\")")
        elif tgt == "END":
            # If source has a condition, it's conditional routing
            if cond:
                if src not in conditional_sources:
                    conditional_sources[src] = {}
                conditional_sources[src][cond] = "END"
            else:
                lines.append(f"    builder.add_edge(\"{src}\", END)")
        elif cond:
            if src not in conditional_sources:
                conditional_sources[src] = {}
            conditional_sources[src][cond] = tgt
        else:
            lines.append(f"    builder.add_edge(\"{src}\", \"{tgt}\")")

    # Render conditional routing tables
    for src, route_map in conditional_sources.items():
        # Build router helper function in-graph
        lines += [
            f"    # Conditional routes from {src}",
            f"    def route_{src}(state: AgentState) -> str:",
            f"        decision = state.get('next_action', '')",
        ]
        
        # Add selection tree
        for cond_val, target_node in route_map.items():
            clean_cond = cond_val.lower().strip()
            lines.append(f"        if '{clean_cond}' in decision:")
            if target_node == "END":
                lines.append("            return END")
            else:
                lines.append(f"            return \"{target_node}\"")
                
        # Default route
        first_target = list(route_map.values())[0]
        default_target = "END" if first_target == "END" else f"\"{first_target}\""
        lines += [
            f"        return {default_target}",
            "",
            f"    builder.add_conditional_edges(",
            f"        \"{src}\",",
            f"        route_{src},",
            f"        {list(route_map.values()) if 'END' not in route_map.values() else [t if t != 'END' else 'END' for t in route_map.values()]}",
            f"    )",
            ""
        ]

    # Setup start node fallback
    if entry_point:
        lines.append(f"    builder.set_entry_point(\"{entry_point}\")")
    elif nodes:
        lines.append(f"    builder.set_entry_point(\"{nodes[0]['id']}\")")

    # Set up checkpointing/memory persistence
    memory_comment = "MemorySaver() for short-term thread persistence" if memory_type == "thread" else f"Configure persistent {memory_type} database checkpointing"
    lines += [
        "",
        f"    # {memory_comment}",
        "    memory = MemorySaver()",
        "    return builder.compile(checkpointer=memory)",
        "",
        "",
        "# ── Execution Endpoint ───────────────────────────────────",
        "graph = create_graph()",
        "",
        "async def run(user_message: str, thread_id: str = \"default\"):",
        '    config = {"configurable": {"thread_id": thread_id}}',
        '    state = {"messages": [HumanMessage(content=user_message)]}',
        "    async for event in graph.astream(state, config=config):",
        "        for node_name, node_state in event.items():",
        "            print(f'Node executed: {node_name}')",
        "            if 'messages' in node_state:",
        "                print(f'Latest response: {node_state[\"messages\"][-1].content}')",
        "    ",
        "    # Get final aggregated state",
        "    final_state = await graph.aget_state(config)",
        "    return final_state.values",
    ]

    return "\n".join(lines)
