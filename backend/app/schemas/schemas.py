"""
Pydantic schemas for CodePulse AI API
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# --- Project Schemas ---

class ProjectBase(BaseModel):
    name: str
    original_filename: str


class ProjectCreate(ProjectBase):
    pass


class ProjectResponse(BaseModel):
    id: int
    name: str
    original_filename: str
    status: str
    total_files: int
    total_functions: int
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int


# --- Source File Schemas ---

class SourceFileResponse(BaseModel):
    id: int
    relative_path: str
    has_syntax_error: bool
    syntax_error_message: Optional[str]
    function_count: int

    model_config = {"from_attributes": True}


# --- Function Schemas ---

class FunctionResponse(BaseModel):
    id: int
    name: str
    qualified_name: str
    class_name: Optional[str]
    line_start: Optional[int]
    line_end: Optional[int]
    docstring: Optional[str]
    is_method: bool
    source_file_path: str = ""

    model_config = {"from_attributes": True}


class FunctionListResponse(BaseModel):
    functions: List[FunctionResponse]
    total: int


# --- Graph Schemas ---

class GraphNodeData(BaseModel):
    label: str
    qualified_name: str
    relative_path: str
    line_start: Optional[int]
    line_end: Optional[int]
    class_name: Optional[str]
    is_method: bool


class GraphNode(BaseModel):
    id: str
    data: GraphNodeData
    type: str = "functionNode"


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    data: Dict[str, Any] = {}
    type: str = "smoothstep"


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    node_count: int
    edge_count: int


# --- Analysis Schemas ---

class AnalysisRequest(BaseModel):
    function_qualified_name: str = Field(..., description="Qualified name of the function to analyze")
    use_ai: bool = Field(default=False, description="Whether to use AI-powered explanation")


class AffectedFunctionSchema(BaseModel):
    qualified_name: str
    name: str
    relative_path: str
    line_start: Optional[int]
    depth: int


class RiskFactorSchema(BaseModel):
    name: str
    value: Any
    contribution: float
    description: str


class RiskScoreSchema(BaseModel):
    score: float
    category: str
    contributing_factors: List[RiskFactorSchema]
    formula_description: str
    review_priority: str
    disclaimer: str


class ImpactSchema(BaseModel):
    selected_function: str
    selected_qualified_name: str
    source_file: str
    line_start: Optional[int]
    line_end: Optional[int]
    direct_callers: List[str]
    all_affected: List[AffectedFunctionSchema]
    affected_count: int
    sample_paths: List[List[str]]
    limitations: List[str]


class TestRecommendationSchema(BaseModel):
    test_function_name: str
    test_file_path: str
    reason: str
    evidence: str
    confidence: str


class AnalysisResponse(BaseModel):
    analysis_id: int
    impact: ImpactSchema
    risk: RiskScoreSchema
    test_recommendations: List[TestRecommendationSchema]
    explanation: str


# --- History Schemas ---

class AnalysisHistoryItem(BaseModel):
    id: int
    project_id: int
    project_name: str
    function_name: str
    function_qualified_name: str
    risk_score: float
    risk_category: str
    affected_count: int
    recommendation_count: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisHistoryResponse(BaseModel):
    history: List[AnalysisHistoryItem]
    total: int


# --- Dashboard Schemas ---

class DashboardStats(BaseModel):
    total_projects: int
    total_functions: int
    total_analyses: int
    high_priority_analyses: int


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
