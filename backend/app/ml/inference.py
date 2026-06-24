import time
import logging
from typing import Dict, Any

from transformers import pipeline

from app.core.config import settings

logger = logging.getLogger(__name__)

# Cache loaded pipelines in memory to avoid repeated model loads
_pipelines: Dict[str, Any] = {}


def get_pipeline(model_name: str):
    """Load (or retrieve from cache) a HuggingFace inference pipeline."""
    if model_name not in _pipelines:
        logger.info("Loading model '%s' into memory…", model_name)
        try:
            # T5-family models use text2text-generation; others use summarization
            task = (
                "text2text-generation"
                if "t5" in model_name.lower()
                else "summarization"
            )
            token = settings.HUGGINGFACE_TOKEN or None
            _pipelines[model_name] = pipeline(
                task, model=model_name, token=token
            )
        except Exception as exc:
            logger.error("Failed to load model '%s': %s", model_name, exc)
            raise ValueError(
                f"Could not load model '{model_name}'. "
                "Ensure it is a valid HuggingFace model identifier."
            ) from exc
    return _pipelines[model_name]


def run_inference(
    text: str,
    model_name: str = "google/flan-t5-base",
) -> Dict[str, Any]:
    """
    Run summarization inference and return summary + timing.

    Returns:
        {"summary": str, "inference_time_ms": float}
    """
    summarizer = get_pipeline(model_name)

    # T5 models require a task prefix
    if "t5" in model_name.lower():
        text = f"summarize: {text}"

    start = time.perf_counter()
    result = summarizer(text, max_length=150, min_length=30, do_sample=False)
    elapsed_ms = (time.perf_counter() - start) * 1000

    summary_text = (
        result[0].get("summary_text")
        or result[0].get("generated_text")
        or ""
    )

    return {"summary": summary_text, "inference_time_ms": elapsed_ms}
