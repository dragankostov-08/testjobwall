"""
Scraper for Honorarec.mk - Macedonian freelance/job portal.
"""

from typing import List
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper, ScrapedJob
from core.logger import get_logger

logger = get_logger(__name__)


class HonorarecMkScraper(BaseScraper):
    """Scraper for honorarec.mk job listings."""

    def __init__(self):
        super().__init__(
            source_name="Honorarec.mk",
            base_url="https://honorarec.mk/"
        )

    def scrape(self) -> List[ScrapedJob]:
        """Scrape jobs from Honorarec.mk."""
        self.base_url = "https://honorarec.mk/oglasi"
        logger.info("Starting scrape", source=self.source_name)
        jobs = []

        try:
            response = self._get(self.base_url)
            if not response:
                return jobs

            soup = BeautifulSoup(response.content, 'html.parser')
            job_elements = soup.select('article')

            logger.info(f"Found {len(job_elements)} job elements", source=self.source_name)

            for element in job_elements:
                try:
                    title_element = element.select_one('h3 a')
                    if not title_element:
                        continue

                    title_text = title_element.get_text(strip=True)
                    url = title_element.get('href', '')

                    if url and not url.startswith('http'):
                        url = "https://honorarec.mk" + url

                    company_text = "Unknown Company"
                    location_text = "Unknown"
                    company_logo_url = None
                    
                    img_element = element.select_one('img')
                    if img_element:
                        company_logo_url = img_element.get('src')
                        company_text = img_element.get('alt', 'Unknown Company')
                        
                    # Usually the texts are listed after the title, but wait, company is in alt text
                    # We can get text from the whole article
                    all_text = element.get_text(separator='|', strip=True)
                    parts = [p.strip() for p in all_text.split('|') if p.strip()]
                    # Usually: [0] = Status, [1] = Title, [2] = Company/Category, [3] = Category, [4] = Location
                    if len(parts) > 4:
                        # Assuming location is often the 5th item if company is also repeated
                        # We'll just check if any common location strings exist or use the alt text for company
                        pass # Kept simple for now

                    if title_text and url and '/oglasi/' in url:
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
