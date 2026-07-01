"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import NewsCard, { NewsArticle } from "./NewsCard";

const NEWS_CATEGORY_OPTIONS = [
  { value: "", label: "Сите категории" },
  { value: "hiring", label: "Вработување" },
  { value: "salary", label: "Финансии / Плати" },
  { value: "market", label: "Економија / Бизнис" },
  { value: "tech", label: "Технологија" },
  { value: "remote", label: "Далечинска работа" },
  { value: "general", label: "Општо / Локални" },
];

interface NewsSearchBarProps {
  initialSearch?: string;
}

export default function NewsSearchBar({ initialSearch = "" }: NewsSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const isSearchActive = searchQuery.trim() !== "" || category !== "";

  const performSearch = useCallback(async () => {
    if (!isSearchActive) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (category) params.append("category", category);
      params.append("limit", "30");

      const res = await fetch(`/api/news?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("News search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, category, isSearchActive]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [performSearch]);

  const clearSearch = () => {
    setSearchQuery("");
    setCategory("");
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="mb-8">
      {/* Search Bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Пребарај вести</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Keyword search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Наслов, клучни зборови, содржина..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-sm text-foreground placeholder-muted-foreground outline-none transition-all"
            />
          </div>

          {/* Category dropdown + Clear */}
          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 h-10 pl-3 pr-8 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-sm text-foreground outline-none transition-all appearance-none cursor-pointer"
            >
              {NEWS_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {isSearchActive && (
              <button
                onClick={clearSearch}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                Исчисти
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : results.length > 0 ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {results.length} {results.length === 1 ? "резултат" : "резултати"} пронајдени
              </p>
              <div className="space-y-4">
                {results.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Search className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">Нема пронајдени вести</p>
              <p className="text-sm text-muted-foreground">
                Обидете се со различни клучни зборови или категорија.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
