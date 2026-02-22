# api/v1/routers/pipelines.py — All pipeline endpoints
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from domain.schemas import PipelineData, ParseResponse, ValidateResponse, NodeTypesResponse, AutoLayoutResponse, ExecuteRequest
from services.graph_service import (
    calculate_pipeline_metrics,
    validate_pipeline,
    get_node_types,
    compute_auto_layout,
)
from services.execution_service import execute_dag_stream

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


# ─── POST /parse ──────────────────────────────────────────────────────────────

@router.post(
    "/parse",
    response_model=ParseResponse,
    summary="Analyse a pipeline graph",
    description=(
        "Accepts nodes and edges from the ReactFlow canvas. "
        "Returns DAG validity, node/edge counts, source/sink detection, "
        "connected-component count, critical-path length, and human-readable warnings."
    ),
)
@limiter.limit("30/minute")
def parse_pipeline(request: Request, pipeline: PipelineData):
    if not pipeline.nodes:
        raise HTTPException(status_code=422, detail="Pipeline must contain at least one node.")
    result = calculate_pipeline_metrics(pipeline.nodes, pipeline.edges)
    return result


# ─── POST /validate ───────────────────────────────────────────────────────────

@router.post(
    "/validate",
    response_model=ValidateResponse,
    summary="Deep-validate a pipeline",
    description=(
        "Checks all nodes for required fields, type correctness, "
        "and connectivity constraints. Returns structured errors and warnings."
    ),
)
@limiter.limit("30/minute")
def validate_pipeline_endpoint(request: Request, pipeline: PipelineData):
    result = validate_pipeline(pipeline.nodes, pipeline.edges)
    return result


# ─── GET /node-types ─────────────────────────────────────────────────────────

@router.get(
    "/node-types",
    response_model=NodeTypesResponse,
    summary="Get all supported node types",
    description="Returns the full node-type registry with field schemas, categories, and connection limits.",
)
@limiter.limit("60/minute")
def node_types_endpoint(request: Request):
    types = get_node_types()
    return {"node_types": types}


# ─── POST /auto-layout ────────────────────────────────────────────────────────

@router.post(
    "/auto-layout",
    response_model=AutoLayoutResponse,
    summary="Compute an automatic graph layout",
    description=(
        "Accepts nodes and edges, computes a layered (Sugiyama-style) layout, "
        "and returns updated node positions. Supports 'LR' (left-to-right) and 'TB' (top-to-bottom) directions."
    ),
)
@limiter.limit("20/minute")
def auto_layout_endpoint(request: Request, pipeline: PipelineData, direction: str = "LR"):
    if direction not in ("LR", "TB"):
        raise HTTPException(status_code=422, detail="direction must be 'LR' or 'TB'.")
    positioned = compute_auto_layout(pipeline.nodes, pipeline.edges, direction)
    return {"nodes": positioned}


# ─── POST /execute ────────────────────────────────────────────────────────────

@router.post(
    "/execute",
    summary="Execute pipeline via Server-Sent Events",
    description="Streams pipeline execution progress and node outputs. Supports pauses and resumption via the same endpoint by passing `resume_node_id` and `user_input`.",
)
@limiter.limit("30/minute")
async def execute_pipeline(request: Request, payload: ExecuteRequest):
    return StreamingResponse(
        execute_dag_stream(
            nodes=payload.nodes,
            edges=payload.edges,
            pipeline_id=payload.pipeline_id,
            resume_node_id=payload.resume_node_id,
            user_input=payload.user_input,
            env=payload.env
        ),
        media_type="text/event-stream"
    )
