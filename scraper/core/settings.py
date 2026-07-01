"""
Core configuration settings for the scraper.
Uses environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings."""

    # Supabase
    supabase_url: str
    supabase_key: str

    # Logging
    log_level: str = "INFO"
    log_file: Optional[str] = "logs/scraper.log"

    # Scheduling
    scrape_interval_minutes: int = 30
    enable_scheduler: bool = True

    # Scraping
    request_timeout: int = 30
    retry_attempts: int = 3
    retry_delay_seconds: int = 5
    concurrent_scrapers: int = 3

    # Playwright
    headless_browser: bool = True
    browser_timeout: int = 30000

    # Performance
    batch_insert_size: int = 100

    # Features
    enable_deduplication: bool = True
    enable_normalization: bool = True
    delete_expired_jobs: bool = True
    expired_job_days: int = 30

    # Monitoring
    health_check_port: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = False




# Global settings instance
settings = Settings()  # type: ignore
