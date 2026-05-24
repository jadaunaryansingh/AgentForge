from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

class NodeDefinition(BaseModel):
    id: str
    name: str
    type: str  # agent | tool | router | memory | input | output
    description: str
    model_config_data: Optional[Dict[str, Any]] = None
    system_prompt: Optional[str] = None
    tools: Optional[List[str]] = []

class EdgeDefinition(BaseModel):
    source: str
    target: str
    condition: Optional[str] = None
    label: Optional[str] = None

class GraphDefinition(BaseModel):
    pattern_name: Optional[str] = "Custom Pattern"
    description: Optional[str] = ""
    nodes: List[NodeDefinition]
    edges: List[EdgeDefinition]
    entry_point: str
    state_schema: Dict[str, Any]
    memory_type: str  # thread | persistent | hybrid

class CostEstimation(BaseModel):
    estimated_monthly_cost_usd: float
    complexity_score: int  # 1-10
    branching_factor: int
    node_count: int
    recommended_model: str
    breakdown: Dict[str, Any]

class InfraRecommendation(BaseModel):
    deployment_platform: str
    container_strategy: str
    database_tier: str
    caching_strategy: str
    scaling_approach: str
    estimated_infra_cost_usd: float

class ArchitectRequest(BaseModel):
    project_id: UUID
    prompt: str
    target_model: Optional[str] = "llama-3.3-70b-versatile"

class ArchitectureResponse(BaseModel):
    id: UUID
    project_id: UUID
    version: int
    prompt: str
    graph_definition: Optional[GraphDefinition] = None
    memory_strategy: Optional[Dict[str, Any]] = None
    infrastructure_recommendations: Optional[InfraRecommendation] = None
    cost_estimation: Optional[CostEstimation] = None
    diagram_mermaid: Optional[str] = None
    generated_code: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
