from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api import deps
from app.models.document import Document
from app.models.summary import Summary
from app.models.user import User

router = APIRouter()


@router.get("/")
def get_analytics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Return usage analytics for the current user."""
    total_docs = (
        db.query(func.count(Document.id))
        .filter(Document.owner_id == current_user.id)
        .scalar()
    )
    total_summaries = (
        db.query(func.count(Summary.id))
        .join(Document, Summary.document_id == Document.id)
        .filter(Document.owner_id == current_user.id)
        .scalar()
    )
    avg_inference = (
        db.query(func.avg(Summary.inference_time_ms))
        .join(Document, Summary.document_id == Document.id)
        .filter(Document.owner_id == current_user.id)
        .scalar()
    )
    model_usage = (
        db.query(Summary.model_name, func.count(Summary.id).label("count"))
        .join(Document, Summary.document_id == Document.id)
        .filter(Document.owner_id == current_user.id)
        .group_by(Summary.model_name)
        .all()
    )
    return {
        "total_documents": total_docs or 0,
        "total_summaries": total_summaries or 0,
        "avg_inference_time_ms": round(avg_inference or 0, 2),
        "model_usage": [
            {"model_name": m, "count": c} for m, c in model_usage
        ],
    }
