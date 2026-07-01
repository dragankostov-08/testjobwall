"""
Scraper for Vrabotuvanje.com.mk - Macedonian job portal.
"""

from typing import List
from scrapers.base_scraper import BaseScraper, ScrapedJob
from core.logger import get_logger

logger = get_logger(__name__)


class VrabotuvanjeMkScraper(BaseScraper):
    """Scraper for vrabotuvanje.com.mk job listings."""

    def __init__(self):
        super().__init__(
            source_name="Vrabotuvanje.com.mk",
            base_url="https://www.vrabotuvanje.com.mk/"
        )

    def scrape(self) -> List[ScrapedJob]:
        """Scrape jobs from Vrabotuvanje.com.mk."""
        logger.info("Starting scrape", source=self.source_name)
        jobs = []

        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(self.base_url, timeout=30000)
                
                # Wait for the job cards to load on the screen
                try:
                    page.wait_for_selector('.mp-card', timeout=15000)
                except Exception as e:
                    logger.warning(f"No job cards appeared: {e}", source=self.source_name)
                    browser.close()
                    return jobs
                
                # Give it a moment to stabilize
                page.wait_for_timeout(2000)
                
                cards = page.query_selector_all('.mp-card')
                logger.info(f"Found {len(cards)} job elements", source=self.source_name)
                
                for card in cards:
                    try:
                        title_element = card.query_selector('h3')
                        if not title_element:
                            continue
                            
                        title_text = title_element.inner_text().strip()
                        
                        link_element = card.query_selector('a')
                        url = link_element.get_attribute('href') if link_element else ''
                        if url and not url.startswith('http'):
                            from urllib.parse import urljoin
                            url = urljoin(self.base_url, url)
                            
                        # Try to extract company logo and name from the card image
                        company_logo_url = None
                        logo_img = card.query_selector('img')
                        company_alt = ""
                        if logo_img:
                            logo_src = logo_img.get_attribute('src')
                            company_alt = logo_img.get_attribute('alt') or ""
                            if logo_src:
                                if not logo_src.startswith('http'):
                                    from urllib.parse import urljoin
                                    logo_src = urljoin(self.base_url, logo_src)
                                if 'company-logo' in logo_src:
                                    company_logo_url = logo_src

                        # Determine company and location
                        company_text = "Unknown Company"
                        location_text = "Unknown"
                        
                        if company_alt and company_alt.strip() and "vrabotuvanje.com" not in company_alt.lower():
                            company_text = company_alt.strip()
                            
                        # Parse spans for location and fallback company
                        spans = card.query_selector_all('span.mp-text.mp-text__default')
                        for span in spans:
                            text = span.inner_text().strip()
                            if not text:
                                continue
                            
                            # Simple heuristic: if it contains known cities or "remote" or "цела", it's probably location
                            lower_text = text.lower()
                            is_location = any(loc in lower_text for loc in ['скопје', 'skopje', 'битола', 'remote', 'македонија', 'цела', 'охрид', 'тетово', 'куманово'])
                            
                            if is_location:
                                location_text = text
                            elif company_text == "Unknown Company":
                                company_text = text
                            else:
                                if location_text == "Unknown":
                                    location_text = text

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
