import json
import logging
import re
from typing import Dict, List, Optional, Any
from urllib.parse import quote

from google import genai
from google.genai import types

from config import GEMINI_MODEL, FRAMES_DIR, get_gemini_client
from rag_models import ChatResponse, GeneratedAnswer, RetrievalResult, SourceItem, AnswerItem
from rag_prompts import GENERATION_PROMPT
from retriever import _get_saved_reels_fallback

logger = logging.getLogger(__name__)


def _find_thumbnail_for_reel(video_id: str, reel_record: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """Resolve authentic video keyframe thumbnail for a reel."""
    if reel_record and reel_record.get("thumbnail_url"):
        return reel_record["thumbnail_url"]

    exact = FRAMES_DIR / video_id
    if exact.is_dir():
        first_frame = next(iter(sorted(exact.glob("frame_*.jpg"))), None)
        if first_frame:
            return f"/frames/{quote(exact.name, safe='')}/{first_frame.name}"

    # Search folders
    v_clean = re.sub(r"[^a-zA-Z0-9]", "", video_id.lower())
    for d in FRAMES_DIR.iterdir():
        if d.is_dir():
            d_clean = re.sub(r"[^a-zA-Z0-9]", "", d.name.lower())
            if v_clean and (v_clean[:15] in d_clean or d_clean[:15] in v_clean):
                first_frame = next(iter(sorted(d.glob("frame_*.jpg"))), None)
                if first_frame:
                    return f"/frames/{quote(d.name, safe='')}/{first_frame.name}"
    return None


def answer(query: str, retrieval: RetrievalResult, history: Optional[List[Dict[str, str]]] = None) -> ChatResponse:
    if not retrieval.results:
        return ChatResponse(
            answer="I checked your saved reels, but couldn't find a direct match for that request. Try asking about 10rs parotta, unlimited biryani, Kodiveri waterfalls, or shopping in Erode!",
            insufficient_info=True,
            filters_applied=retrieval.filters_applied,
            filters_relaxed=retrieval.filters_relaxed,
        )

    all_reels = _get_saved_reels_fallback()
    reel_map = {str(r.get("video_id") or ""): r for r in all_reels}

    sources = [
        SourceItem(
            reel_id=x.reel_id,
            title=x.title,
            source_url=x.source_url,
            similarity=x.similarity,
        )
        for x in retrieval.results
    ]

    context_lines = []
    for item in retrieval.results:
        r_data = reel_map.get(item.reel_id, {})
        foods_str = ", ".join(r_data.get("foods") or [])
        loc_str = r_data.get("location", {}).get("formatted_address") if isinstance(r_data.get("location"), dict) else (item.city or "")
        context_lines.append(
            f"reel_id: {item.reel_id}\nSpot: {item.title}\nCity: {item.city}\nAddress: {loc_str}\nFoods: {foods_str}\nPrice: {item.price}\nDetails: {item.matched_text}"
        )
    context = "\n\n".join(context_lines)

    prompt = f"{GENERATION_PROMPT}\nUser Question: {query}\n\nSaved Reel Context:\n{context}"

    parsed = None
    # Execute with primary key, falling back automatically to GEMINI_BACKUP_API_KEY if needed
    for use_backup in [False, True]:
        try:
            client = get_gemini_client(backup=use_backup)
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
                raw_text = re.sub(r"\s*```$", "", raw_text)
            parsed = json.loads(raw_text)
            break
        except Exception as exc:
            logger.warning("Gemini generation attempt (backup=%s) failed: %s", use_backup, exc)
            if use_backup:
                logger.exception("Both primary and backup Gemini keys failed")

    # Build rich AnswerItems with thumbnails, famous products, pricing, and coordinates
    allowed = {item.reel_id for item in retrieval.results}
    valid_items = []

    if parsed and isinstance(parsed.get("items"), list):
        for itm in parsed.get("items", []):
            rid = itm.get("reel_id") or ""
            if rid not in allowed and retrieval.results:
                rid = retrieval.results[0].reel_id
            r_record = reel_map.get(rid, {})

            # Coordinates
            lat, lng, addr = None, None, None
            if r_record.get("location") and isinstance(r_record["location"], dict):
                lat = r_record["location"].get("latitude")
                lng = r_record["location"].get("longitude")
                addr = r_record["location"].get("formatted_address") or r_record["location"].get("resolved_query")

            # Correct known geocode overrides (e.g. Banu Mess Erode PS Park)
            if "banu mess" in rid.lower() or "10rs parotta in erode" in rid.lower():
                lat, lng = 11.3424, 77.7281
                addr = "PS Park Junction, Erode, Tamil Nadu, India"
            elif "kunderipallam" in rid.lower() or "gunderipallam" in rid.lower():
                lat, lng = 11.5303, 77.2917
                addr = "Gunderipallam Reservoir, Sathyamangalam, Erode, Tamil Nadu"

            thumb = _find_thumbnail_for_reel(rid, r_record)
            famous_prod = itm.get("famous_product") or (r_record.get("foods")[0] if r_record.get("foods") else r_record.get("product_name"))

            valid_items.append(
                AnswerItem(
                    name=itm.get("name") or r_record.get("place") or "Saved Spot",
                    city=itm.get("city") or r_record.get("city"),
                    price=itm.get("price") or r_record.get("tip_summary"),
                    famous_product=famous_prod,
                    note=itm.get("note") or r_record.get("summary") or "",
                    thumbnail_url=thumb,
                    latitude=lat,
                    longitude=lng,
                    formatted_address=addr,
                    reel_id=rid,
                )
            )

    # Fallback if model failed or returned 0 items
    if not valid_items:
        for itm in retrieval.results[:3]:
            r_record = reel_map.get(itm.reel_id, {})
            lat, lng, addr = None, None, None
            if r_record.get("location") and isinstance(r_record["location"], dict):
                lat = r_record["location"].get("latitude")
                lng = r_record["location"].get("longitude")
                addr = r_record["location"].get("formatted_address")

            if "banu mess" in itm.reel_id.lower() or "10rs parotta in erode" in itm.reel_id.lower():
                lat, lng = 11.3424, 77.7281
                addr = "PS Park Junction, Erode, Tamil Nadu, India"
            elif "kunderipallam" in itm.reel_id.lower() or "gunderipallam" in itm.reel_id.lower():
                lat, lng = 11.5303, 77.2917
                addr = "Gunderipallam Reservoir, Sathyamangalam, Erode, Tamil Nadu"
            thumb = _find_thumbnail_for_reel(itm.reel_id, r_record)
            famous_prod = r_record.get("foods")[0] if r_record.get("foods") else r_record.get("product_name")

            valid_items.append(
                AnswerItem(
                    name=itm.title or r_record.get("place") or "Saved Spot",
                    city=itm.city or r_record.get("city"),
                    price=itm.price or r_record.get("tip_summary"),
                    famous_product=famous_prod,
                    note=itm.matched_text[:140] if itm.matched_text else "",
                    thumbnail_url=thumb,
                    latitude=lat,
                    longitude=lng,
                    formatted_address=addr,
                    reel_id=itm.reel_id,
                )
            )

    answer_text = parsed.get("answer") if parsed and parsed.get("answer") else (
        f"Based on your saved reels, here are the top spots matching '{query}':"
    )

    return ChatResponse(
        answer=answer_text,
        items=valid_items,
        sources=sources,
        insufficient_info=bool(parsed.get("insufficient_info", False)) if parsed else False,
        filters_applied=retrieval.filters_applied,
        filters_relaxed=retrieval.filters_relaxed,
    )
