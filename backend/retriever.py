import json
import logging
import math
import os
import re
from typing import Any, Dict, List, Optional
import requests

from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from config import GEMINI_API_KEY, GEMINI_MODEL, OUTPUTS_DIR
from embeddings import generate_embedding
from models import ReelModel
from rag_models import QueryFilters, QueryUnderstanding, RetrievalItem, RetrievalResult
from rag_prompts import QUERY_UNDERSTANDING_PROMPT

logger = logging.getLogger(__name__)
MIN_SIMILARITY = 0.40

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

_REELS_CACHE: List[Dict[str, Any]] = []


def _cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    return dot / (norm1 * norm2) if norm1 and norm2 else 0.0


def _get_saved_reels_fallback() -> List[Dict[str, Any]]:
    """Retrieve saved reels via Supabase REST API or local outputs cache when direct DB is blocked."""
    global _REELS_CACHE
    if _REELS_CACHE:
        return _REELS_CACHE

    results = []
    # 1. Supabase REST API (HTTPS port 443 - works on all networks)
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            resp = requests.get(
                f"{SUPABASE_URL}/rest/v1/reels?select=*&order=ingested_at.desc",
                headers=headers,
                timeout=6,
            )
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    results = data
        except Exception as e:
            logger.warning("Supabase REST reels fetch failed: %s", e)

    # 2. Local outputs/*.json fallback
    if not results and OUTPUTS_DIR.exists():
        for file in OUTPUTS_DIR.glob("*.json"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    rec = json.load(f)
                if rec.get("status") == "success" and rec.get("video_id"):
                    results.append(rec)
            except Exception:
                pass

    if results:
        _REELS_CACHE = results
    return results


def _understand(query: str, history: Optional[List[Dict[str, str]]]) -> QueryUnderstanding:
    history = history or []
    history_text = "\n".join(f"{x.get('role')}: {x.get('content')}" for x in history[-6:])
    if GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=f"{QUERY_UNDERSTANDING_PROMPT}\nHistory:\n{history_text}\nQuery: {query}",
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=QueryUnderstanding,
                    temperature=0.1,
                ),
            )
            parsed = QueryUnderstanding.model_validate_json(response.text)
            if not parsed.rewritten_query:
                parsed.rewritten_query = parsed.search_text
            return parsed
        except Exception as exc:
            logger.warning("Query understanding failed; using deterministic parser: %s", exc)

    rewritten = query
    if history and re.search(r"\b(something|anything)\s+(cheaper|else)\b", query, re.I):
        rewritten = f"{history[-1].get('content', '')}; {query}"
    filters: Dict[str, Any] = {}
    city = re.search(r"\b(?:in|near)\s+([A-Z][A-Za-z ]+)", query)
    price = re.search(r"(?:under|below|less than)\s*(?:₹|rs\.?|inr\s*)?(\d+)", query, re.I)
    if city:
        filters["city"] = city.group(1).strip(" .,?")
    if price:
        filters["max_price"] = float(price.group(1))
    return QueryUnderstanding(search_text=rewritten, filters=filters, rewritten_query=rewritten)


def _document_from_dict(reel: Dict[str, Any]) -> str:
    values = [reel.get("place"), reel.get("city"), reel.get("category"), reel.get("cuisine"), reel.get("summary"), reel.get("transcript")]
    values.extend(reel.get("foods") or [])
    values.extend(reel.get("tags") or [])
    values.extend(reel.get("ocr_text") or [])
    return " ".join(str(value) for value in values if value)


def _item_from_dict(reel: Dict[str, Any], similarity: float, method: str) -> RetrievalItem:
    return RetrievalItem(
        reel_id=str(reel.get("video_id") or ""),
        title=reel.get("place") or reel.get("destination") or reel.get("video_id") or "Saved Spot",
        source_url=reel.get("source_url"),
        places=[x for x in [reel.get("place"), reel.get("destination")] if x],
        category=reel.get("category"),
        city=reel.get("city"),
        price=reel.get("tip_summary") or reel.get("price"),
        matched_text=_document_from_dict(reel),
        similarity=round(float(similarity), 4),
        retrieval_method=method,
    )


