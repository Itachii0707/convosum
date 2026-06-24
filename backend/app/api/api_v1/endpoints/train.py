from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api import deps
from app.models.user import User
from app.worker import trigger_training

router = APIRouter()


class TrainRequest(BaseModel):
    model_name: str = "google/flan-t5-base"
    dataset_name: str = "samsum"


@router.post("/")
def start_training(
    *,
    request: TrainRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Trigger async model fine-tuning via Celery worker (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only superusers can trigger training jobs.",
        )
    task = trigger_training.delay(request.model_name, request.dataset_name)
    return {
        "task_id": task.id,
        "status": "queued",
        "model_name": request.model_name,
        "dataset_name": request.dataset_name,
    }
