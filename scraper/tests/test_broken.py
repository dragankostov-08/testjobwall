import sys
import os

# Add scraper root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.oglasizarabota_mk import OglasizarabotaMkScraper
from scrapers.imashchoek_mk import ImashchoekMkScraper
from scrapers.manpower_mk import ManpowerMkScraper
import json

def test():
    scrapers = [
        OglasizarabotaMkScraper(),
        ImashchoekMkScraper(),
        ManpowerMkScraper()
    ]
    
    for scraper in scrapers:
        print(f"Testing {scraper.source_name}...")
        jobs = scraper.scrape()
        print(f"Extracted {len(jobs)} jobs from {scraper.source_name}\n")

if __name__ == "__main__":
    test()
