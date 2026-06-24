import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise Dialogue Summarization Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", "supersecretkey_change_in_production"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # HuggingFace
    HUGGINGFACE_TOKEN: str = os.getenv("HUGGINGFACE_TOKEN", "")

    # MLflow
    MLFLOW_TRACKING_URI: str = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")

    # Database
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "convosum_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "convosum_password")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "convosum_db")

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    class Config:
        case_sensitive = True


settings = Settings()
