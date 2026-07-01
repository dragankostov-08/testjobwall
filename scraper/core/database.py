"""
Database configuration and connection management using Supabase REST API.
"""

from supabase import create_client, Client
from core.settings import settings
from core.logger import get_logger

logger = get_logger(__name__)


class SupabaseManager:
    """Manages Supabase client connection."""

    def __init__(self):
        try:
            self.client: Client = create_client(
                settings.supabase_url, settings.supabase_key
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise

    def get_client(self) -> Client:
        """Get the Supabase client."""
        return self.client


# Global database manager instance
db_manager = SupabaseManager()

def get_supabase() -> Client:
    """Helper to get the global Supabase client."""
    return db_manager.get_client()
