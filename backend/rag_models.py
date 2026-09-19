from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class QueryUnderstanding(BaseModel):
    search_text: str
    filters: "QueryFilters" = Field(default_factory=lambda: QueryFilters())
    sub_queries: List[str] = Field(default_factory=list)
    rewritten_query: Optional[str] = None


class QueryFilters(BaseModel):
    category: Optional[str] = None
    city: Optional[str] = None
    place: Optional[str] = None
    max_price: Optional[float] = None


class RetrievalItem(BaseModel):
    reel_id: str
    title: Optional[str] = None
    source_url: Optional[str] = None
    places: List[str] = Field(default_factory=list)
    category: Optional[str] = None
    city: Optional[str] = None
    price: Optional[str] = None
    matched_text: str = ""
    similarity: float
    retrieval_method: str


class RetrievalResult(BaseModel):
    query: str
    rewritten_query: str
    results: List[RetrievalItem] = Field(default_factory=list)
    filters_applied: Dict[str, Any] = Field(default_factory=dict)
    filters_relaxed: bool = False
    sub_queries: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    reason: Optional[str] = None


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    history: List[Dict[str, str]] = Field(default_factory=list, max_length=12)


class AnswerItem(BaseModel):
    name: str
    city: Optional[str] = None
    price: Optional[str] = None
    note: str = ""
    reel_id: str


class SourceItem(BaseModel):
    reel_id: str
    title: Optional[str] = None
    source_url: Optional[str] = None
    similarity: float


class ChatResponse(BaseModel):
    answer: str
    items: List[AnswerItem] = Field(default_factory=list)
    sources: List[SourceItem] = Field(default_factory=list)
    insufficient_info: bool = False
    filters_applied: Dict[str, Any] = Field(default_factory=dict)
    filters_relaxed: bool = False


class GeneratedAnswer(BaseModel):
    answer: str
    items: List[AnswerItem] = Field(default_factory=list)
    insufficient_info: bool = False
