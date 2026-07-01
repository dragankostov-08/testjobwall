"""
News fetcher service — fetches career/employment news from RSS feeds and web scrapers.
Supports two source types:
  - 'rss': Parse RSS/Atom feeds using feedparser
  - 'scraper': Scrape HTML pages using BeautifulSoup with configurable selectors
"""

import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup
from core.logger import get_logger
from core.database import get_supabase
from core.settings import settings

logger = get_logger(__name__)


# ─────────────────────────────────────────
# Relevance keywords for ranking
# ─────────────────────────────────────────

HIGH_RELEVANCE_KEYWORDS = [
    # Macedonian
    "вработување", "вработени", "плата", "плати", "работа", "кариера",
    "отпуштање", "нови работни места", "инвестиција", "пазар на труд",
    "регрутирање", "далечински", "технологија", "ит", "стартап",
    "компанија", "менаџмент", "економија", "бизнис",
    # English
    "hiring", "salary", "remote", "jobs", "career", "employment",
    "workforce", "layoff", "startup", "investment", "tech",
    "recruitment", "labor market",
]

CATEGORY_KEYWORDS = {
    "hiring": ["вработување", "вработени", "регрутирање", "hiring", "recruitment", "нови работни места", "оглас"],
    "salary": ["плата", "плати", "salary", "compensation", "примања", "заработка"],
    "remote": ["далечински", "remote", "work from home", "од дома", "хибриден"],
    "market": ["пазар на труд", "labor market", "економија", "economy", "бизнис", "business", "инвестиција"],
    "tech": ["технологија", "tech", "ит", "it", "софтвер", "software", "стартап", "startup", "дигитал"],
}


@dataclass
class FetchedArticle:
    """A single fetched news article."""
    title: str
    summary: str
    original_url: str
    image_url: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    category: str = "general"
    relevance_score: float = 1.0


