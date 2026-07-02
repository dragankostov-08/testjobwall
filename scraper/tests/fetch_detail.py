from playwright.sync_api import sync_playwright

def get_detail():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('https://www.mkjob.com/oglas/prodazhni-asistenti-podgotovka-i-prodazhba-na-kafe/oy66wr', timeout=30000)
        page.wait_for_timeout(5000)
        
        html = page.content()
        with open('e:\\jb.mk\\testjobwall\\scraper\\tests\\output_detail.html', 'w', encoding='utf-8') as f:
            f.write(html)
        
        browser.close()

if __name__ == '__main__':
    get_detail()
