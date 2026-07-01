"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper } from "lucide-react";

type NewsArticle = {
  id: string;
  title: string;
  original_url: string;
  source_name: string;
  published_at: string;
  image_url: string | null;
};

export default function SidebarNewsWidget() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news?limit=4");
        if (res.ok) {
          const data = await res.json();
          setNews(data);
        }
      } catch (error) {
        console.error("Failed to fetch sidebar news", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-foreground">Кариерни Вести</h3>
        </div>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-16 h-16 rounded bg-secondary shrink-0"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-secondary rounded w-full"></div>
                <div className="h-3 bg-secondary rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5 text-amber-500" />
        <h3 className="text-base font-semibold text-foreground tracking-tight">Кариерни Вести</h3>
      </div>
      <div className="space-y-5">
        {news.map((article) => (
          <a
            key={article.id}
            href={article.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-4 items-start"
          >
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-secondary flex items-center justify-center border border-border">
              {article.image_url ? (
                <img
                  src={article.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <Newspaper className="w-6 h-6 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[15px] text-foreground font-medium group-hover:underline line-clamp-2 leading-snug mb-1.5">
                {article.title}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {article.source_name} &bull;{" "}
                {new Date(article.published_at).toLocaleDateString("mk-MK", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          </a>
        ))}
      </div>
      <div className="mt-4">
        <Link href="/news" className="text-xs text-amber-500 hover:underline font-medium">
          Види ги сите вести &rarr;
        </Link>
      </div>
    </div>
  );
}
