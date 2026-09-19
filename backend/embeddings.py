from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from config import GEMINI_API_KEY

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSION = 768

def build_search_document(record: Dict[str, Any]) -> str:
    """
    Synthesizes a high-density semantic text representation of a reel record
    optimized for semantic vector retrieval.
    """
    parts = []
    if record.get("place"):
        place_info = record["place"]
        if record.get("city"):
            place_info += f", {record['city']}"
        if record.get("country"):
            place_info += f", {record['country']}"
        parts.append(f"Place: {place_info}")

    if record.get("category"):
        parts.append(f"Category: {record['category']}")

    if record.get("cuisine"):
        parts.append(f"Cuisine: {record['cuisine']}")

    foods = record.get("foods") or []
    if foods:
        parts.append(f"Dishes & Foods: {', '.join(foods)}")

    if record.get("activity_name"):
        parts.append(f"Activity: {record['activity_name']}")

    if record.get("product_name"):
        parts.append(f"Product: {record['product_name']}")

    if record.get("tip_summary"):
        parts.append(f"Tips: {record['tip_summary']}")

    if record.get("summary"):
        parts.append(f"Summary: {record['summary']}")

    tags = record.get("tags") or []
    if tags:
        parts.append(f"Tags: {', '.join(tags)}")

    ocr_text = record.get("ocr_text") or []
    if ocr_text:
        parts.append(f"Signboard / On-screen Text: {', '.join(ocr_text[:5])}")

    return "\n".join(parts)

def generate_embedding(text: str) -> List[float]:
    """
    Generates a 768-dimensional normalized vector embedding using Gemini API,
    falling back to GEMINI_BACKUP_API_KEY if primary quota is exhausted.
    """
    from config import get_gemini_client

    config = types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIMENSION)

    for use_backup in [False, True]:
        try:
            client = get_gemini_client(backup=use_backup)
            res = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text,
                config=config
            )
            if res.embeddings and len(res.embeddings) > 0:
                return res.embeddings[0].values
        except Exception as e:
            if not use_backup:
                continue
            raise RuntimeError(f"Failed to generate embedding vector from Gemini: {e}")
    raise RuntimeError("Failed to generate embedding vector from Gemini.")
