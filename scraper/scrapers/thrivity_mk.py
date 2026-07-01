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
                
                # We can just get the HTML and parse with BeautifulSoup to avoid complex Playwright extraction
                content = page.content()
                browser.close()
                
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(content, 'html.parser')
                
                job_cards = soup.select('.job-post-card')
                logger.info(f"Found {len(job_cards)} job cards", source=self.source_name)
                
                for card in job_cards:
                    try:
                        title_el = card.select_one('.title a')
                        if not title_el:
                            continue
                            
                        title_text = title_el.get_text(strip=True)
                        
                        company_text = "Unknown Company"
                        company_el = card.select_one('h6')
                        if company_el:
                            company_text = company_el.get_text(strip=True)
                            
                        # Extract job id from apply link
                        apply_link = card.select_one('a[href*="jobPost="]')
                        url = None
                        if apply_link:
                            href = apply_link.get('href', '')
                            if 'jobPost=' in href:
                                job_id = href.split('jobPost=')[1].split('&')[0]
                                url = f"https://app.thrivity.mk/job-post/{job_id}"
                                
                        if not url:
                            continue
                            
                        # Extract location
                        location_text = "Unknown"
                        marker = card.select_one('.fa-map-marker')
                        if marker and marker.parent:
                            spans = marker.parent.select('span')
                            if spans:
                                location_text = ", ".join([s.get_text(strip=True) for s in spans if s.get_text(strip=True)])
                                
                        # Extract image
                        company_logo_url = None
                        img_div = card.select_one('.jobpost-company-img')
                        if img_div and 'background-image: url(' in str(img_div):
                            bg_style = img_div.get('style', '')
                            if 'url("' in bg_style:
                                company_logo_url = bg_style.split('url("')[1].split('")')[0]
                            elif 'url(' in bg_style:
                                company_logo_url = bg_style.split('url(')[1].split(')')[0]
                                
                        jobs.append(ScrapedJob(
                            title=title_text,
                            company=company_text,
                            location=location_text.strip(', '),
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
