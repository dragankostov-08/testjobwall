"""
Main entry point for the JobWall scraper system.
Includes FastAPI server for health checks and manual scraping triggers.
"""

import sys
import os
from datetime import datetime
from contextlib import asynccontextmanager
from typing import List

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import setup_logging, get_logger, settings, HealthCheckSchema, SourceSchema
from core.database import get_supabase
from scheduler import scheduler
from services import JobProcessorService

# Setup logging
setup_logging()
logger = get_logger(__name__)

# Try to import FastAPI for health check server
try:
    from fastapi import FastAPI, HTTPException, Query
    from fastapi.responses import JSONResponse
    import uvicorn

    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    logger.warning("FastAPI not available - health check server disabled")


def run_scraper_once() -> None:
    """Run a single complete scraping cycle."""
    logger.info("Starting one-time scrape cycle")
    try:
        scheduler.scrape_all()
        logger.info("Scrape cycle completed successfully")
    except Exception as e:
        logger.error(f"Scrape cycle failed: {str(e)}")
        raise


def run_scheduler() -> None:
    """Run the scraper with automated scheduling."""
    logger.info("Starting scraper with scheduler")
    try:
        # Start scheduler
        scheduler.start()

        # Run initial scrape
        logger.info("Running initial scrape cycle")
        scheduler.scrape_all()

        # Keep scheduler running
        import time

        logger.info("Scheduler running - press Ctrl+C to exit")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Shutting down...")
            scheduler.stop()

    except Exception as e:
        logger.error(f"Scheduler failed: {str(e)}")
        raise


if FASTAPI_AVAILABLE:

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        """FastAPI lifespan context manager."""
        # Startup
        logger.info("Starting FastAPI server with scheduler")
        scheduler.start()
        scheduler.scrape_all()  # Run initial scrape
        yield
        # Shutdown
        logger.info("Shutting down FastAPI server")
        scheduler.stop()

    app = FastAPI(
        title="JobWall Scraper API",
        description="Scraper management and health check endpoints",
        version="1.0.0",
        lifespan=lifespan,
    )

    @app.get("/health", response_model=HealthCheckSchema)
    async def health_check() -> HealthCheckSchema:
        """Health check endpoint."""
        try:
            client = get_supabase()
            jobs_count = JobProcessorService.get_job_count(client)

            # Get sources count and last_scraped
            sources_response = client.table("sources").select("id", count="exact").execute()
            sources_count = sources_response.count or 0
            
            last_scraped_response = client.table("sources").select("last_scraped").order("last_scraped", desc=True).limit(1).execute()
            last_scraped = None
            if last_scraped_response.data and last_scraped_response.data[0].get("last_scraped"):
                last_scraped = datetime.fromisoformat(last_scraped_response.data[0]["last_scraped"].replace('Z', '+00:00'))

            return HealthCheckSchema(
                status="healthy",
                database="connected",
                jobs_count=jobs_count,
                sources_count=sources_count,
                last_scrape_time=last_scraped,
            )
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            raise HTTPException(status_code=500, detail="Database connection failed")

    @app.post("/scrape")
    async def trigger_scrape(sources: List[str] = Query(None)) -> dict:
        """Trigger scraping of specific sources or all if not specified."""
        if not sources:
            # Scrape all
            logger.info("Manual trigger: scraping all sources")
            scheduler.scrape_all()
            return {"message": "Full scrape triggered"}

        # Scrape specific sources
        try:
            client = get_supabase()

            for source_name in sources:
                response = client.table("sources").select("*").eq("name", source_name).limit(1).execute()
                if not response.data:
                    logger.warning(f"Source not found: {source_name}")
                    continue

                source_data = response.data[0]
                logger.info(f"Manual trigger: scraping {source_name}")
                scheduler.scrape_source(str(source_data["id"]), source_name, client)

            return {"message": f"Scrape triggered for {len(sources)} sources"}
        except Exception as e:
            logger.error(f"Manual scrape trigger failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/scheduler/status")
    async def scheduler_status() -> dict:
        """Get scheduler status."""
        return scheduler.get_status()

    @app.get("/sources", response_model=List[SourceSchema])
    async def list_sources() -> List[SourceSchema]:
        """List all job sources."""
        try:
            client = get_supabase()
            response = client.table("sources").select("*").execute()
            return [SourceSchema(**s) for s in response.data]
        except Exception as e:
            logger.error(f"Failed to list sources: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/fetch-news")
    async def trigger_fetch_news() -> dict:
        """Trigger news fetching from all active news sources."""
        logger.info("Manual trigger: fetching news")
        try:
            scheduler.fetch_news()
            return {"message": "News fetch triggered"}
        except Exception as e:
            logger.error(f"Manual news fetch failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))


def main():
    """Main entry point."""
    mode = os.getenv("SCRAPER_MODE", "scheduler").lower()

    if mode == "once":
        # Run single scrape cycle
        run_scraper_once()
    elif mode == "server":
        # Run FastAPI server with scheduler
        if not FASTAPI_AVAILABLE:
            logger.error("FastAPI required for server mode")
            sys.exit(1)

        port = settings.health_check_port
        logger.info(f"Starting API server on http://0.0.0.0:{port}")
        uvicorn.run(app, host="0.0.0.0", port=port)
    else:
        # Default: run scheduler
        run_scheduler()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        sys.exit(1)
