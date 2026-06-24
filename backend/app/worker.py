from app.core.celery_app import celery_app
from app.ml.train import train_model_task


@celery_app.task(acks_late=True)
def test_celery(word: str) -> str:
    """Simple smoke-test Celery task."""
    return f"test task return {word}"


@celery_app.task(acks_late=True, time_limit=86400)  # 24-hour limit for training
def trigger_training(model_name: str, dataset_name: str) -> dict:
    """Background task: fine-tune a model on the given dataset."""
    return train_model_task(model_name, dataset_name)
