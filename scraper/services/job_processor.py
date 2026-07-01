"""
Job processing and database insertion service using Supabase REST API.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from supabase import Client
from core.schemas import JobSchema, ScraperStatusSchema, SourceSchema
from core.logger import get_logger
from services.deduplication import DeduplicationService
from core.settings import settings

logger = get_logger(__name__)


class JobProcessorService:
    """Handles job processing, deduplication, and database insertion."""

    @staticmethod
    def process_and_insert_jobs(
        client: Client,
        normalized_jobs: List[JobSchema],
        source: SourceSchema,
        started_at: datetime,
    ) -> ScraperStatusSchema:
        """Process normalized jobs and insert into database.

        Args:
            client: Supabase client
            normalized_jobs: List of normalized job schemas
            source: Source schema
            started_at: When scraping started

        Returns:
            ScraperStatusSchema with processing results
        """
        jobs_found = len(normalized_jobs)
        jobs_inserted = 0
        jobs_skipped = 0
        errors = []
        jobs_to_insert = []

        logger.info(f"Processing {jobs_found} jobs", source=source.name)

        for job_schema in normalized_jobs:
            try:
                # Check for duplicates if enabled
                if settings.enable_deduplication:
                    duplicate_id = DeduplicationService.is_duplicate(
                        client,
                        job_schema.company,
                        job_schema.title,
                        job_schema.location,
                        job_schema.url,
                    )
                    if duplicate_id:
                        # Append the new source to the duplicate job's metadata
                        try:
                            res = client.table("jobs").select("metadata").eq("id", duplicate_id).single().execute()
                            if res.data:
                                metadata = res.data.get("metadata") or {}
                                alternate_sources = metadata.get("alternate_sources", [])
                                
                                new_source = {"name": source.name, "url": job_schema.url}
                                # Avoid duplicating the exact same source
                                if not any(s.get("name") == source.name for s in alternate_sources):
                                    # Also ensure we aren't adding the primary source itself
                                    primary_source = client.table("jobs").select("source_name").eq("id", duplicate_id).single().execute()
                                    if primary_source.data and primary_source.data.get("source_name") != source.name:
                                        alternate_sources.append(new_source)
                                        metadata["alternate_sources"] = alternate_sources
                                        client.table("jobs").update({"metadata": metadata}).eq("id", duplicate_id).execute()
                                        logger.debug(f"Added alternate source {source.name} to job {duplicate_id}")
                        except Exception as e:
                            logger.error(f"Failed to update alternate sources for job {duplicate_id}: {e}")
                            
                        jobs_skipped += 1
                        continue

                # Generate hash key
                hash_key = DeduplicationService.generate_hash_key(
                    job_schema.company,
                    job_schema.title,
                    job_schema.location,
                )

                from services.scoring import compute_job_score
                from services.trend_analysis import TrendAnalyzer
                import json
                
                # Fetch trending keywords
                trending_keywords = TrendAnalyzer.get_trending_keywords(client)
                
                # Prepare job dictionary for Supabase insert
                expires = job_schema.expires_at or (datetime.utcnow() + timedelta(days=settings.expired_job_days))
                
                # Compute ranking score
                score, score_breakdown, ml_model_version = compute_job_score(job_schema, source, trending_keywords, client)
                
                # We do NOT skip insert if score < 0 anymore, we just store it with score = -1
                if score < 0:
                    logger.warning(f"Job marked as spam (score=-1): {job_schema.title}", source=source.name)
                
                db_job = {
                    "source_id": str(source.id),
                    "title": job_schema.title,
                    "company": job_schema.company,
                    "location": job_schema.location,
                    "url": job_schema.url,
                    "categories": job_schema.categories,
                    "is_remote": job_schema.is_remote,
                    "hash_key": hash_key,
                    "expires_at": expires.isoformat(),
                    "company_logo_url": job_schema.company_logo_url,
                    "metadata": job_schema.metadata,
                    "score": score,
                    "score_breakdown": score_breakdown,
                    "ml_model_version": ml_model_version
                }
                
                jobs_to_insert.append(db_job)

            except Exception as e:
                error_msg = f"Failed to process job '{job_schema.title}': {str(e)}"
                logger.error(error_msg, source=source.name)
                errors.append(error_msg)
                continue

        # Batch insert into Supabase
        if jobs_to_insert:
            try:
                # Supabase upsert automatically handles conflicts if we specify the unique columns or if primary key conflicts
                # Since URL is unique, we could rely on that, but we just use insert here since we deduplicated manually
                response = client.table("jobs").upsert(jobs_to_insert, on_conflict="url").execute()
                jobs_inserted = len(response.data)
                logger.info(
                    f"Inserted {jobs_inserted} jobs",
                    source=source.name,
                    skipped=jobs_skipped,
                )
            except Exception as e:
                error_msg = f"Database insert failed: {str(e)}"
                logger.error(error_msg, source=source.name)
                errors.append(error_msg)

        # Update source last_scraped
        try:
            client.table("sources").update({"last_scraped": datetime.utcnow().isoformat()}).eq("id", str(source.id)).execute()
        except Exception as e:
            logger.error(f"Failed to update source: {str(e)}", source=source.name)

        # Build status response
        completed_at = datetime.utcnow()
        duration = (completed_at - started_at).total_seconds()

        return ScraperStatusSchema(
            source_name=source.name,
            success=len(errors) == 0,
            jobs_found=jobs_found,
            jobs_inserted=jobs_inserted,
            jobs_skipped=jobs_skipped,
            errors=errors,
            started_at=started_at,
            completed_at=completed_at,
            duration_seconds=duration,
        )

    @staticmethod
    def delete_expired_jobs(client: Client) -> int:
        """Delete expired job listings.

        Args:
            client: Supabase client

        Returns:
            Number of jobs deleted
        """
        if not settings.delete_expired_jobs:
            return 0

        try:
            response = client.table("jobs").delete().lte("expires_at", datetime.utcnow().isoformat()).execute()
            deleted = len(response.data)
            logger.info(f"Deleted {deleted} expired jobs")
            return deleted
        except Exception as e:
            logger.error(f"Failed to delete expired jobs: {str(e)}")
            return 0

    @staticmethod
    def get_job_count(client: Client) -> int:
        """Get total count of non-expired jobs.

        Args:
            client: Supabase client

        Returns:
            Count of jobs
        """
        try:
            response = client.table("jobs").select("id", count="exact").gt("expires_at", datetime.utcnow().isoformat()).execute()
            return response.count or 0
        except Exception as e:
            logger.error(f"Failed to get job count: {str(e)}")
            return 0
