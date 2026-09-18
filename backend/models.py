from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    Float,
    Integer,
    DateTime,
    Date,
    JSON
)
from pgvector.sqlalchemy import Vector
from database import Base

class ReelModel(Base):
    __tablename__ = "reels"

    video_id = Column(String(255), primary_key=True, index=True)
    status = Column(String(50), default="success")
    source_type = Column(String(50), nullable=False) # 'url' or 'upload'
    source_url = Column(Text, nullable=True)
    local_file_path = Column(Text, nullable=True)
    ingested_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    duration_seconds = Column(Float, nullable=True)
    processing_mode = Column(String(50), nullable=True)
    frames_count = Column(Integer, default=0)
    audio_file_path = Column(Text, nullable=True)

    # Content attributes
    category = Column(String(100), nullable=True, index=True)
    place = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    country = Column(String(100), nullable=True)
    cuisine = Column(String(100), nullable=True)
    foods = Column(JSON, default=list)
    destination = Column(String(255), nullable=True)
    activity_name = Column(String(255), nullable=True)
    product_name = Column(String(255), nullable=True)
    tip_summary = Column(Text, nullable=True)
    objects = Column(JSON, default=list)
    transcript = Column(Text, nullable=True)
    ocr_text = Column(JSON, default=list)
    summary = Column(Text, nullable=False)
    tags = Column(JSON, default=list)

    # Real-World Geocoding
    location = Column(JSON, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # 768-dimensional pgvector embedding
    embedding = Column(Vector(768), nullable=True)

class PlanModel(Base):
    __tablename__ = "plans"

    plan_id = Column(String(255), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    question = Column(Text, nullable=False)
    created_at = Column(Date, default=lambda: datetime.now(timezone.utc).date())
    reel_ids = Column(JSON, default=list)
    timeline_label = Column(String(255), nullable=True)
    timeline = Column(JSON, default=list)
    key_dates = Column(JSON, default=list)
    locations = Column(JSON, default=list)
    steps = Column(JSON, default=list)
    packing = Column(JSON, default=list)
    overview = Column(Text, nullable=True)
