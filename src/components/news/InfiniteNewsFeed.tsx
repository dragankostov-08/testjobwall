"use client";

import { useState, useRef, useCallback } from "react";
import NewsCard, { NewsArticle } from "./NewsCard";
import { Loader2 } from "lucide-react";

export default function InfiniteNewsFeed({ initialNews }: { initialNews: NewsArticle[] }) {
  const [news, setNews] = useState<NewsArticle[]>(initialNews);
  const [offset, setOffset] = useState(initialNews.length);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreNews();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const loadMoreNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?section=latest&limit=15&offset=${offset}`);
      if (res.ok) {
        const newArticles = await res.json();
        if (newArticles.length === 0) {
          setHasMore(false);
        } else {
          setNews((prev) => [...prev, ...newArticles]);
          setOffset((prev) => prev + newArticles.length);
        }
      }
    } catch (error) {
      console.error("Error loading more news:", error);
    } finally {
      setLoading(false);
    }
  };

  if (news.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-lg">
        <p className="text-muted-foreground">Нема вести во моментов.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {news.map((article, index) => {
        if (index === news.length - 1) {
          return (
            <div ref={lastElementRef} key={article.id}>
              <NewsCard article={article} />
            </div>
          );
        }
        return <NewsCard key={article.id} article={article} />;
      })}
      
      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
