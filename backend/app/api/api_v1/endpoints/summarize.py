import csv
import io
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None  # type: ignore[assignment]

from app.api import deps
from app.models.document import Document
from app.models.summary import Summary as SummaryModel
from app.models.user import User
from app.schemas.summary import SummaryRequest, SummaryResponse
from app.ml.inference import run_inference

router = APIRouter()

SUPPORTED_TYPES = {"txt", "csv", "pdf"}


def _parse_file(filename: str, content: bytes) -> str:
    """Parse raw file bytes into a plain-text string."""
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {SUPPORTED_TYPES}",
        )
    if ext == "txt":
        return content.decode("utf-8", errors="ignore")
    if ext == "csv":
        text = content.decode("utf-8", errors="ignore")
        reader = csv.reader(io.StringIO(text))
        return " ".join(" ".join(row) for row in reader)
    # pdf
    if PyPDF2 is None:
        raise HTTPException(
            status_code=500,
            detail="PyPDF2 is not installed. Cannot parse PDF files.",
        )
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
    return " ".join(
        page.extract_text() or "" for page in pdf_reader.pages
    )


def _persist(
    db: Session,
    owner_id: int,
    text: str,
    title: str,
    file_type: str,
    model_name: str,
    result: dict,
) -> SummaryModel:
    """Persist document and summary to the database and return the summary."""
    document = Document(
        title=title,
        content=text,
        file_type=file_type,
        owner_id=owner_id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    summary = SummaryModel(
        document_id=document.id,
        model_name=model_name,
        generated_summary=result["summary"],
        inference_time_ms=result["inference_time_ms"],
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


@router.post("/", response_model=SummaryResponse)
def summarize_text(
    *,
    db: Session = Depends(deps.get_db),
    request: SummaryRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Summarize raw text input directly."""
    try:
        result = run_inference(request.text, request.model_name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    summary = _persist(
        db=db,
        owner_id=current_user.id,
        text=request.text,
        title="Direct Text Input",
        file_type="txt",
        model_name=request.model_name,
        result=result,
    )
    return SummaryResponse(
        id=summary.id,
        document_id=summary.document_id,
        model_name=summary.model_name,
        generated_summary=summary.generated_summary,
        inference_time_ms=summary.inference_time_ms,
    )


@router.post("/upload", response_model=SummaryResponse)
async def summarize_file(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    model_name: str = Form("google/flan-t5-base"),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Upload a file (TXT, CSV, or PDF) and return its summary."""
    content = await file.read()
    text = _parse_file(file.filename or "upload.txt", content)

    try:
        result = run_inference(text, model_name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    ext = (file.filename or "upload.txt").rsplit(".", 1)[-1].lower()
    summary = _persist(
        db=db,
        owner_id=current_user.id,
        text=text,
        title=file.filename or "Uploaded File",
        file_type=ext,
        model_name=model_name,
        result=result,
    )
    return SummaryResponse(
        id=summary.id,
        document_id=summary.document_id,
        model_name=summary.model_name,
        generated_summary=summary.generated_summary,
        inference_time_ms=summary.inference_time_ms,
    )


@router.get("/history", response_model=List[SummaryResponse])
def get_history(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 20,
) -> Any:
    """Return paginated summarization history for the current user."""
    summaries = (
        db.query(SummaryModel)
        .join(Document, SummaryModel.document_id == Document.id)
        .filter(Document.owner_id == current_user.id)
        .order_by(SummaryModel.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        SummaryResponse(
            id=s.id,
            document_id=s.document_id,
            model_name=s.model_name,
            generated_summary=s.generated_summary,
            inference_time_ms=s.inference_time_ms,
        )
        for s in summaries
    ]
