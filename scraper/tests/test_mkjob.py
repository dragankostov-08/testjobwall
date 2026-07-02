import sys
import os

# Add scraper root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.mkjob_com import MkjobComScraper
import json

def test():
    scraper = MkjobComScraper()
    print(f"Testing {scraper.source_name}...")
    jobs = scraper.scrape()
    
    print(f"\nExtracted {len(jobs)} jobs:")
    import dataclasses
    for j in jobs[:5]:
        print(json.dumps(dataclasses.asdict(j), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    test()
