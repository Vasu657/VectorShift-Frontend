# domain/schemas.py — Pydantic models for all request/response types
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


# ─── Request Schemas ──────────────────────────────────────────────────────────

class NodePosition(BaseModel):
    x: float
    y: float


class BaseNodeSchema(BaseModel):
    id: str
    type: str
    position: NodePosition
    data: Dict[str, Any] = {}
    width: Optional[float] = None
    height: Optional[float] = None
    selected: Optional[bool] = None
    positionAbsolute: Optional[NodePosition] = None
    dragging: Optional[bool] = None


class EdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    type: Optional[str] = None
    animated: Optional[bool] = None
    label: Optional[str] = None


class PipelineData(BaseModel):
    nodes: List[BaseNodeSchema] = Field(default=[], max_length=1000, description="Pipeline nodes")
    edges: List[EdgeSchema] = Field(default=[], max_length=5000, description="Directed edges")
    name: Optional[str] = Field(default="Untitled Pipeline", max_length=200)


# ─── Response Schemas ─────────────────────────────────────────────────────────

class NodeWarning(BaseModel):
    node_id: str
    node_type: str
    message: str
    severity: str  # "error" | "warning" | "info"


class ParseResponse(BaseModel):
    # Existing fields (frontend relies on these)
    num_nodes: int
    num_edges: int
    is_dag: bool

    # Enhanced graph analysis
    node_type_counts: Dict[str, int]
    source_nodes: List[str]          # entry-point node IDs (no incoming edges)
    sink_nodes: List[str]            # terminal node IDs (no outgoing edges)
    isolated_nodes: List[str]        # nodes with no edges at all
    connected_components: int        # number of disconnected sub-graphs
    longest_path: int                # critical-path length in hops (-1 if cyclic)
    has_input_node: bool
    has_output_node: bool
    warnings: List[str]              # human-readable issues
    execution_plan: List[str]        # topological sort of node IDs


class ValidationError(BaseModel):
    node_id: str
    node_type: str
    field: str
    message: str


class ValidateResponse(BaseModel):
    valid: bool
    errors: List[ValidationError]
    warnings: List[str]


class LayoutNode(BaseModel):
    id: str
    position: NodePosition


class AutoLayoutResponse(BaseModel):
    nodes: List[LayoutNode]


class NodeTypeField(BaseModel):
    name: str
    type: str       # "text" | "select" | "textarea" | "number"
    label: str
    required: bool = False
    options: Optional[List[str]] = None
    default: Optional[Any] = None


class NodeTypeInfo(BaseModel):
    type: str
    label: str
    category: str
    color: str
    description: str
    fields: List[NodeTypeField]
    max_inputs: int     # -1 = unlimited
    max_outputs: int


class NodeTypesResponse(BaseModel):
    node_types: List[NodeTypeInfo]
