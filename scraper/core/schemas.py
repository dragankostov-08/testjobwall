"""
Pydantic schemas for data validation.
"""

from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from typing import Optional, List
from uuid import UUID


class JobSchema(BaseModel):
    """Schema for a job listing."""

    title: str = Field(..., min_length=1, max_length=255)
    company: str = Field(..., min_length=1, max_length=255)
    location: str = Field(..., min_length=1, max_length=100)
    url: str = Field(..., min_length=1)
    description: Optional[str] = None
    employment_type: Optional[str] = None
    categories: List[str] = Field(default=["Останато"])
    is_remote: bool = False
    salary: Optional[str] = None
    source_name: str = Field(..., min_length=1)
    source_url: Optional[str] = None
    application_url: Optional[str] = None
    posted_date: Optional[datetime] = None
    company_logo_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    metadata: Optional[dict] = Field(default_factory=dict)

    class Config:
        from_attributes = True


class ScrapedJobSchema(BaseModel):
    """Schema for raw scraped job data before normalization."""

    title: str
    company: str
    location: str
    url: str
    source_id: UUID
    categories: List[str] = ["Останато"]
    is_remote: bool = False
    description: Optional[str] = None

    class Config:
        from_attributes = True


class SourceSchema(BaseModel):
    """Schema for a job source."""

    id: UUID
    name: str
    base_url: str
    active: bool
    trust_score: float = 0.70
    last_scraped: Optional[datetime] = None

    class Config:
        from_attributes = True


class ScraperStatusSchema(BaseModel):
    """Schema for scraper execution status."""

    source_name: str
    success: bool
    jobs_found: int
    jobs_inserted: int
    jobs_skipped: int
    errors: List[str] = []
    started_at: datetime
    completed_at: datetime
    duration_seconds: float


class HealthCheckSchema(BaseModel):
    """Schema for health check response."""

    status: str = "healthy"
    database: str = "connected"
    jobs_count: int
    sources_count: int
    last_scrape_time: Optional[datetime] = None
