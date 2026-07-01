"""
Scheduler for automated job scraping.
Uses APScheduler for robust scheduling.
"""

from datetime import datetime
from typing import Optional, List
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from core.logger import get_logger
from core.settings import settings
from core.database import get_supabase
from core.schemas import SourceSchema
from scrapers import SCRAPER_CLASSES
from services import NormalizationService, JobProcessorService, NewsFetcherService

logger = get_logger(__name__)


class ScraperScheduler:
    """Manages scheduled scraping tasks."""

    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.is_running = False

    def start(self) -> None:
        """Start the scheduler."""
        if not settings.enable_scheduler:
            logger.info("Scheduler is disabled in settings")
            return

        logger.info("Starting scheduler")

        # Schedule full scrape
        self.scheduler.add_job(
            self.scrape_all,
            IntervalTrigger(minutes=settings.scrape_interval_minutes),
            id="scrape_all",
            name="Scrape all sources",
            replace_existing=True,
        )

        # Schedule news fetching (every 60 minutes)
        self.scheduler.add_job(
            self.fetch_news,
            IntervalTrigger(minutes=60),
            id="fetch_news",
            name="Fetch news from all sources",
            replace_existing=True,
        )

        # Schedule expired job cleanup
        self.scheduler.add_job(
            self.cleanup_expired_jobs,
            CronTrigger(hour=2, minute=0),  # 2 AM daily
            id="cleanup_expired",
            name="Cleanup expired jobs",
            replace_existing=True,
        )

        self.scheduler.start()
        self.is_running = True
        logger.info("Scheduler started successfully")

    def stop(self) -> None:
        """Stop the scheduler."""
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            logger.info("Scheduler stopped")

    def scrape_all(self) -> None:
        """Scrape all enabled sources."""
        logger.info("Starting full scrape cycle")
        client = get_supabase()

        try:
            # Get all active sources
            response = client.table("sources").select("*").eq("active", True).execute()
            sources = [SourceSchema(**s) for s in response.data]
            
            logger.info(f"Found {len(sources)} active sources")

            # Run each scraper
            for source in sources:
                self.scrape_source(str(source.id), source.name, client)

        except Exception as e:
            logger.error(f"Scrape cycle failed: {str(e)}")

        # Also fetch news
        self.fetch_news()

    def fetch_news(self) -> None:
        """Fetch news from all active news sources (RSS + scrapers)."""
        logger.info("Starting news fetch cycle")
        try:
            fetcher = NewsFetcherService()
            total = fetcher.fetch_all_sources()
            fetcher.close()
            logger.info(f"News fetch completed: {total} articles inserted")
        except Exception as e:
            logger.error(f"News fetch failed: {str(e)}")

    def scrape_source(
        self,
        source_id: str,
        source_name: str,
        client=None,
    ) -> None:
        """Scrape a specific source.

        Args:
            source_id: UUID of the source
            source_name: Name of the source
            client: Supabase client
        """
        if client is None:
            client = get_supabase()

        started_at = datetime.utcnow()
        logger.info(f"Scraping {source_name}")

        try:
            # Get source from database
            response = client.table("sources").select("*").eq("id", source_id).limit(1).execute()
            if not response.data:
                logger.warning(f"Source not found: {source_name}")
                return
            
            source = SourceSchema(**response.data[0])

            # Find matching scraper
            scraper_class = None
            for cls in SCRAPER_CLASSES:
                instance = cls()
                if instance.source_name == source_name:
                    scraper_class = cls
                    break

            if not scraper_class:
                logger.warning(f"No scraper found for {source_name}")
                return

            # Execute scraper
            scraper = scraper_class()
            scraped_jobs = scraper.scrape()
            scraper.close()

            if not scraped_jobs:
                logger.info(f"No jobs found from {source_name}")
                return

            # Normalize jobs
            normalized_jobs = NormalizationService.normalize_batch(
                scraped_jobs,
                source_name,
                str(source.id),
            )

            # Process and insert
            status = JobProcessorService.process_and_insert_jobs(
                client,
                normalized_jobs,
                source,
                started_at,
            )

            logger.info(
                f"Scrape completed",
                source=source_name,
                found=status.jobs_found,
                inserted=status.jobs_inserted,
                skipped=status.jobs_skipped,
                duration=status.duration_seconds,
            )

        except Exception as e:
            logger.error(f"Failed to scrape {source_name}: {str(e)}")

    def cleanup_expired_jobs(self) -> None:
        """Clean up expired job listings."""
        logger.info("Starting expired job cleanup")
        client = get_supabase()

        try:
            deleted = JobProcessorService.delete_expired_jobs(client)
            logger.info(f"Cleanup completed: deleted {deleted} expired jobs")
        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")

    def get_status(self) -> dict:
        """Get scheduler status."""
        return {
            "is_running": self.is_running,
            "jobs": [
                {
                    "id": job.id,
                    "name": job.name,
                    "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
                }
                for job in self.scheduler.get_jobs()
            ],
        }


# Global scheduler instance
scheduler = ScraperScheduler()
