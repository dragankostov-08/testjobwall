"""
Scraper for Manpower.mk - Macedonian staffing/recruitment agency.
"""

from typing import List
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper, ScrapedJob
from core.logger import get_logger

logger = get_logger(__name__)


class ManpowerMkScraper(BaseScraper):
    """Scraper for manpower.mk job listings."""

    def __init__(self):
        super().__init__(
            source_name="Manpower.mk",
            base_url="https://manpower.mk/mk/mozhnosti-za-rabota"
        )

    def scrape(self) -> List[ScrapedJob]:
        """Scrape jobs from Manpower.mk."""
        logger.info("Starting scrape", source=self.source_name)
        jobs = []

        try:
            response = self._get(self.base_url)
            if not response:
                return jobs

            soup = BeautifulSoup(response.content, 'html.parser')
            job_elements = soup.select('.card.p-lg-8')

            logger.info(f"Found {len(job_elements)} job elements", source=self.source_name)

            for element in job_elements:
                try:
                    title = element.select_one('.card-top h3')
                    location = element.select_one('.job-city')
                    link = element.select_one('.card-top a')

                    if not all([title, link]):
                        continue

                    title_text = title.get_text(strip=True)
                    
                    # They don't have explicit company name on the card, we'll try to extract if it says "Во име на нашиот клиент..." or default to Manpower
                    company_text = "Manpower"
                    desc_el = element.select_one('.job-description')
                    if desc_el:
                        desc_text = desc_el.get_text(strip=True)
                        if "клиент, " in desc_text:
                            possible_company = desc_text.split("клиент, ")[1].split(",")[0].split("бараме")[0].strip()
                            if possible_company:
                                company_text = possible_company
                                
                    location_text = location.get_text(strip=True) if location else "Unknown"
                    url = link.get('href', '')

                    if not url.startswith('http'):
                        from urllib.parse import urljoin
                        url = urljoin("https://manpower.mk", url)

                    # Determine remote/hybrid status
                    is_remote = "remote" in title_text.lower() or "remote" in location_text.lower()
                    job_type_el = element.select_one('.job-type')
                    if job_type_el:
                        job_type_text = job_type_el.get_text(strip=True).lower()
                        if "хибрид" in job_type_text or "remote" in job_type_text or "дома" in job_type_text:
                            is_remote = True

                    if title_text and url:
                        jobs.append(ScrapedJob(
                            title=title_text,
                            company=company_text,
                            location=location_text,
                            url=url,
                            is_remote=is_remote
                        ))
                except Exception as e:
                    logger.warning(f"Failed to parse job element: {str(e)}", source=self.source_name)
                    continue

        except Exception as e:
            logger.error(f"Scraping failed: {str(e)}", source=self.source_name)

        logger.info(f"Scraped {len(jobs)} jobs", source=self.source_name)
        return jobs
