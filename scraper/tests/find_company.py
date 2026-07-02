import codecs
from bs4 import BeautifulSoup

soup = BeautifulSoup(open('e:\\jb.mk\\testjobwall\\scraper\\tests\\output_detail.html', encoding='utf-8'), 'html.parser')
company_link = soup.select_one('a[href^="/kompanija/"]')
if company_link:
    with codecs.open('e:\\jb.mk\\testjobwall\\scraper\\tests\\company.txt', 'w', 'utf-8') as f:
        f.write(company_link.text.strip())
else:
    with codecs.open('e:\\jb.mk\\testjobwall\\scraper\\tests\\company.txt', 'w', 'utf-8') as f:
        f.write('No company link found')
