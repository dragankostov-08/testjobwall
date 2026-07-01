"""
Scraper for Oglasizarabota.mk - Macedonian job portal.
"""

from typing import List
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper, ScrapedJob
from core.logger import get_logger

logger = get_logger(__name__)


class OglasizarabotaMkScraper(BaseScraper):
    """Scraper for oglasizarabota.mk job listings."""

    def __init__(self):
        super().__init__(
            source_name="Oglasizarabota.mk",
            base_url="https://www.oglasizarabota.mk/"
        )

    def scrape(self) -> List[ScrapedJob]:
        """Scrape jobs from Oglasizarabota.mk."""
        logger.info("Starting scrape", source=self.source_name)
        jobs = []

        try:
            response = self._get(self.base_url)
            if not response:
                return jobs

            soup = BeautifulSoup(response.content, 'html.parser')
            job_elements = soup.select('.oglas-item, .job')

            logger.info(f"Found {len(job_elements)} job elements", source=self.source_name)

            for element in job_elements:
                try:
                    title = element.select_one('h3, .title')
                    company = element.select_one('.company-title')
                    location = element.select_one('.location-title')
                    link = element.select_one('a')

                    if not all([title, link]):
                        continue

                    title_text = title.get_text(strip=True)
                    company_text = company.get_text(strip=True) if company else "Unknown"
                    location_text = location.get_text(strip=True) if location else "Unknown"
                    url = link.get('href', '')

                    if not url.startswith('http'):
                        url = self.base_url.rstrip('/') + url

                    if title_text and url:
                        jobs.append(ScrapedJob(
                            title=title_text,
                            company=company_text,
                            location=location_text,
                            url=url,
                            is_remote="remote" in title_text.lower() or "remote" in location_text.lower()
                        ))
                except Exception as e:
                    logger.warning(f"Failed to parse job element: {str(e)}", source=self.source_name)
                    continue

        except Exception as e:
            logger.error(f"Scraping failed: {str(e)}", source=self.source_name)

        logger.info(f"Scraped {len(jobs)} jobs", source=self.source_name)
        return jobs
