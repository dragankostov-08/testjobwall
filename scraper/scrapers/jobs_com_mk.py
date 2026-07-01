"""
Scraper for Jobs.com.mk - Macedonian job portal.
"""

from typing import List
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper, ScrapedJob
from core.logger import get_logger

logger = get_logger(__name__)


class JobsComMkScraper(BaseScraper):
    """Scraper for jobs.com.mk job listings."""

    def __init__(self):
        super().__init__(
            source_name="Jobs.com.mk",
            base_url="https://jobs.com.mk/"
        )

    def scrape(self) -> List[ScrapedJob]:
        """Scrape jobs from Jobs.com.mk."""
        logger.info("Starting scrape", source=self.source_name)
        jobs = []

        try:
            response = self._get(self.base_url)
            if not response:
                return jobs

            soup = BeautifulSoup(response.content, 'html.parser')
            job_elements = soup.select('.job')

            logger.info(f"Found {len(job_elements)} job elements", source=self.source_name)

            for element in job_elements:
                try:
                    title_element = element.select_one('h3 a')
                    if not title_element:
                        continue

                    title_text = title_element.get_text(strip=True)
                    url = title_element.get('href', '')
                    
                    if not url.startswith('http'):
                        url = self.base_url.rstrip('/') + url

                    img_element = element.select_one('img')
                    company_logo_url = img_element.get('src') if img_element else None
                    
                    # We can try to extract company name from the logo alt text, or fallback to "Unknown" 
                    # since jobs.com.mk heavily relies on logos.
                    company_text = img_element.get('alt', '').strip() if img_element else ""
                    if not company_text:
                        company_text = "Unknown Company"

                    location_element = element.select_one('.fi-rs-marker')
                    location_text = "Unknown"
                    if location_element and location_element.parent:
                        location_text = location_element.parent.get_text(strip=True)

                    if title_text and url:
                        jobs.append(ScrapedJob(
                            title=title_text,
                            company=company_text,
                            location=location_text,
                            url=url,
                            company_logo_url=company_logo_url,
                            is_remote="remote" in title_text.lower() or "remote" in location_text.lower()
                        ))
                except Exception as e:
                    logger.warning(f"Failed to parse job element: {str(e)}", source=self.source_name)
                    continue

        except Exception as e:
            logger.error(f"Scraping failed: {str(e)}", source=self.source_name)

        logger.info(f"Scraped {len(jobs)} jobs", source=self.source_name)
        return jobs
