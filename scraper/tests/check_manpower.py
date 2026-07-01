from bs4 import BeautifulSoup

with open('e:/jb.mk/testjobwall/scraper/tests/manpower_dump.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
jobs = soup.select('.job-listing, .job-item, article, .job')
print(f"Original or common selectors found {len(jobs)} jobs")

if len(jobs) == 0:
    links = soup.find_all('a')
    for a in links[:20]:
        href = a.get('href', '')
        if 'job' in href or 'rabota' in href or 'oglas' in href:
            print("Job link?", href, a.get('class'))
