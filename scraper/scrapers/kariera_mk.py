"""
Scraper for Kariera.mk - Macedonian job portal.
"""

from typing import List
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper, ScrapedJob
from core.logger import get_logger

logger = get_logger(__name__)


class KarieraMkScraper(BaseScraper):
    """Scraper for kariera.mk job listings."""

    def __init__(self):
        super().__init__(
            source_name="Kariera.mk",
            base_url="https://kariera.mk/"
        )

    def scrape(self) -> List[ScrapedJob]:
        """Scrape jobs from Kariera.mk."""
        logger.info("Starting scrape", source=self.source_name)
        jobs = []

        urls_to_scrape = [
            self.base_url,
            "https://kariera.mk/administracija"
        ]

        try:
            for scrape_url in urls_to_scrape:
                response = self._get(scrape_url)
                if not response:
                    continue

                soup = BeautifulSoup(response.content, 'html.parser')
            job_elements = soup.select('.thumbgalleries li')

            logger.info(f"Found {len(job_elements)} job elements", source=self.source_name)

            for element in job_elements:
                try:
                    title = element.select_one('.job-title h3')
                    company = element.select_one('.job-title .company')
                    location = element.select_one('.job-info')
                    link = element.select_one('a')

                    if not all([title, company, location, link]):
                        continue

                    title_text = title.get_text(strip=True)
                    company_text = company.get_text(strip=True)
                    location_text = location.get_text(strip=True) or "Скопје"
                    url = link.get('href', '')

                    if not url.startswith('http'):
                        url = self.base_url.rstrip('/') + url

                    # Extract company logo
                    logo_url = None
                    img_elem = element.select_one('img')
                    if img_elem and img_elem.has_attr('src'):
                        logo_src = img_elem['src']
                        if logo_src and not logo_src.startswith('http'):
                            logo_url = self.base_url.rstrip('/') + logo_src
                        elif logo_src:
                            logo_url = logo_src

                    if title_text and company_text and url:
                        jobs.append(ScrapedJob(
                            title=title_text,
                            company=company_text,
                            location=location_text,
                            url=url,
                            company_logo_url=logo_url,
                            is_remote="remote" in title_text.lower() or "remote" in location_text.lower()
                        ))
                except Exception as e:
                    logger.warning(f"Failed to parse job element: {str(e)}", source=self.source_name)
                    continue

        except Exception as e:
            logger.error(f"Scraping failed: {str(e)}", source=self.source_name)

        logger.info(f"Scraped {len(jobs)} jobs", source=self.source_name)
        return jobs
