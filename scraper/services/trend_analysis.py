import re
from datetime import datetime, timedelta
from collections import Counter
from supabase import Client
from typing import Set
from core.logger import get_logger

logger = get_logger(__name__)

class TrendAnalyzer:
    _trending_keywords: Set[str] = set()
    _last_computed: datetime = None

    @classmethod
    def get_trending_keywords(cls, client: Client) -> Set[str]:
        now = datetime.utcnow()
        if cls._last_computed and (now - cls._last_computed).total_seconds() < 3600:
            return cls._trending_keywords

        try:
            # 1. Fetch titles from last 3 days
            three_days_ago = (now - timedelta(days=3)).isoformat()
            response_3d = client.table("jobs").select("title").gte("created_at", three_days_ago).execute()
            
            # 2. Fetch titles from 30 days to 4 days ago
            thirty_days_ago = (now - timedelta(days=30)).isoformat()
            response_30d = client.table("jobs").select("title").gte("created_at", thirty_days_ago).lt("created_at", three_days_ago).execute()
            
            def tokenize(text):
                # Filter out small words and common stop words implicitly by length > 3
                return [w for w in re.findall(r'\b[A-Za-zА-Ша-ш0-9]{4,}\b', text.lower())]

            recent_tokens = []
            for row in response_3d.data:
                recent_tokens.extend(tokenize(row.get("title", "")))
                
            baseline_tokens = []
            for row in response_30d.data:
                baseline_tokens.extend(tokenize(row.get("title", "")))

            recent_counts = Counter(recent_tokens)
            baseline_counts = Counter(baseline_tokens)

            recent_total = max(1, sum(recent_counts.values()))
            baseline_total = max(1, sum(baseline_counts.values()))

            trending = set()
            for word, count in recent_counts.items():
                if count >= 3:
                    recent_freq = count / recent_total
                    baseline_freq = baseline_counts.get(word, 0) / baseline_total
                    
                    # 2x more frequent than baseline or totally new
                    if recent_freq > (baseline_freq * 2.0):
                        trending.add(word)

            cls._trending_keywords = trending
            cls._last_computed = now
            logger.info(f"Computed {len(trending)} trending keywords.")
            return trending
            
        except Exception as e:
            logger.error(f"Error computing trending keywords: {e}")
            return cls._trending_keywords
