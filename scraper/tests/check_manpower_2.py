from bs4 import BeautifulSoup

with open('e:/jb.mk/testjobwall/scraper/tests/manpower_dump.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
links = soup.find_all('a')
job_links = [a for a in links if '/mk/job-posts/' in a.get('href', '') or '/en/job-posts/' in a.get('href', '')]

print(f"Found {len(job_links)} job links")
if job_links:
    for a in job_links[:5]:
        print(a.get('href'), a.get('class'))
        print("Text:", a.get_text(strip=True))
        
        # parent
        p = a.parent
        print("Parent classes:", p.get('class'))
