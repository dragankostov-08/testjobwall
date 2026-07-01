import NewsCard, { NewsArticle } from "@/components/news/NewsCard";
import NewsSearchBar from "@/components/news/NewsSearchBar";
import InfiniteNewsFeed from "@/components/news/InfiniteNewsFeed";
import { headers } from "next/headers";
import { Clock, TrendingUp, Flame } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Кариерни Вести - JOBWALL",
  description: "Најнови вести за кариера, вработување, плати и пазар на труд во Македонија.",
};

async function fetchNews(section?: string, limit: number = 15): Promise<NewsArticle[]> {
  try {
    const host = (await headers()).get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

    const params = new URLSearchParams();
    if (section) params.append("section", section);
    params.append("limit", limit.toString());

    const url = `${protocol}://${host}/api/news?${params.toString()}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
}

export default async function NewsPage() {
  const [trendingNews, latestNews] = await Promise.all([
    fetchNews("trending", 4),
    fetchNews("latest", 15),
  ]);

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Search Bar */}
      <NewsSearchBar />

      {/* Top Stories — 3-4 most important/trending */}
      {trendingNews.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-amber-500" />
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight text-center">
              Топ Вести
            </h2>
            <div className="w-1 h-6 rounded-full bg-amber-500" />
          </div>

          <div className="space-y-4">
            {trendingNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Divider */}
      {trendingNews.length > 0 && latestNews.length > 0 && (
        <div className="h-px bg-border my-8" />
      )}

      {/* Latest News with Infinite Scroll */}
      <section>
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-1 h-6 rounded-full bg-blue-500" />
          <Clock className="w-5 h-5 text-blue-500" />
          <h2 className="text-2xl font-bold text-foreground tracking-tight text-center">
            Последни Вести
          </h2>
          <div className="w-1 h-6 rounded-full bg-blue-500" />
        </div>

        <InfiniteNewsFeed initialNews={latestNews} />
      </section>
    </div>
  );
}
