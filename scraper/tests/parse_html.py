import codecs
from bs4 import BeautifulSoup
soup = BeautifulSoup(open('e:\\jb.mk\\testjobwall\\scraper\\tests\\output_detail.html', encoding='utf-8'), 'html.parser')
with codecs.open('parsed_clean.txt', 'w', 'utf-8') as f:
    f.write((soup.title.text if soup.title else 'No title') + '\n')
    for elem in soup.select('p, h1, h2, h3, a'):
        text = elem.text.strip()
        if len(text) > 2:
            f.write(f"<{elem.name}>: {text}\n")
