from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from app.db.base_class import Base


class ModelMetadata(Base):
    __tablename__ = "model_metadata"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    version = Column(String)
    framework = Column(String)  # e.g. 'transformers'
    rouge_score = Column(Float, nullable=True)
    bert_score = Column(Float, nullable=True)
    is_active = Column(Boolean(), default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
