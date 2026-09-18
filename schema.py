from typing import List, Optional, Literal, Dict, Any, Union
from pydantic import BaseModel, Field

class ReelToRealExtraction(BaseModel):
    """Structured extraction of Reel / Short content for ReelToReal."""
    category: Optional[str] = Field(
        default=None,
        description="Primary category, e.g., 'food_and_drink', 'travel', 'activity', 'shopping', 'lifestyle', 'culture', 'entertainment', etc. Null if unclear."
    )
    place: Optional[str] = Field(
        default=None,
        description="Name of specific venue, restaurant, cafe, shop, hotel, or landmark featured. Null if not specified."
    )
    city: Optional[str] = Field(
        default=None,
        description="City where the venue or activity is located. Null if not specified or purely digital."
    )
    country: Optional[str] = Field(
        default=None,
        description="Country or region where the video content is situated. Null if not specified."
    )
    cuisine: Optional[str] = Field(
        default=None,
        description="Type of cuisine if food-related (e.g. 'Italian', 'Japanese', 'Street Food'). Null if not applicable."
    )
    foods: List[str] = Field(
        default_factory=list,
        description="Specific dishes, menu items, drinks, or foods shown, eaten, or recommended. Empty list if none."
    )
    destination: Optional[str] = Field(
        default=None,
        description="Broader travel destination, district, or geographic area (e.g., 'Amalfi Coast', 'Shinjuku'). Null if not applicable."
    )
    activity_name: Optional[str] = Field(
        default=None,
        description="Name of the specific activity, excursion, workshop, or experience (e.g., 'Kayaking at sunset'). Null if not applicable."
    )
    product_name: Optional[str] = Field(
        default=None,
        description="Name and brand of products featured, reviewed, or recommended. Null if not applicable."
    )
    tip_summary: Optional[str] = Field(
        default=None,
        description="Actionable tips, advice, booking requirements, pricing, or best timing mentioned in the video. Null if none."
    )
    objects: List[str] = Field(
        default_factory=list,
        description="Key physical objects, vehicles, items, or visual elements visible in the video. Empty list if none."
    )
    transcript: Optional[str] = Field(
        default=None,
        description="Verbatim or high-fidelity transcript of spoken audio / dialogue / voiceover. Null if silent or music only."
    )
    ocr_text: List[str] = Field(
        default_factory=list,
        description="Text detected on screen, such as captions, subtitles, signs, menus, labels, or overlay text."
    )
    summary: str = Field(
        ...,
        description="Dense, informative 2-3 sentence semantic summary of the reel's core value, actionability, and context, suitable for vector search embedding."
    )
    tags: List[str] = Field(
        default_factory=list,
        description="Relevant semantic keywords, hashtags, and themes for retrieval and categorization."
    )

class IngestionSuccess(BaseModel):
    video_id: str
    status: Literal["success"] = "success"
    source_type: Literal["url", "upload"]
    source_url: Optional[str] = None
    local_file_path: Optional[str] = None
    ingested_at: str
    audio_present: bool = True
    duration_seconds: float
    processing_mode: Literal["direct_video", "frame_extraction"]
    category: Optional[str] = None
    place: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    cuisine: Optional[str] = None
    foods: List[str] = Field(default_factory=list)
    destination: Optional[str] = None
    activity_name: Optional[str] = None
    product_name: Optional[str] = None
    tip_summary: Optional[str] = None
    objects: List[str] = Field(default_factory=list)
    transcript: Optional[str] = None
    ocr_text: List[str] = Field(default_factory=list)
    summary: str
    tags: List[str] = Field(default_factory=list)

class IngestionFailure(BaseModel):
    video_id: str
    status: Literal["failed"] = "failed"
    failure_stage: Literal["environment", "ingestion", "validation", "extraction"]
    error: str
    fallback_action: Optional[Literal["request_direct_upload"]] = None
    source_type: Optional[Literal["url", "upload"]] = None
    source_url: Optional[str] = None
    ingested_at: Optional[str] = None
