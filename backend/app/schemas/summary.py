from typing import Optional

from pydantic import BaseModel


class SummaryRequest(BaseModel):
    text: str
    model_name: str = "google/flan-t5-base"


class SummaryResponse(BaseModel):
    id: Optional[int] = None
    document_id: Optional[int] = None
    model_name: str
    generated_summary: str
    inference_time_ms: float
