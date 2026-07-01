import bs4
html = open('e:/jb.mk/testjobwall/scraper/tests/mkjob_details.html', encoding='utf-8').read()
soup = bs4.BeautifulSoup(html, 'html.parser')
import sys
sys.stdout.reconfigure(encoding='utf-8')

for el in soup.find_all(string=True):
    if 'Sigma' in el or 'P.I.C' in el or 'П.И.К' in el:
        parent = el.parent
        print(f"Tag: {parent.name}, Class: {parent.get('class')}")
        print(f"Text: {el.strip()}")
        print(f"Parent's parent Class: {parent.parent.get('class') if parent.parent else None}")
        print("---")
