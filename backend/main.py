from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api_v1.api import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    """Application lifespan: startup and shutdown events."""
    # Startup: warm up any connections or caches here
    yield
    # Shutdown: cleanup resources here


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise-grade Dialogue Summarization Platform API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["health"])
def read_root():
    """Root endpoint."""
    return {"message": "Welcome to the Dialogue Summarization API"}


@app.get("/health", tags=["health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
