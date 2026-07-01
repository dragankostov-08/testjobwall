"""
Core module - database, logging, configuration, and models.
"""

from core.settings import settings
from core.logger import setup_logging, get_logger
from core.database import db_manager, get_supabase

from core.schemas import JobSchema, ScrapedJobSchema, SourceSchema, ScraperStatusSchema, HealthCheckSchema

__all__ = [
    "settings",
    "setup_logging",
    "get_logger",
    "db_manager",
    "get_supabase",
    "JobSchema",
    "ScrapedJobSchema",
    "SourceSchema",
    "ScraperStatusSchema",
    "HealthCheckSchema",
]
