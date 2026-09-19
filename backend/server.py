import os
import json
import uuid
import shutil
import asyncio
import re
from urllib.parse import quote
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google import genai
from google.genai import types

import requests
from config import VIDEOS_DIR, FRAMES_DIR, OUTPUTS_DIR, GEMINI_API_KEY, GEMINI_MODEL
from database import get_db, init_db, engine, SessionLocal
import crud
from pipeline import run_ingestion_pipeline
from embeddings import generate_embedding
from rag_models import ChatRequest, ChatResponse
from retriever import retrieve
from generator import answer

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Do not block API startup on a remote database or pgvector extension check.
    if engine:
        asyncio.create_task(_initialize_database())
    yield


async def _initialize_database():
    print("[Startup] Initializing database and pgvector extension in background...")
    try:
        success = await asyncio.wait_for(asyncio.to_thread(init_db), timeout=8)
    except asyncio.TimeoutError:
        print("[Warning] Database initialization timed out; local API remains available.")
        return
    if success and SessionLocal:
        try:
            with SessionLocal() as db:
                synced = crud.sync_local_outputs_to_db(db)
                print(f"[Startup] Synced {synced} local reels into PostgreSQL.")
        except Exception as exc:
            print(f"[Warning] Database sync failed: {exc}")

app = FastAPI(
    title="ReelToReal Ingestion & Planning API",
    description="Multimodal ingestion pipeline, PostgreSQL + pgvector storage, and AI itinerary planner.",
    version="1.0.0",
    lifespan=lifespan
)

app.mount("/frames", StaticFiles(directory=str(FRAMES_DIR)), name="frames")

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


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Optional[Session] = Depends(get_db)):
    """Retrieve saved Reels and answer only from that retrieved context using Gemini RAG."""
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    try:
        retrieval = retrieve(db, query, history=request.history)
        return answer(query, retrieval, request.history)
    except Exception as exc:
        print(f"[Error] RAG chat failed: {exc}")
        try:
            retrieval = retrieve(None, query, history=request.history)
            return answer(query, retrieval, request.history)
        except Exception as e2:
            print(f"[Fatal] RAG fallback failed: {e2}")
            return ChatResponse(
                answer="I'm having a brief connection issue reaching your saved reels. Please try asking again in a moment.",
                insufficient_info=True,
            )

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

    # If direct connection is blocked on campus network, check via Supabase HTTPS REST
    if not db_connected and SUPABASE_URL and SUPABASE_KEY:
        try:
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            r = requests.get(f"{SUPABASE_URL}/rest/v1/reels?select=video_id", headers=headers, timeout=5)
            if r.status_code == 200:
                reels_count = len(r.json())
                db_connected = True
        except Exception:
            pass

    return {
        "status": "online",
        "database_connected": db_connected,
        "database_reels_count": reels_count,
        "gemini_api_key_configured": bool(GEMINI_API_KEY)
    }

COMMON_FRAME_STOPWORDS = {
    "erode", "salem", "chennai", "india", "tamil", "tamilnadu",
    "shorts", "short", "reels", "reel", "video", "videos", "part",
    "near", "best", "food", "shop", "spot", "place", "places", "the", "and"
}

def _frame_tokens(value: str) -> set[str]:
    """Extract meaningful ASCII tokens for matching DB names to Unicode frame folders, excluding common stopwords."""
    raw = set(re.findall(r"[a-z0-9]{3,}", value.casefold()))
    return raw - COMMON_FRAME_STOPWORDS


