from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class Run(SQLModel, table=True):
    run_id: str = Field(primary_key=True, index=True)
    query: str
    created_at: datetime
    params_json: Optional[str] = None
    timings_json: Optional[str] = None
    answer_text: Optional[str] = None


class Source(SQLModel, table=True):
    source_id: str = Field(primary_key=True, index=True)
    run_id: str = Field(index=True)
    url: Optional[str] = None
    canonical_url: Optional[str] = None
    domain: Optional[str] = None
    title: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    published_at: Optional[datetime] = None
    accessed_at: Optional[datetime] = None
    media_type: Optional[str] = None
    geography: Optional[str] = None
    paywall: Optional[bool] = None
    credibility_json: Optional[str] = None
    content_hash: Optional[str] = None
    word_count: Optional[int] = None
    raw_text: Optional[str] = None


class Claim(SQLModel, table=True):
    claim_id: str = Field(primary_key=True, index=True)
    run_id: str = Field(index=True)
    text: str
    importance: Optional[float] = None
    answer_sentence_index: Optional[int] = None


class Evidence(SQLModel, table=True):
    claim_id: str = Field(primary_key=True, index=True)
    source_id: str = Field(primary_key=True, index=True)
    coverage_score: Optional[float] = None
    stance: Optional[str] = None
    snippet: Optional[str] = None
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None


class Classification(SQLModel, table=True):
    source_id: str = Field(primary_key=True, index=True)
    label_key: str = Field(primary_key=True, index=True)
    label_value: Optional[str] = None
    confidence: Optional[float] = None

