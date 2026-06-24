import logging

import mlflow
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
)

from app.core.config import settings
from app.ml.data import load_hf_dataset
from app.ml.preprocessing import preprocess_dataset

logger = logging.getLogger(__name__)

# Column names per dataset
_TEXT_COLS = {
    "samsum": ("dialogue", "summary"),
    "cnn_dailymail": ("article", "highlights"),
    "xsum": ("document", "summary"),
}


def train_model_task(model_name: str, dataset_name: str) -> dict:
    """
    Fine-tune a seq2seq model and track the run with MLflow.

    Note: trainer.train() is commented out so the task can be enqueued
    without a GPU available. Uncomment it on a GPU-equipped Celery worker.
    """
    logger.info("Training job: model=%s  dataset=%s", model_name, dataset_name)

    text_col, summary_col = _TEXT_COLS.get(dataset_name, ("dialogue", "summary"))
    hf_token = settings.HUGGINGFACE_TOKEN or None

    mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
    mlflow.set_experiment(f"Summarization_{model_name}")

    with mlflow.start_run(run_name=f"finetune_{model_name}_{dataset_name}") as run:
        # 1. Load & preprocess data
        dataset = load_hf_dataset(dataset_name)
        dataset = preprocess_dataset(dataset, text_col, summary_col)

        # 2. Tokenise
        tokenizer = AutoTokenizer.from_pretrained(model_name, token=hf_token)

        def tokenize_function(examples):
            inputs = tokenizer(
                examples[text_col], max_length=512, truncation=True
            )
            labels = tokenizer(
                examples[summary_col], max_length=128, truncation=True
            )
            inputs["labels"] = labels["input_ids"]
            return inputs

        tokenized = dataset.map(tokenize_function, batched=True)

        # 3. Load model
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name, token=hf_token)

        # 4. Training arguments
        # NOTE: `evaluation_strategy` was deprecated in transformers>=4.41;
        #       use `eval_strategy` instead.
        output_dir = f"./models/{model_name.replace('/', '_')}-{dataset_name}"
        training_args = TrainingArguments(
            output_dir=output_dir,
            eval_strategy="epoch",
            learning_rate=2e-5,
            per_device_train_batch_size=4,
            per_device_eval_batch_size=4,
            weight_decay=0.01,
            save_total_limit=3,
            num_train_epochs=3,
            predict_with_generate=True,
            logging_dir="./logs",
            fp16=False,  # set True on GPU for faster training
        )

        # 5. Trainer
        _trainer = Trainer(  # noqa: F841
            model=model,
            args=training_args,
            train_dataset=tokenized["train"],
            eval_dataset=tokenized["validation"],
            tokenizer=tokenizer,
        )

        # Uncomment to actually run training on a GPU worker:
        # _trainer.train()
        # _trainer.save_model(output_dir)

        mlflow.log_param("model_name", model_name)
        mlflow.log_param("dataset", dataset_name)
        mlflow.log_param("epochs", training_args.num_train_epochs)
        mlflow.log_param("learning_rate", training_args.learning_rate)

        return {
            "status": "success",
            "model_path": output_dir,
            "run_id": run.info.run_id,
        }