class NewsFetcherService:
    """Fetches news from RSS feeds and web scrapers."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })

    # ─────────────────────────────────────
    # Public API
    # ─────────────────────────────────────

    def fetch_all_sources(self) -> int:
        """Fetch news from all active sources. Returns total articles inserted."""
        client = get_supabase()
        response = client.table("news_sources").select("*").eq("active", True).execute()
        sources = response.data or []

        total_inserted = 0
        for source in sources:
            try:
                articles = self._fetch_source(source)
                inserted = self._store_articles(client, articles, source["id"])
                total_inserted += inserted

                # Update last_fetched
                client.table("news_sources").update(
                    {"last_fetched": datetime.now(timezone.utc).isoformat()}
                ).eq("id", source["id"]).execute()

                logger.info(
                    f"Fetched {len(articles)} articles, inserted {inserted}",
                    source=source["name"],
                )
            except Exception as e:
                logger.error(f"Failed to fetch news from {source['name']}: {str(e)}")
                continue

        return total_inserted

    def fetch_single_source(self, source_name: str) -> int:
        """Fetch news from a specific source by name."""
        client = get_supabase()
        response = client.table("news_sources").select("*").eq("name", source_name).limit(1).execute()
        if not response.data:
            logger.warning(f"News source not found: {source_name}")
            return 0

        source = response.data[0]
        articles = self._fetch_source(source)
        inserted = self._store_articles(client, articles, source["id"])

        client.table("news_sources").update(
            {"last_fetched": datetime.now(timezone.utc).isoformat()}
        ).eq("id", source["id"]).execute()

        return inserted

    # ─────────────────────────────────────
    # Fetching Logic
    # ─────────────────────────────────────

    def _fetch_source(self, source: Dict[str, Any]) -> List[FetchedArticle]:
        """Route to the correct fetcher based on source_type."""
        source_type = source.get("source_type", "rss")

        if source_type == "rss":
            return self._fetch_rss(source["url"], source["name"])
        elif source_type == "scraper":
            config = source.get("scraper_config") or {}
            return self._fetch_scraper(source["url"], source["name"], config)
        else:
            logger.warning(f"Unknown source type: {source_type}")
            return []

    def _fetch_rss(self, feed_url: str, source_name: str) -> List[FetchedArticle]:
        """Parse an RSS/Atom feed and return articles."""
        articles: List[FetchedArticle] = []

        try:
            resp = self.session.get(feed_url, timeout=settings.request_timeout, verify=False)
            resp.raise_for_status()
        except requests.RequestException as e:
            logger.error(f"Failed to fetch RSS feed: {str(e)}", source=source_name)
            return articles

        try:
            root = ET.fromstring(resp.content)
            
            # Handle both RSS 2.0 and Atom feeds
            ns = {"atom": "http://www.w3.org/2005/Atom", "media": "http://search.yahoo.com/mrss/"}

            items = root.findall(".//item")  # RSS 2.0
            if not items:
                items = root.findall(".//atom:entry", ns)  # Atom

            for item in items[:30]:  # Limit to 30 articles per source
                try:
                    article = self._parse_rss_item(item, ns, source_name)
                    if article:
                        articles.append(article)
                except Exception as e:
                    logger.error(f"Failed to parse RSS item: {str(e)}", source=source_name)
                    continue

        except ET.ParseError as e:
            logger.warning(f"Failed to parse RSS XML with ElementTree, falling back to BeautifulSoup: {str(e)}", source=source_name)
            # Fallback to BeautifulSoup html.parser for malformed XML
            try:
                soup = BeautifulSoup(resp.content, "html.parser")
                items = soup.find_all(["item", "entry"])
                
                for item in items[:30]:
                    try:
                        article = self._parse_bs4_rss_item(item, source_name)
                        if article:
                            articles.append(article)
                    except Exception as bs4_err:
                        logger.error(f"Failed to parse RSS item (bs4 fallback): {str(bs4_err)}", source=source_name)
                        continue
            except Exception as soup_err:
                logger.error(f"BeautifulSoup fallback failed: {str(soup_err)}", source=source_name)

        return articles

    def _parse_rss_item(self, item: ET.Element, ns: dict, source_name: str) -> Optional[FetchedArticle]:
        """Parse a single RSS/Atom item."""
        # Title
        title_el = item.find("title")
        if title_el is None:
            title_el = item.find("atom:title", ns)
            
        if title_el is None or not title_el.text:
            return None
        title = title_el.text.strip()

        # Link
        link_el = item.find("link")
        if link_el is not None:
            link = link_el.text.strip() if link_el.text else link_el.get("href", "")
        else:
            link_el = item.find("atom:link", ns)
            link = link_el.get("href", "") if link_el is not None else ""
        if not link:
            return None

        # Description / Summary
        desc_el = item.find("description")
        if desc_el is None:
            desc_el = item.find("atom:summary", ns)
        if desc_el is None:
            desc_el = item.find("atom:content", ns)
            
        summary = ""
        if desc_el is not None and desc_el.text:
            # Strip HTML tags from description
            soup = BeautifulSoup(desc_el.text, "html.parser")
            summary = soup.get_text(separator=" ", strip=True)
            # Truncate to first 300 chars
            if len(summary) > 300:
                summary = summary[:297] + "..."

        # Published date
        pub_date = None
        date_el = item.find("pubDate")
        if date_el is None:
            date_el = item.find("atom:published", ns)
        if date_el is None:
            date_el = item.find("atom:updated", ns)
            
        if date_el is not None and date_el.text:
            pub_date = self._parse_date(date_el.text.strip())
        if pub_date is None:
            pub_date = datetime.now(timezone.utc)

        # Image
        image_url = None
        # Try media:content
        media_el = item.find("media:content", ns)
        if media_el is not None:
            image_url = media_el.get("url")
        # Try enclosure
        if not image_url:
            enclosure = item.find("enclosure")
            if enclosure is not None and enclosure.get("type", "").startswith("image"):
                image_url = enclosure.get("url")
        # Try to find image in description HTML
        if not image_url and desc_el is not None and desc_el.text:
            soup = BeautifulSoup(desc_el.text, "html.parser")
            img = soup.find("img")
            if img and img.get("src"):
                image_url = img["src"]

        # Author
        author = None
        author_el = item.find("author")
        if author_el is None:
            author_el = item.find("dc:creator", {"dc": "http://purl.org/dc/elements/1.1/"})
        if author_el is None:
            author_el = item.find("atom:author/atom:name", ns)
            
        if author_el is not None and author_el.text:
            author = author_el.text.strip()

        # Categorize and score
        text_for_analysis = f"{title} {summary}".lower()
        category = self._categorize_article(text_for_analysis)
        relevance_score = self._calculate_relevance(text_for_analysis, pub_date)

        return FetchedArticle(
            title=title,
            summary=summary,
            original_url=link,
            image_url=image_url,
            author=author,
            published_at=pub_date,
            category=category,
            relevance_score=relevance_score,
        )

    def _parse_bs4_rss_item(self, item, source_name: str) -> Optional[FetchedArticle]:
        """Fallback parser for malformed RSS using BeautifulSoup html.parser."""
        # Title
        title_el = item.find("title")
        if not title_el or not title_el.text:
            return None
        title = title_el.text.strip()

        # Link
        link_el = item.find("link")
        link = ""
        if link_el:
            link = link_el.text.strip()
            if not link and link_el.has_attr("href"):
                link = link_el["href"]
        if not link:
            return None

        # Description / Summary
        desc_el = item.find("description") or item.find("summary") or item.find("content")
        summary = ""
        if desc_el and desc_el.text:
            soup = BeautifulSoup(desc_el.text, "html.parser")
            summary = soup.get_text(separator=" ", strip=True)
            if len(summary) > 300:
                summary = summary[:297] + "..."

        # Published date
        pub_date = None
        date_el = item.find("pubdate") or item.find("published") or item.find("updated")
        if date_el and date_el.text:
            pub_date = self._parse_date(date_el.text.strip())
        if pub_date is None:
            pub_date = datetime.now(timezone.utc)

        # Image
        image_url = None
        media_el = item.find("media:content")
        if media_el and media_el.has_attr("url"):
            image_url = media_el["url"]
        if not image_url:
            enclosure = item.find("enclosure")
            if enclosure and enclosure.has_attr("type") and enclosure["type"].startswith("image"):
                image_url = enclosure.get("url")
        if not image_url and desc_el and desc_el.text:
            soup = BeautifulSoup(desc_el.text, "html.parser")
            img = soup.find("img")
            if img and img.has_attr("src"):
                image_url = img["src"]

        # Author
        author = None
        author_el = item.find("author") or item.find("dc:creator") or item.find("name")
        if author_el and author_el.text:
            author = author_el.text.strip()

        # Categorize and score
        text_for_analysis = f"{title} {summary}".lower()
        category = self._categorize_article(text_for_analysis)
        relevance_score = self._calculate_relevance(text_for_analysis, pub_date)

        return FetchedArticle(
            title=title,
            summary=summary,
            original_url=link,
            image_url=image_url,
            author=author,
            published_at=pub_date,
            category=category,
            relevance_score=relevance_score,
        )

    def _fetch_scraper(self, url: str, source_name: str, config: Dict[str, Any]) -> List[FetchedArticle]:
        """Scrape news from an HTML page using configurable CSS selectors.

        Config should contain:
        {
            "article_selector": ".article-item",
            "title_selector": "h2 a",
            "summary_selector": ".excerpt",
            "link_selector": "h2 a",
            "image_selector": "img",
            "date_selector": ".date",
        }
        """
        articles: List[FetchedArticle] = []

        if not config:
            logger.warning(f"No scraper config for {source_name}")
            return articles

        try:
            resp = self.session.get(url, timeout=settings.request_timeout, verify=False)
            resp.raise_for_status()
        except requests.RequestException as e:
            logger.error(f"Failed to scrape {url}: {str(e)}", source=source_name)
            return articles

        soup = BeautifulSoup(resp.text, "html.parser")
        article_els = soup.select(config.get("article_selector", "article"))[:30]

        for el in article_els:
            try:
                # Title
                title_el = el.select_one(config.get("title_selector", "h2"))
                if not title_el:
                    continue
                title = title_el.get_text(strip=True)
                if not title:
                    continue

                # Link
                link_el = el.select_one(config.get("link_selector", "a"))
                link = link_el.get("href", "") if link_el else ""
                if not link:
                    continue
                if not link.startswith("http"):
                    from urllib.parse import urljoin
                    link = urljoin(url, link)

                # Summary
                summary = ""
                summary_el = el.select_one(config.get("summary_selector", ".excerpt, .summary, p"))
                if summary_el:
                    summary = summary_el.get_text(strip=True)
                    if len(summary) > 300:
                        summary = summary[:297] + "..."

                # Image
                image_url = None
                img_el = el.select_one(config.get("image_selector", "img"))
                if img_el:
                    image_url = img_el.get("src") or img_el.get("data-src")
                    if image_url and not image_url.startswith("http"):
                        from urllib.parse import urljoin
                        image_url = urljoin(url, image_url)

                # Date
                pub_date = None
                date_el = el.select_one(config.get("date_selector", ".date, time"))
                if date_el:
                    date_text = date_el.get("datetime") or date_el.get_text(strip=True)
                    if date_text:
                        pub_date = self._parse_date(date_text)
                if pub_date is None:
                    pub_date = datetime.now(timezone.utc)

                # Categorize and score
                text_for_analysis = f"{title} {summary}".lower()
                category = self._categorize_article(text_for_analysis)
                relevance_score = self._calculate_relevance(text_for_analysis, pub_date)

                articles.append(FetchedArticle(
                    title=title,
                    summary=summary,
                    original_url=link,
                    image_url=image_url,
                    published_at=pub_date,
                    category=category,
                    relevance_score=relevance_score,
                ))
            except Exception as e:
                logger.error(f"Failed to parse scraped article: {str(e)}", source=source_name)
                continue

        return articles

    # ─────────────────────────────────────
    # Storage
    # ─────────────────────────────────────

    def _store_articles(self, client, articles: List[FetchedArticle], source_id: str) -> int:
        """Store articles in the database, skipping duplicates. Returns count inserted."""
        if not articles:
            return 0

        rows = []
        for article in articles:
            rows.append({
                "source_id": source_id,
                "title": article.title,
                "summary": article.summary or None,
                "original_url": article.original_url,
                "image_url": article.image_url,
                "author": article.author,
                "published_at": article.published_at.isoformat() if article.published_at else datetime.now(timezone.utc).isoformat(),
                "category": article.category,
                "relevance_score": article.relevance_score,
            })

        try:
            response = client.table("news_articles").upsert(
                rows, on_conflict="original_url"
            ).execute()
            return len(response.data) if response.data else 0
        except Exception as e:
            logger.error(f"Failed to store news articles: {str(e)}")
            return 0

    # ─────────────────────────────────────
    # Categorization & Ranking
    # ─────────────────────────────────────

    @staticmethod
    def _categorize_article(text: str) -> str:
        """Categorize an article based on keyword matching."""
        scores: Dict[str, int] = {}
        for category, keywords in CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text)
            if score > 0:
                scores[category] = score

        if not scores:
            return "general"

        return max(scores, key=scores.get)  # type: ignore

    @staticmethod
    def _calculate_relevance(text: str, published_at: Optional[datetime]) -> float:
        """Calculate relevance score for news ranking.

        Score = (0.40 × KeywordRelevance) + (0.35 × Freshness) + (0.25 × CategoryBoost)
        """
        # Keyword relevance (40%)
        keyword_hits = sum(1 for kw in HIGH_RELEVANCE_KEYWORDS if kw in text)
        keyword_score = min(keyword_hits / 5.0, 1.0)  # Cap at 5 hits

        # Freshness (35%)
        freshness = 1.0
        if published_at:
            age_hours = (datetime.now(timezone.utc) - published_at.replace(tzinfo=timezone.utc if published_at.tzinfo is None else published_at.tzinfo)).total_seconds() / 3600
            if age_hours <= 6:
                freshness = 1.0
            elif age_hours <= 24:
                freshness = 0.8
            elif age_hours <= 48:
                freshness = 0.6
            elif age_hours <= 72:
                freshness = 0.4
            else:
                freshness = 0.2

        # Category boost (25%)
        category = NewsFetcherService._categorize_article(text)
        category_boosts = {
            "hiring": 1.0,
            "salary": 0.9,
            "remote": 0.85,
            "tech": 0.8,
            "market": 0.75,
            "general": 0.3,
        }
        category_boost = category_boosts.get(category, 0.3)

        score = (0.40 * keyword_score) + (0.35 * freshness) + (0.25 * category_boost)
        return round(min(score, 9.99), 2)

    @staticmethod
    def _parse_date(date_str: str) -> Optional[datetime]:
        """Try to parse a date string from various formats."""
        from email.utils import parsedate_to_datetime

        # Try RFC 2822 (common in RSS feeds)
        try:
            return parsedate_to_datetime(date_str)
        except (ValueError, TypeError):
            pass

        # Try ISO format
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            pass

        # Try common date formats
        formats = [
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%d.%m.%Y",
            "%d.%m.%Y %H:%M",
            "%d/%m/%Y",
        ]
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
            except (ValueError, TypeError):
                continue

        return None

    def close(self):
        """Close the HTTP session."""
        self.session.close()
