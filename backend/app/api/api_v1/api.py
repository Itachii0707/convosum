from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    analytics,
    auth,
    export,
    models,
    summarize,
    train,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    summarize.router, prefix="/summarize", tags=["summarize"]
)
api_router.include_router(
    analytics.router, prefix="/analytics", tags=["analytics"]
)
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(train.router, prefix="/train", tags=["train"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
