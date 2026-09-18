import re
import urllib.parse
import requests
from typing import Optional, List, Dict, Any, Tuple
from schema import LocationDetails

OSM_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {
    "User-Agent": "ReelToReal-Ingestion/1.0 (contact@reeltoreal.local)"
}

TAMIL_TRANSLITERATION_MAP = {
    "அண்ணாநகர்": "Anna Nagar",
    "அண்ணா நகர்": "Anna Nagar",
    "மேட்டூர்": "Mettur",
    "சேலம்": "Salem",
    "பிரதான சாலை": "Main Road",
    "சாலை": "Road",
    "தெரு": "Street",
    "நகர்": "Nagar"
}

def clean_ocr_addresses(ocr_text: List[str]) -> List[str]:
    """Extracts candidate address lines from OCR text, removing phone numbers and watermarks."""
    candidates = []
    for line in ocr_text:
        line_clean = line.strip()
        # Skip phone numbers
        if re.search(r"^\+?\d[\d\s-]{7,}\d$", line_clean):
            continue
        # Skip very short tokens or obvious channel watermarks
        if len(line_clean) < 4:
            continue
        if re.search(r"(mind voice|shorts|reels|subscribe|follow)", line_clean, re.IGNORECASE):
            continue
        candidates.append(line_clean)

        # Transliterate known Tamil address tokens
        transliterated = line_clean
        for tamil_term, english_term in TAMIL_TRANSLITERATION_MAP.items():
            transliterated = transliterated.replace(tamil_term, english_term)
        if transliterated != line_clean:
            candidates.append(transliterated)

        # Also extract comma-split parts (e.g. "Anna Nagar", "Mettur Road")
        parts = [p.strip() for p in re.split(r"[,;]", transliterated) if len(p.strip()) > 3]
        for part in parts:
            if not re.match(r"^\d+$", part) and part not in candidates:
                candidates.append(part)

    return candidates

def _query_nominatim(query_str: str) -> Optional[Dict[str, Any]]:
    """Performs a search on OpenStreetMap Nominatim API."""
    params = {
        "q": query_str,
        "format": "jsonv2",
        "addressdetails": 1,
        "limit": 1
    }
    try:
        resp = requests.get(OSM_NOMINATIM_URL, params=params, headers=HEADERS, timeout=8)
        if resp.status_code == 200:
            results = resp.json()
            if results and len(results) > 0:
                return results[0]
    except Exception:
        pass
    return None

def resolve_location(
    place: Optional[str] = None,
    city: Optional[str] = None,
    country: Optional[str] = None,
    ocr_text: Optional[List[str]] = None
) -> Optional[LocationDetails]:
    """
    Resolves real-world GPS coordinates and Google Maps URLs using OpenStreetMap.
    Cascades from highest precision (venue/address) down to city level.
    """
    if not (place or city or ocr_text):
        return None

    ocr_lines = clean_ocr_addresses(ocr_text or [])

    # Build prioritized candidate queries
    queries: List[Tuple[str, str]] = [] # (query_string, precision_label)

    # 1. Exact Place + City + Country
    if place and city:
        queries.append((f"{place}, {city}, {country or ''}".strip(" ,"), "venue"))

    # 2. OCR Address lines + City
    for addr in ocr_lines:
        if city and city.lower() not in addr.lower():
            queries.append((f"{addr}, {city}, {country or ''}".strip(" ,"), "street"))
        else:
            queries.append((f"{addr}, {country or ''}".strip(" ,"), "street"))

    # 3. Substrings: check for common locality markers (Nagar, Salai, Road, Street, Ward)
    for addr in ocr_lines:
        match = re.search(r"([A-Za-z\u0B80-\u0BFF\s]+(?:Nagar|Road|Street|Salai|Main Road|Circle|Colony|Layout))", addr, re.IGNORECASE)
        if match and city:
            queries.append((f"{match.group(1).strip()}, {city}, {country or ''}".strip(" ,"), "neighborhood"))

    # 4. Fallback: City + Country
    if city:
        queries.append((f"{city}, {country or ''}".strip(" ,"), "city"))
    elif place and country:
        queries.append((f"{place}, {country}".strip(" ,"), "venue"))

    matched_result = None
    matched_precision = "none"
    matched_query = ""

    for query, precision in queries:
        clean_q = re.sub(r"\s+", " ", query).strip(" ,")
        res = _query_nominatim(clean_q)
        if res:
            matched_result = res
            matched_precision = precision
            matched_query = clean_q
            break

    if not matched_result:
        # If OSM has no match at all, generate search query for Google Maps if venue/city is known
        if place or city:
            search_terms = " ".join(filter(None, [place, city, country]))
            encoded_search = urllib.parse.quote_plus(search_terms)
            return LocationDetails(
                resolved_query=search_terms,
                latitude=None,
                longitude=None,
                formatted_address=f"{place or ''}, {city or ''}".strip(" ,"),
                google_maps_url=f"https://www.google.com/maps/search/?api=1&query={encoded_search}",
                match_precision="none"
            )
        return None

    lat = float(matched_result.get("lat")) if matched_result.get("lat") else None
    lon = float(matched_result.get("lon")) if matched_result.get("lon") else None
    display_name = matched_result.get("display_name")
    osm_id = matched_result.get("osm_id")
    osm_type = matched_result.get("osm_type")

    # Generate Google Maps and OSM deep links
    google_maps_url = None
    if lat is not None and lon is not None:
        if place:
            encoded_place = urllib.parse.quote_plus(f"{place}, {city or ''}".strip(" ,"))
            google_maps_url = f"https://www.google.com/maps/search/?api=1&query={encoded_place}&query_place_id={lat},{lon}"
        else:
            google_maps_url = f"https://www.google.com/maps/search/?api=1&query={lat},{lon}"

    open_street_map_url = None
    if osm_type and osm_id:
        osm_prefix = osm_type[0] # n for node, w for way, r for relation
        open_street_map_url = f"https://www.openstreetmap.org/{osm_prefix}/{osm_id}"

    return LocationDetails(
        resolved_query=matched_query,
        latitude=lat,
        longitude=lon,
        formatted_address=display_name,
        google_maps_url=google_maps_url,
        open_street_map_url=open_street_map_url,
        osm_type=osm_type,
        osm_id=str(osm_id) if osm_id else None,
        match_precision=matched_precision
    )
