"""
Base scraper class for all job source scrapers.
Provides common functionality: HTTP requests, error handling, validation.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from dataclasses import dataclass
from datetime import datetime
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from core.logger import get_logger
from core.settings import settings

logger = get_logger(__name__)


@dataclass
class ScrapedJob:
    """Raw scraped job data."""

    title: str
    company: str
    location: str
    url: str
    is_remote: bool = False
    description: Optional[str] = None
    employment_type: Optional[str] = None
    salary: Optional[str] = None
    posted_date: Optional[datetime] = None
    company_logo_url: Optional[str] = None


class BaseScraper(ABC):
    """Base class for all job scrapers."""

    def __init__(self, source_name: str, base_url: str):
        """Initialize the scraper.

        Args:
            source_name: Name of the job source
            base_url: Base URL of the source
        """
        self.source_name = source_name
        self.base_url = base_url
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """Create a requests session with retry logic."""
        session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=settings.retry_attempts,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS"],
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Set user agent
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        
        return session

    def _get(self, url: str, **kwargs) -> Optional[requests.Response]:
        """Make a GET request with error handling.

        Args:
            url: URL to request
            **kwargs: Additional arguments to pass to requests.get

        Returns:
            Response object or None if error
        """
        try:
            timeout = kwargs.pop("timeout", settings.request_timeout)
            response = self.session.get(url, timeout=timeout, **kwargs)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            logger.error(
                f"Failed to fetch {url}",
                error=str(e),
                source=self.source_name,
            )
            return None

    @abstractmethod
    def scrape(self) -> List[ScrapedJob]:
        """Scrape jobs from the source.

        Must be implemented by subclasses.

        Returns:
            List of ScrapedJob objects
        """
        pass

    def close(self) -> None:
        """Close the session."""
        self.session.close()
