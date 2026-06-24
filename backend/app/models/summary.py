from sqlalchemy import Column, Float, ForeignKey, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    model_name = Column(String, nullable=False)
    generated_summary = Column(Text, nullable=False)
    inference_time_ms = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", backref="summaries")