def _with_thumbnail(reel: Dict[str, Any]) -> Dict[str, Any]:
    """Attach the first generated frame, strictly matching the reel to avoid false positives."""
    if reel.get("thumbnail_url"):
        return reel

    video_id = str(reel.get("video_id") or "")
    if not video_id:
        return reel

    exact_dir = FRAMES_DIR / video_id
    frame_dir = exact_dir if exact_dir.is_dir() else None

    if frame_dir is None:
        target_tokens = _frame_tokens(video_id)
        if target_tokens:
            best_score = 0
            best_candidate = None
            for candidate in FRAMES_DIR.iterdir():
                if not candidate.is_dir():
                    continue
                candidate_tokens = _frame_tokens(candidate.name)
                shared = target_tokens & candidate_tokens
                # Must share at least 2 distinct distinctive keywords or have high Jaccard similarity
                jaccard = len(shared) / max(len(target_tokens | candidate_tokens), 1)
                score = sum(len(token) for token in shared)
                if (len(shared) >= 2 or jaccard >= 0.4) and score > best_score:
                    best_score = score
                    best_candidate = candidate
            frame_dir = best_candidate

    if frame_dir:
        first_frame = next(iter(sorted(frame_dir.glob("frame_*.jpg"))), None)
        if first_frame:
            reel["thumbnail_url"] = f"/frames/{quote(frame_dir.name, safe='')}/{first_frame.name}"
    return reel


