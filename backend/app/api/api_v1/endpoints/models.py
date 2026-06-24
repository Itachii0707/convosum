from typing import Any, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.models.model_metadata import ModelMetadata
from app.models.user import User

router = APIRouter()

# Default bundled models served even before DB has entries
DEFAULT_MODELS = [
    {
        "name": "google/flan-t5-base",
        "version": "base",
        "framework": "transformers",
        "is_active": True,
    },
    {
        "name": "google/flan-t5-large",
        "version": "large",
        "framework": "transformers",
        "is_active": True,
    },
    {
        "name": "facebook/bart-large-cnn",
        "version": "large-cnn",
        "framework": "transformers",
        "is_active": True,
    },
    {
        "name": "google/pegasus-xsum",
        "version": "xsum",
        "framework": "transformers",
        "is_active": True,
    },
]


@router.get("/", response_model=List[dict])
def list_models(
    db: Session = Depends(deps.get_db),
    _: User = Depends(deps.get_current_active_user),
) -> Any:
    """Return all available summarization models."""
    db_models = db.query(ModelMetadata).filter(
        ModelMetadata.is_active.is_(True)
    ).all()

    if db_models:
        return [
            {
                "name": m.name,
                "version": m.version,
                "framework": m.framework,
                "rouge_score": m.rouge_score,
                "bert_score": m.bert_score,
                "is_active": m.is_active,
            }
            for m in db_models
        ]
    return DEFAULT_MODELS
