from playwright.sync_api import sync_playwright

def get_link():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('https://www.mkjob.com/', timeout=30000)
        page.wait_for_timeout(5000)
        
        # Get first link
        link_el = page.query_selector('a[href*="/oglas/"]')
        href = link_el.get_attribute('href')
        
        # print the outer html of the parent card
        parent_js = """
        (element) => {
            let curr = element.parentElement;
            while (curr && curr.tagName !== 'BODY') {
                if (curr.querySelector('img')) {
                    return curr.outerHTML;
                }
                curr = curr.parentElement;
            }
            return element.outerHTML;
        }
        """
        html = link_el.evaluate(parent_js)
        with open('e:\\jb.mk\\testjobwall\\scraper\\tests\\output.html', 'w', encoding='utf-8') as f:
            f.write("Link: " + href + "\n")
            f.write("Card HTML:\n" + html)

        
        browser.close()

if __name__ == '__main__':
    get_link()
