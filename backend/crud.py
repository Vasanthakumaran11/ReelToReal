import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from config import OUTPUTS_DIR
from models import ReelModel, PlanModel
from embeddings import build_search_document, generate_embedding

def save_reel_to_db(db: Session, record: Dict[str, Any], generate_vector: bool = True) -> ReelModel:
    """Inserts or updates a reel record in PostgreSQL with its semantic vector embedding."""
    video_id = record["video_id"]

    embedding = None
    if generate_vector:
        try:
            doc_text = build_search_document(record)
            embedding = generate_embedding(doc_text)
        except Exception as e:
            print(f"[Warning] Failed to generate embedding for {video_id}: {e}")

    location_data = record.get("location") or {}
    lat = location_data.get("latitude") if isinstance(location_data, dict) else None
    lon = location_data.get("longitude") if isinstance(location_data, dict) else None

    existing = db.query(ReelModel).filter(ReelModel.video_id == video_id).first()
    if existing:
        for key, value in record.items():
            if hasattr(existing, key) and key != "video_id":
                setattr(existing, key, value)
        if embedding:
            existing.embedding = embedding
        if lat is not None and lon is not None:
            existing.latitude = lat
            existing.longitude = lon
        db.commit()
        db.refresh(existing)
        return existing

    new_reel = ReelModel(
        video_id=video_id,
        status=record.get("status", "success"),
        source_type=record.get("source_type", "upload"),
        source_url=record.get("source_url"),
        local_file_path=record.get("local_file_path"),
        duration_seconds=record.get("duration_seconds"),
        processing_mode=record.get("processing_mode"),
        frames_count=record.get("frames_count", 0),
        audio_file_path=record.get("audio_file_path"),
        category=record.get("category"),
        place=record.get("place"),
        city=record.get("city"),
        country=record.get("country"),
        cuisine=record.get("cuisine"),
        foods=record.get("foods") or [],
        destination=record.get("destination"),
        activity_name=record.get("activity_name"),
        product_name=record.get("product_name"),
        tip_summary=record.get("tip_summary"),
        objects=record.get("objects") or [],
        transcript=record.get("transcript"),
        ocr_text=record.get("ocr_text") or [],
        summary=record.get("summary", ""),
        tags=record.get("tags") or [],
        location=location_data,
        latitude=lat,
        longitude=lon,
        embedding=embedding
    )

    db.add(new_reel)
    db.commit()
    db.refresh(new_reel)
    return new_reel

def get_all_reels(db: Session, limit: int = 100, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves reels from PostgreSQL."""
    query = db.query(ReelModel).filter(ReelModel.status == "success")
    if category and category.lower() != "all":
        query = query.filter(ReelModel.category.ilike(f"%{category}%"))
    query = query.order_by(desc(ReelModel.ingested_at)).limit(limit)

    results = []
    for r in query.all():
        results.append({
            "video_id": r.video_id,
            "status": r.status,
            "source_type": r.source_type,
            "source_url": r.source_url,
            "local_file_path": r.local_file_path,
            "ingested_at": r.ingested_at.isoformat() if r.ingested_at else None,
            "duration_seconds": r.duration_seconds,
            "processing_mode": r.processing_mode,
            "frames_count": r.frames_count,
            "audio_file_path": r.audio_file_path,
            "location": r.location,
            "category": r.category,
            "place": r.place,
            "city": r.city,
            "country": r.country,
            "cuisine": r.cuisine,
            "foods": r.foods or [],
            "destination": r.destination,
            "activity_name": r.activity_name,
            "product_name": r.product_name,
            "tip_summary": r.tip_summary,
            "objects": r.objects or [],
            "transcript": r.transcript,
            "ocr_text": r.ocr_text or [],
            "summary": r.summary,
            "tags": r.tags or [],
            "saved": True
        })
    return results

def search_reels_by_vector(
    db: Session,
    query_vector: List[float],
    limit: int = 5
) -> List[Tuple[ReelModel, float]]:
    """
    Performs cosine distance nearest neighbor search using pgvector.
    Returns (ReelModel, distance) pairs where lower distance = higher similarity.
    """
    cosine_distance = ReelModel.embedding.cosine_distance(query_vector).label("distance")
    results = (
        db.query(ReelModel, cosine_distance)
        .filter(ReelModel.embedding.isnot(None))
        .order_by(cosine_distance)
        .limit(limit)
        .all()
    )
    return results

def save_plan_to_db(db: Session, plan_data: Dict[str, Any]) -> PlanModel:
    """Saves an AI-crafted plan to PostgreSQL."""
    plan_id = plan_data.get("plan_id")
    new_plan = PlanModel(
        plan_id=plan_id,
        title=plan_data.get("title", "Trip Plan"),
        question=plan_data.get("question", ""),
        reel_ids=plan_data.get("reel_ids") or [],
        timeline_label=plan_data.get("timeline_label"),
        timeline=plan_data.get("timeline") or [],
        key_dates=plan_data.get("key_dates") or [],
        locations=plan_data.get("locations") or [],
        steps=plan_data.get("steps") or [],
        packing=plan_data.get("packing") or [],
        overview=plan_data.get("overview")
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan

def get_all_plans(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves all trip plans from PostgreSQL."""
    plans = db.query(PlanModel).order_by(desc(PlanModel.created_at)).limit(limit).all()
    results = []
    for p in plans:
        results.append({
            "plan_id": p.plan_id,
            "title": p.title,
            "question": p.question,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "reel_ids": p.reel_ids or [],
            "timeline_label": p.timeline_label,
            "timeline": p.timeline or [],
            "key_dates": p.key_dates or [],
            "locations": p.locations or [],
            "steps": p.steps or [],
            "packing": p.packing or [],
            "overview": p.overview
        })
    return results

def sync_local_outputs_to_db(db: Session) -> int:
    """Scans existing outputs/*.json records and syncs them into PostgreSQL."""
    count = 0
    if not OUTPUTS_DIR.exists():
        return 0
    for file in OUTPUTS_DIR.glob("*.json"):
        try:
            with open(file, "r", encoding="utf-8") as f:
                record = json.load(f)
            if record.get("status") == "success" and record.get("video_id"):
                save_reel_to_db(db, record, generate_vector=True)
                count += 1
        except Exception as e:
            print(f"[Warning] Failed syncing {file.name} to DB: {e}")
    return count
