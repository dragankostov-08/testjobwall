import requests
from bs4 import BeautifulSoup
import json

res = requests.get('https://www.mkjob.com/')
soup = BeautifulSoup(res.text, 'html.parser')
links = soup.select('a')
job_link = None
for link in links:
    href = link.get('href', '')
    if '/oglas/' in href:
        job_link = href
        break

if job_link:
    print(f"Found job link: {job_link}")
    if not job_link.startswith('http'):
        job_link = 'https://www.mkjob.com' + job_link
    res = requests.get(job_link)
    soup = BeautifulSoup(res.text, 'html.parser')
    
    # Try to find company name and category
    print(f"Title: {soup.title.text if soup.title else ''}")
    
    # Looking for image or text indicating company
    imgs = soup.find_all('img')
    print("Images found:")
    for img in imgs:
        print(f"  {img.get('src', '')} - {img.get('alt', '')}")
        
    print("\nText snippets:")
    # Print a few meaningful text chunks
    for p in soup.find_all(['h1', 'h2', 'h3', 'p', 'span']):
        text = p.get_text(strip=True)
        if text and len(text) > 5 and len(text) < 100:
             print(f"  {text}")
