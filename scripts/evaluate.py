#!/usr/bin/env python
"""
Evaluation script — compute ROUGE, BLEU, and BERTScore for a trained model.

Usage:
    python scripts/evaluate.py \
        --model google/flan-t5-base \
        --dataset samsum \
        --split test \
        --max_samples 200

Results are logged to MLflow and printed to stdout.
"""
import argparse
import logging
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import evaluate as hf_evaluate
import mlflow
from transformers import pipeline

from app.ml.data import load_hf_dataset
from app.ml.preprocessing import preprocess_dataset
from app.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

_TEXT_COLS = {
    "samsum": ("dialogue", "summary"),
    "cnn_dailymail": ("article", "highlights"),
    "xsum": ("document", "summary"),
}


def evaluate(
    model_name: str,
    dataset_name: str,
    split: str = "test",
    max_samples: int = 200,
):
    logger.info("Loading dataset '%s' …", dataset_name)
    dataset = load_hf_dataset(dataset_name)
    text_col, summary_col = _TEXT_COLS.get(dataset_name, ("dialogue", "summary"))
    dataset = preprocess_dataset(dataset, text_col, summary_col)
    subset = dataset[split].select(range(min(max_samples, len(dataset[split]))))

    logger.info("Loading model '%s' …", model_name)
    hf_token = settings.HUGGINGFACE_TOKEN or None
    task = (
        "text2text-generation"
        if "t5" in model_name.lower()
        else "summarization"
    )
    pipe = pipeline(task, model=model_name, token=hf_token)

    logger.info("Running inference on %d samples …", len(subset))
    references = subset[summary_col]
    predictions = []
    for text in subset[text_col]:
        prompt = f"summarize: {text}" if "t5" in model_name.lower() else text
        out = pipe(prompt, max_length=150, min_length=30, do_sample=False)
        predictions.append(
            out[0].get("summary_text") or out[0].get("generated_text") or ""
        )

    # ── ROUGE ──────────────────────────────────────────────────────────────
    rouge = hf_evaluate.load("rouge")
    rouge_scores = rouge.compute(predictions=predictions, references=references)

    # ── BLEU ───────────────────────────────────────────────────────────────
    bleu = hf_evaluate.load("bleu")
    bleu_scores = bleu.compute(
        predictions=[p.split() for p in predictions],
        references=[[r.split()] for r in references],
    )

    # ── BERTScore ──────────────────────────────────────────────────────────
    bertscore = hf_evaluate.load("bertscore")
    bert_results = bertscore.compute(
        predictions=predictions, references=references, lang="en"
    )
    avg_bert_f1 = sum(bert_results["f1"]) / len(bert_results["f1"])

    results = {
        "rouge1": round(rouge_scores["rouge1"], 4),
        "rouge2": round(rouge_scores["rouge2"], 4),
        "rougeL": round(rouge_scores["rougeL"], 4),
        "bleu": round(bleu_scores["bleu"], 4),
        "bert_f1": round(avg_bert_f1, 4),
    }

    logger.info("Results: %s", results)

    # ── MLflow logging ─────────────────────────────────────────────────────
    mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
    mlflow.set_experiment(f"Evaluation_{model_name}")
    with mlflow.start_run(run_name=f"eval_{model_name}_{dataset_name}_{split}"):
        mlflow.log_param("model", model_name)
        mlflow.log_param("dataset", dataset_name)
        mlflow.log_param("split", split)
        mlflow.log_param("samples", len(subset))
        for k, v in results.items():
            mlflow.log_metric(k, v)

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate a summarization model")
    parser.add_argument("--model", default="google/flan-t5-base")
    parser.add_argument("--dataset", default="samsum")
    parser.add_argument("--split", default="test")
    parser.add_argument("--max_samples", type=int, default=200)
    args = parser.parse_args()

    results = evaluate(
        model_name=args.model,
        dataset_name=args.dataset,
        split=args.split,
        max_samples=args.max_samples,
    )
    print("\n──── Evaluation Results ────")
    for k, v in results.items():
        print(f"  {k:12}: {v}")