@app.get("/api/reels")
def list_reels(category: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns all ingested reels. Queries direct PostgreSQL, falls back to Supabase REST, then local outputs/."""
    if db:
        try:
            db_reels = crud.get_all_reels(db, category=category)
            if db_reels:
                return [_with_thumbnail(reel) for reel in db_reels]
        except Exception as e:
            print(f"[Warning] Direct DB query failed: {e}")

    # Fallback 1: Supabase REST API over HTTPS port 443 (resilient against campus firewall blocks)
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            params = {"select": "*", "order": "ingested_at.desc"}
            if category and category.lower() != "all":
                params["category"] = f"ilike.*{category}*"
            resp = requests.get(f"{SUPABASE_URL}/rest/v1/reels", headers=headers, params=params, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                for item in data:
                    item["saved"] = True
                return [_with_thumbnail(item) for item in data]
        except Exception as e:
            print(f"[Warning] Supabase REST query failed: {e}")

    # Fallback 2: Local outputs directory
    results = []
    if OUTPUTS_DIR.exists():
        for file in OUTPUTS_DIR.glob("*.json"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if data.get("status") == "success":
                    data["saved"] = True
                    results.append(_with_thumbnail(data))
            except Exception:
                pass
    return results

def _with_plan_thumbnail(plan: Dict[str, Any]) -> Dict[str, Any]:
    """Attach the authentic reel keyframe thumbnail to an itinerary plan."""
    if plan.get("thumbnail_url"):
        return plan

    reel_ids = plan.get("reel_ids") or []
    for rid in reel_ids:
        exact = FRAMES_DIR / str(rid)
        if exact.is_dir():
            first_frame = next(iter(sorted(exact.glob("frame_*.jpg"))), None)
            if first_frame:
                plan["thumbnail_url"] = f"/frames/{quote(exact.name, safe='')}/{first_frame.name}"
                return plan

    # Fallback to first available frame in FRAMES_DIR
    for d in sorted(FRAMES_DIR.iterdir()):
        if d.is_dir():
            first_frame = next(iter(sorted(d.glob("frame_*.jpg"))), None)
            if first_frame:
                plan["thumbnail_url"] = f"/frames/{quote(d.name, safe='')}/{first_frame.name}"
                break
    return plan


@app.get("/api/plans")
def list_plans(db: Session = Depends(get_db)):
    """Returns all created AI plans with authentic reel keyframe thumbnails."""
    plans = []
    if db:
        try:
            plans = crud.get_all_plans(db)
        except Exception as e:
            print(f"[Warning] Failed to fetch plans from direct DB: {e}")

    if not plans and SUPABASE_URL and SUPABASE_KEY:
        try:
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            resp = requests.get(f"{SUPABASE_URL}/rest/v1/plans?select=*&order=created_at.desc", headers=headers, timeout=5)
            if resp.status_code == 200 and resp.json():
                plans = resp.json()
        except Exception:
            pass

    return [_with_plan_thumbnail(p) for p in plans]

@app.post("/api/plan")
def craft_plan(request: PlanRequest, db: Optional[Session] = Depends(get_db)):
    """
    RAG-powered AI Plan Generator:
    1. Embeds question using Gemini
    2. Performs vector similarity search across saved reels
    3. Prompts Gemini with matching reels to construct an actionable itinerary
    """
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    context_reels = []
    reel_ids = []
    locations = []

    # 1. Use robust RAG retrieval powered by Gemini embeddings
    try:
        retrieval = retrieve(db, question, top_k=5)
        for item in retrieval.results:
            context_reels.append(f"- Place: {item.title} ({item.city or 'Nearby'})\n  Details: {item.matched_text[:250]}\n  Tips: {item.price}")
            reel_ids.append(item.reel_id)
    except Exception as e:
        print(f"[Warning] RAG retrieval for plan failed: {e}")

    # Fallback to direct saved reels list if context is empty
    from retriever import _get_saved_reels_fallback
    all_reels = _get_saved_reels_fallback()
    if not context_reels:
        for r in all_reels[:4]:
            context_reels.append(f"- Place: {r.get('place')} ({r.get('city')})\n  Summary: {r.get('summary')}")
            reel_ids.append(str(r.get("video_id") or ""))

    # Extract location coordinates for OpenStreetMap route mapping
    reel_map = {str(r.get("video_id") or ""): r for r in all_reels}
    for rid in reel_ids:
        r = reel_map.get(rid)
        if r and r.get("location") and isinstance(r["location"], dict) and r["location"].get("latitude") and r["location"].get("longitude"):
            locations.append({
                "name": r.get("place") or r.get("city") or "Stop",
                "lat": float(r["location"]["latitude"]),
                "lng": float(r["location"]["longitude"]),
                "tone": "start" if len(locations) == 0 else "mid"
            })

    # 2. Call Gemini to synthesize a structured plan grounded in the retrieved reels
    plan_data = _generate_ai_itinerary_plan(question, context_reels, locations, reel_ids, reel_map)

    # 3. Persist plan to DB if available
    if db:
        try:
            crud.save_plan_to_db(db, plan_data)
        except Exception as e:
            print(f"[Warning] Failed saving plan to DB: {e}")
    return _with_plan_thumbnail(plan_data)

def _enrich_timeline_with_reels(
    timeline: List[Dict[str, Any]],
    reel_ids: List[str],
    reel_map: Dict[str, Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Grounds each AI-written timeline stop with factual data from its matching saved reel
    (image, price, category, exact coordinates) by simple positional order, since the
    reels were handed to Gemini in this same order when the itinerary was written.
    """
    for i, stage in enumerate(timeline):
        if i >= len(reel_ids):
            continue
        r = reel_map.get(reel_ids[i])
        if not r:
            continue

        r = _with_thumbnail(r)
        stage["reel_id"] = reel_ids[i]
        if r.get("thumbnail_url"):
            stage["thumbnail_url"] = r["thumbnail_url"]
        if r.get("city"):
            stage["city"] = r["city"]
        price = r.get("tip_summary") or r.get("price")
        if price:
            stage["price"] = price
        if r.get("category"):
            stage["category"] = r["category"]

        loc = r.get("location")
        if isinstance(loc, dict):
            if loc.get("formatted_address"):
                stage["location_text"] = loc["formatted_address"]
            if loc.get("latitude") and loc.get("longitude"):
                stage["latitude"] = float(loc["latitude"])
                stage["longitude"] = float(loc["longitude"])
        if not stage.get("location_text") and r.get("city"):
            stage["location_text"] = r["city"]
    return timeline


def _generate_ai_itinerary_plan(
    question: str,
    context_reels: List[str],
    locations: List[Dict[str, Any]],
    reel_ids: List[str],
    reel_map: Optional[Dict[str, Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Uses Gemini to synthesize an actionable, richly detailed itinerary plan."""
    plan_id = f"plan_{uuid.uuid4().hex[:10]}"
    reel_map = reel_map or {}

    def _fallback_timeline() -> List[Dict[str, Any]]:
        """Builds a timeline straight from the matched reels when Gemini is unavailable."""
        stages = []
        for i, rid in enumerate(reel_ids[:5]):
            r = reel_map.get(rid) or {}
            name = r.get("place") or r.get("destination") or r.get("city") or f"Stop {i + 1}"
            tone = "start" if i == 0 else ("end" if i == len(reel_ids) - 1 else "mid")
            stages.append({
                "label": name,
                "detail": r.get("tip_summary") or r.get("summary") or "Explore this saved spot",
                "tone": tone,
                "detailed_description": r.get("summary") or "",
            })
        if not stages:
            stages = [{"label": "Explore Spots", "detail": "Visit recommended places", "tone": "start"}]
        return stages

    if not GEMINI_API_KEY:
        timeline = _enrich_timeline_with_reels(_fallback_timeline(), reel_ids, reel_map)
        return {
            "plan_id": plan_id,
            "title": question[:40],
            "question": question,
            "reel_ids": reel_ids,
            "timeline_label": "AI Plan (Offline)",
            "overview": f"A self-guided trip built from your saved reels for \"{question}\". Full AI narration is unavailable right now, so follow the stops below in order using the live map for directions.",
            "timeline": timeline,
            "key_dates": [{"date": "Upcoming Trip", "window": "Full Day", "note": "Flexible schedule"}],
            "locations": locations,
            "steps": [{"label": "Pack essentials", "done": False}],
            "packing": [{"label": "Camera / Phone", "done": False}]
        }

    client = genai.Client(api_key=GEMINI_API_KEY)
    context_text = "\n".join(context_reels) if context_reels else "No specific reel match found. Provide a general realistic itinerary."

    prompt = f"""You are the ReelToReal Itinerary Planner, a friendly and knowledgeable trip-planning companion.
User request: "{question}"

Relevant reels retrieved from our database, in visiting order:
{context_text}

Generate an actionable, richly detailed itinerary in JSON matching this exact schema:
{{
  "title": "Short compelling title",
  "timeline_label": "Summary label of the trip flow",
  "overview": "5-7 sentence rich narrative describing the overall trip: the atmosphere, why it's worth doing, and the logical pathway connecting the stops in order.",
  "timeline": [
    {{
      "label": "Stop name (must match one of the Relevant reels' place names above, in the same order)",
      "detail": "Short one-line action for this stop (what to do or eat)",
      "tone": "start | mid | end",
      "tagline": "Short punchy subtitle for this stop",
      "best_time_to_visit": "e.g. Morning 8:00 - 10:00 AM",
      "vibe": "e.g. Nature, Relaxing, Family-friendly",
      "key_points": [
        {{"title": "Highlight title", "desc": "One-sentence detail"}}
      ],
      "detailed_description": "3-4 sentence rich paragraph about this specific stop: atmosphere, what makes it worth visiting, and any tips.",
      "travel_note": "How to get to this stop from the previous one (direction, rough distance/time) — the pathway between stops"
    }}
  ],
  "key_dates": [
    {{"date": "Day or timing", "window": "e.g. 8:00 AM - 11:00 AM", "note": "Actionable advice"}}
  ],
  "steps": [
    {{"label": "Action item", "done": false}}
  ],
  "packing": [
    {{"label": "Item to bring", "done": false}}
  ]
}}

Only use facts grounded in the relevant reels above. Provide 2-4 key_points per stop. The timeline must have exactly one entry per relevant reel listed above, in the same order.
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
        plan_json["timeline"] = _enrich_timeline_with_reels(plan_json.get("timeline") or [], reel_ids, reel_map)
        return plan_json
    except Exception as e:
        print(f"[Error] Gemini plan generation failed: {e}")
        timeline = _enrich_timeline_with_reels(_fallback_timeline(), reel_ids, reel_map)
        return {
            "plan_id": plan_id,
            "title": question[:40],
            "question": question,
            "reel_ids": reel_ids,
            "overview": f"A self-guided trip built from your saved reels for \"{question}\". Follow the stops below in order using the live map for directions.",
            "timeline": timeline,
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
