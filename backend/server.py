import os
import json
import uuid
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google import genai
from google.genai import types

from config import VIDEOS_DIR, OUTPUTS_DIR, GEMINI_API_KEY, GEMINI_MODEL
from database import get_db, init_db, engine, SessionLocal
import crud
from pipeline import run_ingestion_pipeline
from embeddings import generate_embedding

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and pgvector extension if DATABASE_URL is configured
    if engine:
        print("[Startup] Initializing database and pgvector extension...")
        success = init_db()
        if success and SessionLocal:
            with SessionLocal() as db:
                synced = crud.sync_local_outputs_to_db(db)
                print(f"[Startup] Synced {synced} local reels into PostgreSQL.")
    yield

app = FastAPI(
    title="ReelToReal Ingestion & Planning API",
    description="Multimodal ingestion pipeline, PostgreSQL + pgvector storage, and AI itinerary planner.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PlanRequest(BaseModel):
    question: str

class IngestUrlRequest(BaseModel):
    source_url: str

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    db_connected = False
    reels_count = 0
    if db:
        try:
            from models import ReelModel
            reels_count = db.query(ReelModel).count()
            db_connected = True
        except Exception:
            pass

    return {
        "status": "online",
        "database_connected": db_connected,
        "database_reels_count": reels_count,
        "gemini_api_key_configured": bool(GEMINI_API_KEY)
    }

@app.get("/api/reels")
def list_reels(category: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns all ingested reels. Falls back to local outputs/ if DB is not configured."""
    if db:
        try:
            return crud.get_all_reels(db, category=category)
        except Exception as e:
            print(f"[Warning] Database query failed, falling back to local files: {e}")

    # Fallback to local outputs directory
    results = []
    if OUTPUTS_DIR.exists():
        for file in OUTPUTS_DIR.glob("*.json"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if data.get("status") == "success":
                    data["saved"] = True
                    results.append(data)
            except Exception:
                pass
    return results

@app.get("/api/plans")
def list_plans(db: Session = Depends(get_db)):
    """Returns all created AI plans."""
    if db:
        try:
            return crud.get_all_plans(db)
        except Exception as e:
            print(f"[Warning] Failed to fetch plans from DB: {e}")
    return []

@app.post("/api/plan")
def craft_plan(request: PlanRequest, db: Session = Depends(get_db)):
    """
    RAG-powered AI Plan Generator:
    1. Embeds question using Gemini
    2. Performs vector similarity search in PostgreSQL pgvector
    3. Prompts Gemini with matching reels to construct an actionable itinerary
    """
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    context_reels = []
    reel_ids = []
    locations = []

    # 1. Vector similarity search if DB is active
    if db and GEMINI_API_KEY:
        try:
            q_vec = generate_embedding(question)
            matches = crud.search_reels_by_vector(db, q_vec, limit=4)
            for reel, dist in matches:
                context_reels.append(f"- Place: {reel.place} ({reel.city})\n  Summary: {reel.summary}\n  Foods: {', '.join(reel.foods or [])}\n  Tips: {reel.tip_summary}")
                reel_ids.append(reel.video_id)
                if reel.latitude and reel.longitude:
                    locations.append({
                        "name": reel.place or reel.city,
                        "lat": reel.latitude,
                        "lng": reel.longitude,
                        "tone": "start" if len(locations) == 0 else "mid"
                    })
        except Exception as e:
            print(f"[Warning] Vector search failed: {e}")

    # 2. Call Gemini to synthesize a structured plan grounded in the retrieved reels
    plan_data = _generate_ai_itinerary_plan(question, context_reels, locations, reel_ids)

    # 3. Persist plan to DB if available
    if db:
        try:
            crud.save_plan_to_db(db, plan_data)
        except Exception as e:
            print(f"[Warning] Failed saving plan to DB: {e}")

    return plan_data

def _generate_ai_itinerary_plan(
    question: str,
    context_reels: List[str],
    locations: List[Dict[str, Any]],
    reel_ids: List[str]
) -> Dict[str, Any]:
    """Uses Gemini to synthesize an actionable itinerary plan."""
    plan_id = f"plan_{uuid.uuid4().hex[:10]}"

    if not GEMINI_API_KEY:
        return {
            "plan_id": plan_id,
            "title": question[:40],
            "question": question,
            "created_at": "2026-09-19",
            "reel_ids": reel_ids,
            "timeline_label": "AI Plan (Offline)",
            "timeline": [
                {"label": "Arrival", "detail": "Arrive at primary destination", "tone": "start"},
                {"label": "Main Activity", "detail": "Explore recommended spots"},
                {"label": "Food & Dining", "detail": "Enjoy authentic meal", "tone": "end"}
            ],
            "key_dates": [{"date": "Upcoming Trip", "window": "Full Day", "note": "Flexible schedule"}],
            "locations": locations,
            "steps": [{"label": "Pack essentials", "done": False}],
            "packing": [{"label": "Camera / Phone", "done": False}]
        }

    client = genai.Client(api_key=GEMINI_API_KEY)
    context_text = "\n".join(context_reels) if context_reels else "No specific reel match found. Provide a general realistic itinerary."

    prompt = f"""You are the ReelToReal Itinerary Planner.
User request: "{question}"

Relevant reels retrieved from our database:
{context_text}

Generate an actionable, structured itinerary in JSON matching this exact schema:
{{
  "title": "Short compelling title",
  "timeline_label": "Summary label of the trip flow",
  "timeline": [
    {{"label": "Stop name", "detail": "What to do or eat", "tone": "start | mid | end"}}
  ],
  "key_dates": [
    {{"date": "Day or timing", "window": "e.g. 8:00 AM - 11:00 AM", "note": "Actionable advice"}}
  ],
  "steps": [
    {{"label": "Action item", "done": false}}
  ],
  "packing": [
    {{"label": "Item to bring", "done": false}}
  ],
  "overview": "2-3 sentence overview of the trip"
}}
"""
    try:
        res = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )
        plan_json = json.loads(res.text)
        plan_json["plan_id"] = plan_id
        plan_json["question"] = question
        plan_json["reel_ids"] = reel_ids
        plan_json["locations"] = locations
        return plan_json
    except Exception as e:
        print(f"[Error] Gemini plan generation failed: {e}")
        return {
            "plan_id": plan_id,
            "title": question[:40],
            "question": question,
            "reel_ids": reel_ids,
            "timeline": [{"label": "Activity", "detail": "Explore spots", "tone": "start"}],
            "locations": locations,
            "steps": [{"label": "Verify travel route", "done": False}]
        }

@app.post("/api/ingest")
def ingest_url(request: IngestUrlRequest, db: Session = Depends(get_db)):
    """Runs ingestion pipeline for video URL and stores result in PostgreSQL."""
    result = run_ingestion_pipeline(request.source_url)
    if db and result.get("status") == "success":
        try:
            crud.save_reel_to_db(db, result, generate_vector=True)
        except Exception as e:
            print(f"[Warning] Failed saving ingested URL reel to DB: {e}")
    return result

@app.post("/api/ingest/upload")
async def ingest_upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Runs ingestion pipeline for uploaded video file and stores result in PostgreSQL."""
    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
    destination = VIDEOS_DIR / file.filename

    with open(destination, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = run_ingestion_pipeline(str(destination))
    if db and result.get("status") == "success":
        try:
            crud.save_reel_to_db(db, result, generate_vector=True)
        except Exception as e:
            print(f"[Warning] Failed saving uploaded reel to DB: {e}")
    return result

@app.post("/api/sync")
def sync_database(db: Session = Depends(get_db)):
    """Manual trigger to sync all outputs/*.json into PostgreSQL."""
    if not db:
        raise HTTPException(status_code=400, detail="Database is not configured. Set DATABASE_URL in .env.")
    count = crud.sync_local_outputs_to_db(db)
    return {"status": "success", "synced_reels_count": count}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
