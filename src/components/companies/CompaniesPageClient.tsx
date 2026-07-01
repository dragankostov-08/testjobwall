"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Building2, ArrowUpDown, Loader2 } from "lucide-react";
import CompanyCard, { CompanyInfo } from "@/components/companies/CompanyCard";

const INDUSTRY_OPTIONS = [
  { value: "", label: "Сите индустрии" },
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
];

export default function CompaniesPageClient() {
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [sort, setSort] = useState<"jobs" | "name">("jobs");

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (industry) params.append("industry", industry);
      params.append("sort", sort);

      const res = await fetch(`/api/companies?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setLoading(false);
    }
  }, [search, industry, sort]);

  useEffect(() => {
    const timer = setTimeout(fetchCompanies, 300);
    return () => clearTimeout(timer);
  }, [fetchCompanies]);

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">


          {/* Industry filter */}
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-sm text-foreground outline-none transition-all appearance-none cursor-pointer"
          >
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Sort toggle */}
          <button
            onClick={() => setSort(sort === "jobs" ? "name" : "jobs")}
            className="h-10 px-4 rounded-md bg-input text-sm text-foreground flex items-center gap-2 hover:bg-accent transition-colors"
          >
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            {sort === "jobs" ? "По број на огласи" : "По име (А-Ш)"}
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : companies.length > 0 ? (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {companies.length} {companies.length === 1 ? "компанија" : "компании"}
          </p>
          <div className="space-y-3">
            {companies.map((company) => (
              <CompanyCard key={company.name} company={company} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">Нема пронајдени компании</p>
          <p className="text-sm text-muted-foreground">
            Обидете се со различно пребарување или филтер.
          </p>
        </div>
      )}
    </div>
  );
}
