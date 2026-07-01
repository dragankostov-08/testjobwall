"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Loader2, Briefcase, MapPin, Globe } from "lucide-react";
import JobCard, { Job } from "./JobCard";

const CATEGORY_OPTIONS = [
  { value: "", label: "Сите категории" },
  { value: "IT", label: "IT & Software" },
  { value: "Marketing", label: "Маркетинг" },
  { value: "Sales", label: "Продажба" },
  { value: "Finance", label: "Финансии" },
  { value: "Admin", label: "Администрација" },
  { value: "Engineering", label: "Инженерство" },
  { value: "Healthcare", label: "Здравство" },
  { value: "Hospitality", label: "Угостителство" },
  { value: "Logistics", label: "Логистика" },
  { value: "HR", label: "Човечки Ресурси" },
  { value: "Design", label: "Дизајн" },
  { value: "Management", label: "Менаџмент" },
  { value: "Production", label: "Производство" },
  { value: "Legal", label: "Право" },
  { value: "Cleaning", label: "Хигиена" },
];

interface JobsSearchBarProps {
  initialSearch?: string;
}

export default function JobsSearchBar({ initialSearch = "" }: JobsSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [category, setCategory] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [results, setResults] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const isSearchActive = searchQuery.trim() !== "" || category !== "" || locationQuery.trim() !== "" || remoteOnly;

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
      if (locationQuery.trim()) params.append("location", locationQuery.trim());
      if (remoteOnly) params.append("remote", "true");
      params.append("limit", "30");

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, category, locationQuery, remoteOnly, isSearchActive]);

  // Debounced search on input changes
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
    setLocationQuery("");
    setRemoteOnly(false);
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="mb-8">
      {/* Search Bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Пребарај огласи</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Позиција, компанија, вештини..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-sm text-foreground placeholder-muted-foreground outline-none transition-all"
            />
          </div>

          {/* Category dropdown */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 pl-3 pr-8 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-sm text-foreground outline-none transition-all appearance-none cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Локација..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-sm text-foreground placeholder-muted-foreground outline-none transition-all"
            />
          </div>

          {/* Remote toggle + Clear */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground select-none">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="w-4 h-4 rounded border-border bg-input accent-[#2DD4BF]"
              />
              <Globe className="w-4 h-4 text-[#2DD4BF]" />
              Remote
            </label>
            {isSearchActive && (
              <button
                onClick={clearSearch}
                className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
              <div className="space-y-3">
                {results.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Search className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">Нема пронајдени огласи</p>
              <p className="text-sm text-muted-foreground">
                Обидете се со различни клучни зборови или филтри.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
