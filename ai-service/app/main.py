"""
FastAPI application entry point for the SAHABAT AI service.

Exposes:
- GET  /health  — service health check with ChromaDB connectivity
- POST /chat    — streaming chat endpoint (SSE)

The app validates configuration at startup and fails fast on missing
required environment variables.
"""

import logging
import sys
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings, validate_config, ConfigError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S',
    stream=sys.stdout,
    force=True  # Override any existing configuration
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Validate config and initialize resources at startup."""
    try:
        validate_config()
        print("[startup] Configuration validated successfully.")
    except ConfigError as e:
        print(f"[startup] FATAL: {e}")
        raise SystemExit(1)

    # Initialize ChromaDB connection check
    from database.chroma import get_chroma_service

    try:
        chroma = get_chroma_service()
        chroma.health_check()
        print("[startup] ChromaDB connected.")
    except Exception as e:
        print(f"[startup] WARNING: ChromaDB not reachable: {e}")

    yield

    print("[shutdown] AI service shutting down.")


settings = get_settings()

app = FastAPI(
    title="SAHABAT AI Service",
    description="Python FastAPI service for AI orchestration, RAG retrieval, and LLM generation.",
    version="1.0.0",
    lifespan=lifespan,
)

# Setup logger for the app
logger = logging.getLogger(__name__)

# CORS — allow only the configured frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    """Log all incoming requests for debugging."""
    logger.info(f"📥 Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"📤 Response status: {response.status_code}")
    return response


@app.get("/health")
async def health_check():
    """Health check endpoint with ChromaDB connectivity status."""
    from database.chroma import get_chroma_service

    try:
        chroma = get_chroma_service()
        chroma.health_check()
        return {"status": "healthy", "chromadb": "connected"}
    except Exception:
        return {"status": "degraded", "chromadb": "disconnected"}


# Register API routes
from api.chat import router as chat_router  # noqa: E402
from api.eligibility_search import router as eligibility_router  # noqa: E402

app.include_router(chat_router, prefix="/chat", tags=["chat"])
app.include_router(eligibility_router, tags=["eligibility"])
