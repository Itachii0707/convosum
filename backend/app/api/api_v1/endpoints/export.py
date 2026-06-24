import io
import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api import deps
from app.models.document import Document
from app.models.summary import Summary
from app.models.user import User

router = APIRouter()

EXPORT_FORMATS = ("txt", "md", "json")


def _get_summary_or_404(
    db: Session, summary_id: int, user_id: int
) -> tuple[Summary, Document]:
    """Return (summary, document) or raise 404."""
    summary = db.query(Summary).filter(Summary.id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")

    document = (
        db.query(Document)
        .filter(Document.id == summary.document_id, Document.owner_id == user_id)
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=403,
            detail="Not authorised to access this summary",
        )
    return summary, document


@router.get("/{summary_id}")
def export_summary(
    summary_id: int,
    fmt: str = Query("txt", description="Export format: txt | md | json"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Export a summary in the requested format.

    Supported formats: txt, md, json
    (PDF and DOCX require heavy optional deps; install reportlab / python-docx
    to enable those branches.)
    """
    if fmt not in EXPORT_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{fmt}'. Choose from: {EXPORT_FORMATS}",
        )

    summary, document = _get_summary_or_404(db, summary_id, current_user.id)

    if fmt == "json":
        payload = json.dumps(
            {
                "id": summary.id,
                "model": summary.model_name,
                "document_title": document.title,
                "summary": summary.generated_summary,
                "inference_time_ms": summary.inference_time_ms,
            },
            indent=2,
        ).encode()
        return StreamingResponse(
            io.BytesIO(payload),
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="summary_{summary_id}.json"'
            },
        )

    if fmt == "md":
        content = (
            f"# Summary — {document.title}\n\n"
            f"**Model**: `{summary.model_name}`  \n"
            f"**Inference time**: {summary.inference_time_ms:.0f} ms\n\n"
            "---\n\n"
            f"{summary.generated_summary}\n"
        )
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="text/markdown",
            headers={
                "Content-Disposition": f'attachment; filename="summary_{summary_id}.md"'
            },
        )

    # Default: txt
    content = (
        f"Summary of: {document.title}\n"
        f"Model: {summary.model_name}\n"
        f"{'=' * 60}\n\n"
        f"{summary.generated_summary}\n"
    )
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/plain",
        headers={
            "Content-Disposition": f'attachment; filename="summary_{summary_id}.txt"'
        },
    )
