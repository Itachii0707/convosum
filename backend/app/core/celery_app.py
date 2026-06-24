import os

from celery import Celery

CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.environ.get(
    "CELERY_RESULT_BACKEND", "redis://localhost:6379/0"
)

celery_app = Celery(
    "worker",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_routes={"app.worker.test_celery": "main-queue"},
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # Retry tasks on broker connection failure at startup
    broker_connection_retry_on_startup=True,
)
