from bs4 import BeautifulSoup

with open('e:/jb.mk/testjobwall/scraper/tests/oglasizarabota_dump.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
jobs = soup.select('.oglas-item, .job')
print(f"Original selector found {len(jobs)} jobs")

if len(jobs) == 0:
    # Let's try to find other common job wrappers or inspect links
    # Often job titles are in h2/h3 inside anchors
    links = soup.find_all('a')
    print(f"Total links: {len(links)}")
    
    # Try finding typical wrappers
    articles = soup.find_all('article')
    print(f"Articles: {len(articles)}")
    
    # Check for specific classes
    for a in links[:10]:
        print(a.get('class'), a.get('href'))
