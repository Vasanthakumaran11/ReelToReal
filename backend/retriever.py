import json
import logging
import re
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types
from sqlalchemy import or_, text
from sqlalchemy.orm import Session

from config import GEMINI_API_KEY, GEMINI_MODEL
from embeddings import generate_embedding
from models import ReelModel
from rag_models import QueryFilters, QueryUnderstanding, RetrievalItem, RetrievalResult
from rag_prompts import QUERY_UNDERSTANDING_PROMPT

logger = logging.getLogger(__name__)
MIN_SIMILARITY = 0.55


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


def _document(reel: ReelModel) -> str:
    values = [reel.place, reel.city, reel.category, reel.cuisine, reel.summary, reel.transcript]
    values.extend(reel.foods or [])
    values.extend(reel.tags or [])
    return " ".join(str(value) for value in values if value)


def _item(reel: ReelModel, similarity: float, method: str) -> RetrievalItem:
    return RetrievalItem(
        reel_id=reel.video_id,
        title=reel.place or reel.destination or reel.video_id,
        source_url=reel.source_url,
        places=[x for x in [reel.place, reel.destination] if x],
        category=reel.category,
        city=reel.city,
        price=reel.tip_summary,
        matched_text=_document(reel),
        similarity=round(float(similarity), 4),
        retrieval_method=method,
    )


def retrieve(db: Session, query: str, top_k: int = 5, filters: Optional[dict] = None,
             history: Optional[List[Dict[str, str]]] = None, use_understanding: bool = True) -> RetrievalResult:
    understanding = _understand(query, history) if use_understanding else QueryUnderstanding(search_text=query, filters=filters or {}, rewritten_query=query)
    requested_filters = filters if filters is not None else understanding.filters.model_dump(exclude_none=True)
    vector = generate_embedding(understanding.search_text)
    distance = ReelModel.embedding.cosine_distance(vector).label("distance")

    def run(filter_rows: bool):
        query_builder = db.query(ReelModel, distance).filter(ReelModel.status == "success", ReelModel.embedding.isnot(None))
        if filter_rows:
            if requested_filters.get("city"):
                query_builder = query_builder.filter(ReelModel.city.ilike(f"%{requested_filters['city']}%"))
            if requested_filters.get("category"):
                query_builder = query_builder.filter(ReelModel.category.ilike(f"%{requested_filters['category']}%"))
            if requested_filters.get("place"):
                query_builder = query_builder.filter(ReelModel.place.ilike(f"%{requested_filters['place']}%"))
        return query_builder.order_by(distance).limit(top_k).all()

    rows = run(bool(requested_filters))
    relaxed = bool(requested_filters) and len(rows) < 2
    if relaxed:
        rows = run(False)
    results = [_item(reel, max(0.0, 1.0 - float(dist)), "vector") for reel, dist in rows]
    results = [item for item in results if item.similarity >= MIN_SIMILARITY]
    return RetrievalResult(
        query=query,
        rewritten_query=understanding.rewritten_query or understanding.search_text,
        results=results,
        filters_applied=requested_filters,
        filters_relaxed=relaxed,
        sub_queries=understanding.sub_queries,
        reason=None if results else "insufficient_context",
    )
