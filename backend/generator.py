import json
import logging
from typing import Dict, List, Optional

from google import genai
from google.genai import types

from config import GEMINI_API_KEY, GEMINI_MODEL
from rag_models import ChatResponse, GeneratedAnswer, RetrievalResult, SourceItem
from rag_prompts import GENERATION_PROMPT

logger = logging.getLogger(__name__)


def answer(query: str, retrieval: RetrievalResult, history: Optional[List[Dict[str, str]]] = None) -> ChatResponse:
    if not retrieval.results:
        return ChatResponse(
            answer="Your saved Reels do not contain enough information to answer that yet.",
            insufficient_info=True,
            filters_applied=retrieval.filters_applied,
            filters_relaxed=retrieval.filters_relaxed,
        )

    sources = [SourceItem(reel_id=x.reel_id, title=x.title, source_url=x.source_url, similarity=x.similarity) for x in retrieval.results]
    context = "\n\n".join(
        f"reel_id={item.reel_id}\nTitle={item.title}\nCity={item.city}\nCategory={item.category}\nDetails={item.matched_text}"
        for item in retrieval.results
    )
    if not GEMINI_API_KEY:
        return ChatResponse(
            answer="I found saved Reels, but Gemini is not configured to summarize them.",
            sources=sources,
            insufficient_info=True,
            filters_applied=retrieval.filters_applied,
            filters_relaxed=retrieval.filters_relaxed,
        )

    client = genai.Client(api_key=GEMINI_API_KEY)
    prompt = f"{GENERATION_PROMPT}\nQuestion: {query}\nSaved Reel context:\n{context}"
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeneratedAnswer,
                temperature=0.2,
            ),
        )
        result = GeneratedAnswer.model_validate_json(response.text)
        allowed = {item.reel_id for item in retrieval.results}
        result.items = [item for item in result.items if item.reel_id in allowed]
        return ChatResponse(
            answer=result.answer,
            items=result.items,
            sources=sources,
            insufficient_info=result.insufficient_info,
            filters_applied=retrieval.filters_applied,
            filters_relaxed=retrieval.filters_relaxed,
        )
    except Exception as exc:
        logger.exception("RAG generation failed")
        return ChatResponse(
            answer="I found matching saved Reels, but could not generate the answer right now.",
            sources=sources,
            insufficient_info=True,
            filters_applied=retrieval.filters_applied,
            filters_relaxed=retrieval.filters_relaxed,
        )
