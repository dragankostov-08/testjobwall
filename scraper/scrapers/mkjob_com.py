"""
Scraper for Mkjob.com - Macedonian job portal.
"""

from typing import List
from urllib.parse import urljoin
from scrapers.base_scraper import BaseScraper, ScrapedJob
from core.logger import get_logger

logger = get_logger(__name__)


class MkjobComScraper(BaseScraper):
    """Scraper for mkjob.com job listings."""

    def __init__(self):
        super().__init__(
            source_name="mkjob.com",
            base_url="https://www.mkjob.com/"
        )

    def _extract_company_from_logo(self, logo_url: str) -> str:
        """Heuristic to extract company name from logo URL."""
        if not logo_url:
            return "Unknown Company"
            
        try:
            # Example: https://api.mkjob.com/storage/company_logos/1782914858_308_sigma_sb_logo.jpg
            filename = logo_url.split('/')[-1]
            # Remove extension
            name_part = filename.rsplit('.', 1)[0]
            
            # Usually starts with numbers and underscores: 1782914858_308_sigma_sb_logo
            parts = name_part.split('_')
            
            # Filter out numeric parts and common words like 'logo', 'images', 'screenshot'
            words = []
            for part in parts:
                if part.isdigit():
                    continue
                part_lower = part.lower()
                if part_lower in ['logo', 'images', 'screenshot', 'image', 'picture']:
                    continue
                if part_lower.startswith('screenshot'):
                    continue
                words.append(part)
                
            if words:
                # Reconstruct and title case
                company = " ".join(words).title()
                return company
        except Exception:
            pass
            
        return "Unknown Company"

    def scrape(self) -> List[ScrapedJob]:
        """Scrape jobs from mkjob.com."""
        logger.info("Starting scrape", source=self.source_name)
        jobs = []

        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(self.base_url, timeout=30000)
                
                # Wait for jobs to load
                page.wait_for_timeout(5000)
                
                # Find all links that contain /oglas/
                link_elements = page.query_selector_all('a[href*="/oglas/"]')
                logger.info(f"Found {len(link_elements)} potential job links", source=self.source_name)
                
                for link_el in link_elements:
                    try:
                        url = link_el.get_attribute('href')
                        if not url:
                            continue
                            
                        if not url.startswith('http'):
                            url = urljoin(self.base_url, url)
                            
                        # Get the parent card to extract text and image
                        # Next.js app uses utility classes, the parent is typically an ancestor div
                        parent_js = """
                        (element) => {
                            let curr = element.parentElement;
                            while (curr && curr.tagName !== 'BODY') {
                                // Assume a card has an img tag for the company logo
                                if (curr.querySelector('img')) {
                                    return curr;
                                }
                                curr = curr.parentElement;
                            }
                            return element;
                        }
                        """
                        card = link_el.evaluate_handle(parent_js)
                        
                        if not card:
                            continue
                            
                        text_content = card.inner_text().strip()
                        if not text_content:
                            continue
                            
                        # Split by newlines. The format is often like:
                        # Ново (optional)
                        # Title
                        # Location
                        # Time
                        lines = [line.strip() for line in text_content.split('\n') if line.strip()]
                        
                        if not lines:
                            continue
                            
                        title = lines[0]
                        idx = 1
                        if title.lower() == 'ново' and len(lines) > 1:
                            title = lines[1]
                            idx = 2
                            
                        location = "Unknown"
                        if len(lines) > idx:
                            location = lines[idx]
                            
                        # Get logo image
                        img_el = card.query_selector('img')
                        company_logo_url = None
                        company_name = "Unknown Company"
                        
                        if img_el:
                            src = img_el.get_attribute('src')
                            if src:
                                company_logo_url = src
                                company_name = self._extract_company_from_logo(src)

                        # Fetch detail page to get accurate company name
                        import requests
                        from bs4 import BeautifulSoup
                        try:
                            res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
                            if res.status_code == 200:
                                detail_soup = BeautifulSoup(res.text, 'html.parser')
                                title_text = detail_soup.title.text if detail_soup.title else ""
                                if " | MKJOB" in title_text:
                                    # Example: Сметководител - Sigma-SB | MKJOB
                                    parts = title_text.replace(" | MKJOB", "").split(" - ")
                                    if len(parts) >= 2:
                                        company_name = parts[-1].strip()
                        except Exception as e:
                            logger.warning(f"Error fetching detail page for {url}: {e}", source=self.source_name)

                        if title and url:
                            jobs.append(ScrapedJob(
                                title=title,
                                company=company_name,
                                location=location,
                                url=url,
                                company_logo_url=company_logo_url
                            ))
                    except Exception as e:
                        logger.warning(f"Error parsing job card: {str(e)}", source=self.source_name)
                        
                browser.close()
                
        except Exception as e:
            logger.error(f"Scraper failed: {str(e)}", source=self.source_name)
            
        logger.info(f"Successfully scraped {len(jobs)} jobs", source=self.source_name)
        return jobs
