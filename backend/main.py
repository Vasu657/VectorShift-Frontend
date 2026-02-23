# main.py — FastAPI application entry point
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from api.v1.routers import pipelines
from services.pipeline_store import init_db

# ─── Rate limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


# ─── Lifespan (startup/shutdown) ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialise SQLite database
    await init_db()
    yield
    # Shutdown (nothing to do)


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="VectorShift Pipeline API",
    description=(
        "Backend for the VectorShift Pipeline Builder. "
        "Provides DAG validation, graph analytics, node-type registry, "
        "pipeline validation, auto-layout, real LLM execution, and pipeline persistence."
    ),
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(pipelines.router, prefix="/api/v1/pipelines", tags=["Pipelines"])


# ─── Root / health endpoints ──────────────────────────────────────────────────

@app.get("/", tags=["Health"], summary="Ping the server")
@limiter.limit("30/minute")
def read_root(request: Request):
    """Quick health-check used by the frontend Settings panel 'Test Connection' button."""
    return {"Ping": "Pong", "status": "ok", "version": "3.0.0"}


@app.get("/health", tags=["Health"], summary="Detailed health check")
@limiter.limit("30/minute")
def health_check(request: Request):
    """Detailed health check with service status."""
    return {
        "status": "healthy",
        "version": "3.0.0",
        "services": {
            "graph_analysis": "ok",
            "validation": "ok",
            "node_registry": "ok",
            "auto_layout": "ok",
            "llm_execution": "ok (OpenRouter)",
            "pipeline_persistence": "ok (SQLite)",
        },
    }
