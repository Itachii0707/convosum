import time
import logging
from typing import Dict, Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Cache loaded pipelines in memory to avoid repeated model loads (local inference only)
_pipelines: Dict[str, Any] = {}


def get_pipeline(model_name: str):
    """Load (or retrieve from cache) a HuggingFace inference pipeline."""
    # Lazy import to avoid loading heavy ML libraries in memory when using serverless API
    from transformers import pipeline

    if model_name not in _pipelines:
        logger.info("Loading model '%s' into memory...", model_name)
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


def run_hf_api_inference(text: str, model_name: str) -> Dict[str, Any]:
    """Run summarization via HuggingFace Serverless Inference API."""
    token = settings.HUGGINGFACE_TOKEN
    if not token:
        raise ValueError(
            "HUGGINGFACE_TOKEN is not set in environment variables. "
            "Please set HUGGINGFACE_TOKEN to use the Serverless Inference API."
        )

    headers = {"Authorization": f"Bearer {token}"}
    
    # Format according to T5 model prefix requirements
    if "t5" in model_name.lower() and not text.startswith("summarize:"):
        payload_text = f"summarize: {text}"
    else:
        payload_text = text

    payload = {
        "inputs": payload_text,
        "parameters": {
            "max_length": 150,
            "min_length": 30
        },
        "options": {
            "wait_for_model": True  # Block until the model is loaded/ready on HF servers
        }
    }

    url = f"https://api-inference.huggingface.co/models/{model_name}"
    start = time.perf_counter()
    
    logger.info("Routing request to Hugging Face Serverless API: %s", url)
    
    # Hugging Face serverless API could have cold-start delays, so we set a generous timeout
    with httpx.Client(timeout=90.0) as client:
        response = client.post(url, json=payload, headers=headers)
        
    elapsed_ms = (time.perf_counter() - start) * 1000
    
    if response.status_code != 200:
        logger.error("Hugging Face API failed with status %d: %s", response.status_code, response.text)
        raise ValueError(
            f"Hugging Face Inference API failed (Status {response.status_code}): {response.text}"
        )
        
    result = response.json()
    
    # Extract response text based on standard Hugging Face pipeline response types
    if isinstance(result, list) and len(result) > 0:
        summary_text = (
            result[0].get("summary_text")
            or result[0].get("generated_text")
            or ""
        )
    elif isinstance(result, dict):
        summary_text = (
            result.get("summary_text")
            or result.get("generated_text")
            or ""
        )
    else:
        summary_text = str(result)
        
    return {"summary": summary_text, "inference_time_ms": elapsed_ms}


def run_inference(
    text: str,
    model_name: str = "google/flan-t5-base",
) -> Dict[str, Any]:
    """
    Run summarization inference (either via Serverless API or locally) and return summary + timing.

    Returns:
        {"summary": str, "inference_time_ms": float}
    """
    if settings.USE_HF_INFERENCE_API:
        try:
            return run_hf_api_inference(text, model_name)
        except Exception as exc:
            logger.error("Serverless HF API inference failed: %s", exc)
            raise exc

    # Local Fallback Inference
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