def retrieve(
    db: Optional[Session],
    query: str,
    top_k: int = 5,
    filters: Optional[dict] = None,
    history: Optional[List[Dict[str, str]]] = None,
    use_understanding: bool = True,
) -> RetrievalResult:
    """
    Unified RAG retrieval using Gemini API embeddings + vector similarity + keyword semantic matching.
    Operates resiliently whether PostgreSQL port 5432 is accessible or blocked on network.
    """
    understanding = _understand(query, history) if use_understanding else QueryUnderstanding(
        search_text=query, filters=filters or {}, rewritten_query=query
    )
    requested_filters = filters if filters is not None else (understanding.filters.model_dump(exclude_none=True) if hasattr(understanding.filters, "model_dump") else {})

    # Generate query embedding with Gemini API
    query_vector: List[float] = []
    if GEMINI_API_KEY:
        try:
            query_vector = generate_embedding(understanding.search_text)
        except Exception as e:
            logger.warning("Query embedding generation failed: %s", e)

    results: List[RetrievalItem] = []

    # 1. Try Direct PostgreSQL pgvector if DB session is alive
    if db:
        try:
            distance = ReelModel.embedding.cosine_distance(query_vector).label("distance")
            q_builder = db.query(ReelModel, distance).filter(ReelModel.status == "success", ReelModel.embedding.isnot(None))
            rows = q_builder.order_by(distance).limit(top_k * 2).all()
            for r, dist in rows:
                sim = max(0.0, 1.0 - float(dist))
                results.append(_item_from_dict(r.__dict__, sim, "pgvector"))
        except Exception as e:
            logger.info("Direct DB pgvector search unavailable, using resilient fallback: %s", e)
            results = []

    # 2. Resilient In-Memory Vector Search over Supabase / cached saved reels
    if not results:
        all_reels = _get_saved_reels_fallback()
        scored: List[tuple[float, Dict[str, Any]]] = []

        query_tokens = set(re.findall(r"\w{3,}", understanding.search_text.lower()))

        for r in all_reels:
            # Skip invalid placeholder reels
            if r.get("video_id") == "test_reel":
                continue

            emb = r.get("embedding")
            if isinstance(emb, str):
                try:
                    emb = json.loads(emb)
                except Exception:
                    emb = None

            # Compute vector cosine similarity
            v_sim = 0.0
            if query_vector and emb:
                v_sim = _cosine_similarity(query_vector, emb)

            # Compute keyword & semantic lexical match
            doc_text = _document_from_dict(r).lower()
            token_matches = sum(1 for tok in query_tokens if tok in doc_text)
            kw_score = (token_matches / max(len(query_tokens), 1)) if query_tokens else 0.0

            # Boost if city or place matches explicitly
            city_in_query = any(tok in doc_text for tok in query_tokens if tok in ["erode", "salem", "chennai", "ooty", "bangalore"])
            if city_in_query:
                kw_score += 0.25

            # Hybrid score: 70% vector semantic similarity + 30% lexical keyword score
            final_score = (v_sim * 0.7) + (min(kw_score, 1.0) * 0.3) if query_vector else kw_score
            scored.append((final_score, r))

        scored.sort(key=lambda x: x[0], reverse=True)
        for score, reel in scored[:top_k]:
            results.append(_item_from_dict(reel, score, "gemini_vector_hybrid"))

    # Filter out scores below minimal threshold unless no other matches
    filtered = [item for item in results if item.similarity >= MIN_SIMILARITY]
    final_results = filtered if filtered else results[:top_k]

    return RetrievalResult(
        query=query,
        rewritten_query=understanding.rewritten_query or understanding.search_text,
        results=final_results,
        filters_applied=requested_filters,
        filters_relaxed=len(final_results) > 0,
        sub_queries=understanding.sub_queries,
        reason=None if final_results else "insufficient_context",
    )
