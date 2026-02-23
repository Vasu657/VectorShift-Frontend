# api/v1/routers/pipelines.py — All pipeline endpoints
import uuid
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from domain.schemas import (
    PipelineData, ParseResponse, ValidateResponse, NodeTypesResponse,
    AutoLayoutResponse, ExecuteRequest,
    SavePipelineRequest, SavedPipelineInfo, SavedPipelineDetail,
)
from services.graph_service import (
    calculate_pipeline_metrics,
    validate_pipeline,
    get_node_types,
    compute_auto_layout,
)
from services.execution_service import execute_dag_stream
from services.pipeline_store import (
    save_pipeline, list_pipelines, get_pipeline, delete_pipeline,
)
import httpx

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


# ─── GET /models ──────────────────────────────────────────────────────────────

@router.get(
    "/models",
    summary="Fetch free models from OpenRouter",
    description="Proxies the OpenRouter /models endpoint and returns only models that are free (zero prompt & completion cost). Pass your OpenRouter API key as the `api_key` query parameter.",
)
@limiter.limit("30/minute")
async def get_free_models(request: Request, api_key: str = ""):
    """Returns the list of free OpenRouter models, sorted by name."""
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get("https://openrouter.ai/api/v1/models", headers=headers)
            r.raise_for_status()
            all_models = r.json().get("data", [])
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OpenRouter API error: {exc}")

    free_models = []
    for m in all_models:
        pricing = m.get("pricing", {})
        prompt_cost = float(pricing.get("prompt", "1") or 1)
        completion_cost = float(pricing.get("completion", "1") or 1)
        # Free = both costs are 0, OR model id ends with :free
        is_free = (prompt_cost == 0 and completion_cost == 0) or m.get("id", "").endswith(":free")
        if is_free:
            free_models.append({
                "id": m.get("id", ""),
                "name": m.get("name", m.get("id", "")),
                "context_length": m.get("context_length", 0),
                "description": (m.get("description", "") or "")[:120],
            })

    # Sort: alphabetically by display name
    free_models.sort(key=lambda x: x["name"].lower())
    return {"models": free_models, "count": len(free_models)}




# ─── POST /parse ──────────────────────────────────────────────────────────────

@router.post(
    "/parse",
    response_model=ParseResponse,
    summary="Analyse a pipeline graph",
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
    description=(
        "Streams real pipeline execution progress and node outputs via SSE. "
        "Pass API keys in the 'env' dict — they are never stored server-side."
    ),
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
            env=payload.env,
        ),
        media_type="text/event-stream",
    )


# ─── POST /save ───────────────────────────────────────────────────────────────

@router.post(
    "/save",
    summary="Save (upsert) a pipeline to the database",
)
@limiter.limit("60/minute")
async def save_pipeline_endpoint(request: Request, body: SavePipelineRequest):
    # Assign a new UUID if user passes empty string
    pipeline_id = body.id if body.id else str(uuid.uuid4())
    nodes_raw = [n.model_dump() for n in body.nodes]
    edges_raw = [e.model_dump() for e in body.edges]
    record = await save_pipeline(pipeline_id, body.name, nodes_raw, edges_raw)
    return record


# ─── GET /saved ───────────────────────────────────────────────────────────────

@router.get(
    "/saved",
    summary="List all saved pipelines",
)
@limiter.limit("60/minute")
async def list_saved_pipelines(request: Request):
    records = await list_pipelines()
    return {"pipelines": records}


# ─── GET /saved/{pipeline_id} ─────────────────────────────────────────────────

@router.get(
    "/saved/{pipeline_id}",
    summary="Load a saved pipeline by ID",
)
@limiter.limit("60/minute")
async def get_saved_pipeline(request: Request, pipeline_id: str):
    record = await get_pipeline(pipeline_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Pipeline '{pipeline_id}' not found.")
    return record


# ─── DELETE /saved/{pipeline_id} ──────────────────────────────────────────────

@router.delete(
    "/saved/{pipeline_id}",
    summary="Delete a saved pipeline",
)
@limiter.limit("30/minute")
async def delete_saved_pipeline(request: Request, pipeline_id: str):
    deleted = await delete_pipeline(pipeline_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Pipeline '{pipeline_id}' not found.")
    return {"deleted": pipeline_id}
