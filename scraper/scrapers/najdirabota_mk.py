"""
Scraper for Najdirabota.com.mk - Macedonian job portal.
"""

from typing import List
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper, ScrapedJob
from core.logger import get_logger

logger = get_logger(__name__)


class NajdiraboataMkScraper(BaseScraper):
    """Scraper for najdirabota.com.mk job listings."""

    def __init__(self):
        super().__init__(
            source_name="Najdirabota.com.mk",
            base_url="https://www.najdirabota.com.mk/"
        )

    def scrape(self) -> List[ScrapedJob]:
        """Scrape jobs from Najdirabota.com.mk."""
        self.base_url = "https://www.najdirabota.com.mk/vacancy/search"
        logger.info("Starting scrape", source=self.source_name)
        jobs = []

        try:
            response = self._get(self.base_url)
            if not response:
                return jobs

            soup = BeautifulSoup(response.content, 'html.parser')
            job_elements = soup.select('.vacancy_box')

            logger.info(f"Found {len(job_elements)} job elements", source=self.source_name)

            for element in job_elements:
                try:
                    title_element = element.select_one('.vacancy-title')
                    if not title_element:
                        continue

                    title_text = title_element.get_text(strip=True)
                    
                    link_element = element.select_one('a')
                    url = link_element.get('href', '') if link_element else ''

                    if url and not url.startswith('http'):
                        url = "https://www.najdirabota.com.mk" + url

                    company_text = "Unknown Company"
                    location_text = "Unknown"
                    
                    paragraphs = element.select('.paragraph-info p')
                    for p in paragraphs:
                        text = p.get_text(strip=True)
                        if "Фирма:" in text:
                            span = p.select_one('span')
                            if span:
                                company_text = span.get_text(strip=True)
                        if "Регион:" in text:
                            span = p.select_one('span')
                            if span:
                                location_text = span.get_text(strip=True)
                    
                    if title_text and url and '/vacancy/view/' in url:
                        # Try to extract company logo
                        company_logo_url = None
                        logo_img = element.select_one('img')
                        if logo_img:
                            logo_src = logo_img.get('src', '')
                            if logo_src:
                                if not logo_src.startswith('http'):
                                    logo_src = "https://www.najdirabota.com.mk" + logo_src
                                if '/images/companies/logos/' in logo_src:
                                    company_logo_url = logo_src

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
