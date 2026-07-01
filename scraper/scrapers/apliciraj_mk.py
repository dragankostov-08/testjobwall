"""
Scraper for Apliciraj.mk - Macedonian job portal.
"""

from typing import List
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper, ScrapedJob
from core.logger import get_logger

logger = get_logger(__name__)


class AplicirajMkScraper(BaseScraper):
    """Scraper for apliciraj.mk job listings."""

    def __init__(self):
        super().__init__(
            source_name="Apliciraj.mk",
            base_url="https://apliciraj.mk/"
        )

    def scrape(self) -> List[ScrapedJob]:
        """Scrape jobs from Apliciraj.mk."""
        self.base_url = "https://apliciraj.mk/oglasi/"
        logger.info("Starting scrape", source=self.source_name)
        jobs = []

        try:
            response = self._get(self.base_url)
            if not response:
                return jobs

            soup = BeautifulSoup(response.content, 'html.parser')
            job_elements = soup.select('.news-archive-row')

            logger.info(f"Found {len(job_elements)} job elements", source=self.source_name)

            for element in job_elements:
                try:
                    title_element = element.select_one('.news-title')
                    if not title_element:
                        continue

                    title_text = title_element.get_text(strip=True)
                    
                    link_element = element.select_one('a')
                    url = link_element.get('href', '') if link_element else ''

                    if not url.startswith('http'):
                        url = "https://apliciraj.mk" + url

                    # Logo extraction
                    img_element = element.select_one('img')
                    company_logo_url = None
                    if img_element:
                        company_logo_url = img_element.get('data-src') or img_element.get('src')
                        
                    # Extract company from URL path: /oglas/company-name/job-title/
                    company_text = "Unknown Company"
                    if '/oglas/' in url:
                        try:
                            company_slug = url.split('/oglas/')[1].split('/')[0]
                            company_text = company_slug.replace('-', ' ').title()
                        except:
                            pass
                    
                    # Fetch location from the job detail page
                    location_text = "Unknown"
                    if url:
                        try:
                            job_resp = self._get(url)
                            if job_resp:
                                job_soup = BeautifulSoup(job_resp.content, 'html.parser')
                                location_links = job_soup.select('a[href*="/lokacija/"]')
                                locations = [loc.get_text(strip=True) for loc in location_links if loc.get_text(strip=True)]
                                if locations:
                                    location_text = ", ".join(locations)
                        except Exception as e:
                            logger.debug(f"Could not extract location from {url}: {e}", source=self.source_name)

                    if title_text and url:
                        jobs.append(ScrapedJob(
                            title=title_text,
                            company=company_text,
                            location=location_text,
                            url=url,
                            company_logo_url=company_logo_url,
                            is_remote="remote" in title_text.lower() or "далечински" in location_text.lower()
                        ))
                except Exception as e:
                    logger.warning(f"Failed to parse job element: {str(e)}", source=self.source_name)
                    continue

        except Exception as e:
            logger.error(f"Scraping failed: {str(e)}", source=self.source_name)

        logger.info(f"Scraped {len(jobs)} jobs", source=self.source_name)
        return jobs
