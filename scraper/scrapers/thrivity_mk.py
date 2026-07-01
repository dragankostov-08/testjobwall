"""
Scraper for App.thrivity.mk - Macedonian job portal.
"""

from typing import List
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper, ScrapedJob
from core.logger import get_logger

logger = get_logger(__name__)


class ThrivityMkScraper(BaseScraper):
    """Scraper for app.thrivity.mk job listings."""

    def __init__(self):
        super().__init__(
            source_name="App.thrivity.mk",
            base_url="https://app.thrivity.mk/job-posts"
        )

    def scrape(self) -> List[ScrapedJob]:
        """Scrape jobs from App.thrivity.mk."""
        self.base_url = "https://app.thrivity.mk/job-posts"
        logger.info("Starting scrape", source=self.source_name)
        jobs = []

        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(self.base_url, timeout=30000)
                
                # Wait for jobs to load
                page.wait_for_timeout(10000)
                
                # Attempt to find job links
                links = page.query_selector_all('a')
                job_links = [l for l in links if l.get_attribute('href') and '/job-post/' in l.get_attribute('href')]
                
                logger.info(f"Found {len(job_links)} job links", source=self.source_name)
                
                for link in job_links:
                    try:
                        title_text = link.inner_text().strip()
                        if not title_text:
                            # Try finding an inner heading
                            h_el = link.query_selector('h1, h2, h3, h4, h5, h6, .title')
                            if h_el:
                                title_text = h_el.inner_text().strip()
                        
                        url = link.get_attribute('href')
                        if url and not url.startswith('http'):
                            url = "https://app.thrivity.mk" + url
                            
                        # Navigate to parent to find company and location
                        parent = link.evaluate_handle('el => el.parentElement.parentElement')
                        
                        company_text = "Unknown Company"
                        location_text = "Unknown"
                        company_logo_url = None
                        
                        if parent:
                            # Try to find an image in the parent structure
                            img = parent.query_selector('img')
                            if img:
                                company_logo_url = img.get_attribute('src')
                            
                            all_text = parent.inner_text()
                            if all_text:
                                lines = [line.strip() for line in all_text.split('\n') if line.strip()]
                                # The first few lines usually contain company and location in these cards
                                if len(lines) > 1 and lines[0] != title_text:
                                    company_text = lines[0]
                                elif len(lines) > 2:
                                    company_text = lines[1]

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
                
                browser.close()

        except Exception as e:
            logger.error(f"Scraping failed: {str(e)}", source=self.source_name)

        logger.info(f"Scraped {len(jobs)} jobs", source=self.source_name)
        return jobs
