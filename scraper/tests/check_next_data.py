import re
html = open('e:/jb.mk/testjobwall/scraper/tests/mkjob_details.html', encoding='utf-8').read()
m = re.search(r'<script id="__NEXT_DATA__".*?>(.*?)</script>', html)
if m:
    import json
    data = json.loads(m.group(1))
    print(list(data.keys()))
else:
    print('No NEXT_DATA')
    
    # Try just searching for Sigma
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')
    for text in soup.stripped_strings:
        if 'Sigma' in text or 'P.I.C' in text or 'П.И.К' in text:
            print(text)
