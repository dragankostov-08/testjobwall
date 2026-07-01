import sys
import os

# Add scraper root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.vraboti_se import VrabotiSeScraper
from scrapers.jobs_com_mk import JobsComMkScraper
from scrapers.thrivity_mk import ThrivityMkScraper

def test():
    scrapers = [
        VrabotiSeScraper(),
        JobsComMkScraper(),
        ThrivityMkScraper()
    ]
    
    for scraper in scrapers:
        print(f"Testing {scraper.source_name}...")
        try:
            jobs = scraper.scrape()
            print(f"Extracted {len(jobs)} jobs from {scraper.source_name}\n")
        except Exception as e:
            print(f"Error scraping {scraper.source_name}: {e}\n")

if __name__ == "__main__":
    test()
