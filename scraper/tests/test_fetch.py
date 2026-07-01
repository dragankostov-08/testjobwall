import sys
import os
import requests

urls = {
    "oglasizarabota": "https://www.oglasizarabota.mk/",
    "imashchoek": "https://www.imashchoek.mk/",
    "manpower": "https://manpower.com.mk/"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
}

def test():
    for name, url in urls.items():
        try:
            print(f"Fetching {name}...")
            resp = requests.get(url, headers=headers, timeout=10)
            print(f"Status {resp.status_code}")
            
            with open(f"e:/jb.mk/testjobwall/scraper/tests/{name}_dump.html", "w", encoding="utf-8") as f:
                f.write(resp.text)
            
            print(f"Saved {name} html. Length: {len(resp.text)}")
        except Exception as e:
            print(f"Error for {name}: {e}")

if __name__ == "__main__":
    test()
