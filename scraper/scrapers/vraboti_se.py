"""
Scraper for Vraboti.se - Swedish job portal with Macedonian listings.
"""

from typing import List
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper, ScrapedJob
from core.logger import get_logger

logger = get_logger(__name__)


class VrabotiSeScraper(BaseScraper):
    """Scraper for vraboti.se job listings."""

    def __init__(self):
        super().__init__(
            source_name="Vraboti.se",
            base_url="https://vraboti.se/"
        )

    def scrape(self) -> List[ScrapedJob]:
        """Scrape jobs from Vraboti.se."""
        self.base_url = "https://vraboti.se/announcements"
        logger.info("Starting scrape", source=self.source_name)
        jobs = []

        try:
            response = self._get(self.base_url)
            if not response:
                return jobs

            soup = BeautifulSoup(response.content, 'html.parser')
            job_elements = soup.select('.post-bx')

            logger.info(f"Found {len(job_elements)} job elements", source=self.source_name)

            for element in job_elements:
                try:
                    title_element = element.select_one('.job-title-vs a')
                    if not title_element:
                        continue

                    title_text = title_element.get_text(strip=True)
                    url = title_element.get('href', '')

                    if url and not url.startswith('http'):
                        url = "https://vraboti.se" + url

                    company_text = "Unknown Company"
                    location_text = "Unknown"
                    
                    # Extract location
                    location_icon = element.find('i', class_='fa-map-marker')
                    if location_icon and location_icon.parent:
                        location_text = location_icon.parent.get_text(strip=True)
                        
                    # They don't typically display company names in text on the list, mostly via logo
                    img_element = element.select_one('.job-post-company img')
                    company_logo_url = None
                    if img_element:
                        company_logo_url = img_element.get('src')
                        if company_logo_url and not company_logo_url.startswith('http'):
                            company_logo_url = "https://vraboti.se" + company_logo_url
                            
                    if title_text and url and '/announcements/view/' in url:
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
