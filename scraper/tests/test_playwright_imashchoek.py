from playwright.sync_api import sync_playwright
import time

def test_imashchoek():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        )
        print("Navigating to Imashchoek...")
        try:
            page.goto("https://www.imashchoek.mk/", timeout=30000)
            page.wait_for_selector('.job-card, .job, article, a', timeout=10000)
            print("Page loaded successfully. Length:", len(page.content()))
            
            jobs = page.query_selector_all('.job-card, .job, article')
            print(f"Found {len(jobs)} job containers")
            if len(jobs) == 0:
                links = page.query_selector_all('a')
                job_links = []
                for link in links:
                    href = link.get_attribute('href')
                    if href and ('/job/' in href or 'oglas' in href):
                        job_links.append(link)
                print(f"Found {len(job_links)} job links based on href")
                if job_links:
                    print("Class of first job link:", job_links[0].get_attribute('class'))
                    
        except Exception as e:
            print("Error:", e)
        finally:
            browser.close()

if __name__ == "__main__":
    test_imashchoek()
