import codecs
from bs4 import BeautifulSoup
soup = BeautifulSoup(open('e:\\jb.mk\\testjobwall\\scraper\\tests\\output_detail.html', encoding='utf-8'), 'html.parser')
p_tags = soup.find_all('p')
with codecs.open('e:\\jb.mk\\testjobwall\\scraper\\tests\\p_tags.txt', 'w', 'utf-8') as f:
    for i, p in enumerate(p_tags):
        f.write(f"--- p {i} (class: {p.get('class', [])}) ---\n")
        f.write(p.text.strip() + "\n")
