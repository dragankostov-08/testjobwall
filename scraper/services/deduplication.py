"""
Deduplication service for preventing duplicate job listings using Supabase.
"""

import hashlib
from supabase import Client
from core.logger import get_logger

logger = get_logger(__name__)


from typing import Optional

class DeduplicationService:
    """Handles job deduplication using multiple strategies."""

    @staticmethod
    def generate_hash_key(company: str, title: str, location: str) -> str:
        """Generate a SHA256 hash key for deduplication.

        Args:
            company: Company name
            title: Job title
            location: Job location

        Returns:
            Hex hash string
        """
        key_string = f"{company.lower().strip()}{title.lower().strip()}{location.lower().strip()}"
        return hashlib.sha256(key_string.encode()).hexdigest()

    @staticmethod
    def check_hash_exists(client: Client, hash_key: str) -> Optional[str]:
        """Check if a hash key already exists in the database.

        Args:
            client: Supabase client
            hash_key: Hash key to check

        Returns:
            Job ID if exists, None otherwise
        """
        try:
            response = client.table("jobs").select("id").eq("hash_key", hash_key).limit(1).execute()
            if len(response.data) > 0:
                return response.data[0]["id"]
            return None
        except Exception as e:
            logger.error(f"Error checking hash existence: {str(e)}")
            return None

    @staticmethod
    def check_url_exists(client: Client, url: str) -> Optional[str]:
        """Check if a URL already exists in the database.

        Args:
            client: Supabase client
            url: Job URL

        Returns:
            Job ID if exists, None otherwise
        """
        try:
            response = client.table("jobs").select("id").eq("url", url).limit(1).execute()
            if len(response.data) > 0:
                return response.data[0]["id"]
            return None
        except Exception as e:
            logger.error(f"Error checking url existence: {str(e)}")
            return None

    @staticmethod
    def is_duplicate(client: Client, company: str, title: str, location: str, url: str) -> Optional[str]:
        """Check if a job is a duplicate using multiple strategies.

        Args:
            client: Supabase client
            company: Company name
            title: Job title
            location: Job location
            url: Job URL

        Returns:
            Job ID if duplicate, None otherwise
        """
        # Strategy 1: Check URL (most reliable)
        duplicate_id = DeduplicationService.check_url_exists(client, url)
        if duplicate_id:
            logger.debug(f"Duplicate found by URL: {url}")
            return duplicate_id

        # Strategy 2: Check hash (company + title + location)
        hash_key = DeduplicationService.generate_hash_key(company, title, location)
        duplicate_id = DeduplicationService.check_hash_exists(client, hash_key)
        if duplicate_id:
            logger.debug(f"Duplicate found by hash: {hash_key}")
            return duplicate_id

        # Strategy 3: Fuzzy match title within same company (Last 14 days)
        try:
            from datetime import datetime, timedelta
            from rapidfuzz import fuzz  # type: ignore
            
            fourteen_days_ago = (datetime.utcnow() - timedelta(days=14)).isoformat()
            
            # Get recent jobs for the same company
            response = client.table("jobs").select("id, title").eq("company", company).gte("created_at", fourteen_days_ago).execute()
            
            for job in response.data:
                existing_title = job.get("title") or ""
                if fuzz.token_sort_ratio((title or "").lower(), existing_title.lower()) > 75:
                    logger.debug(f"Duplicate found by fuzzy match: '{title}' matches '{existing_title}'")
                    return job["id"]
        except Exception as e:
            logger.error(f"Error checking fuzzy duplicate: {str(e)}")

        return None
