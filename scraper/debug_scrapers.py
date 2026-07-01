import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import json

results = {}

# 1. vraboti.se
soup = BeautifulSoup(requests.get('https://vraboti.se/announcements').content, 'html.parser')
el = soup.find('a', href=lambda x: x and '/announcements/view/' in x)
if el:
    card = el.find_parent('div', class_='job-post-info') or el.find_parent('li') or el.parent.parent.parent.parent
    results['vraboti'] = card.prettify()[:1000] if card else 'NO CARD'

# 2. honorarec.mk
soup = BeautifulSoup(requests.get('https://honorarec.mk/oglasi').content, 'html.parser')
el = soup.find('a', href=lambda x: x and '/oglas/' in x)
if el:
    card = el.find_parent('article') or el.parent.parent.parent
    results['honorarec'] = card.prettify()[:1000] if card else 'NO CARD'

# 3. thrivity
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('https://app.thrivity.mk/job-posts', timeout=30000)
    page.wait_for_timeout(5000)
    card = page.query_selector('.job-post, .card, div')
    results['thrivity'] = page.inner_html('body')[:2000]
    browser.close()

with open('debug_scrapers.txt', 'w', encoding='utf-8') as f:
    for k, v in results.items():
        f.write(f"--- {k} ---\n{v}\n\n")
