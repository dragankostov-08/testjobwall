"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, Briefcase, Building2, MonitorSmartphone, DollarSign } from "lucide-react";

type MarketData = {
  snapshot: {
    newJobs: number; prevNewJobs: number; activeJobs: number;
    newCompanies: number; activeCompanies: number; newNews: number;
    remoteJobs: number; salaryJobs: number; totalSources: number; avgJobsPerDay: number;
  };
  jobWallIndex: { score: number; status: string; growthMod: number };
};

export default function IndexWidget() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/market-pulse?range=7d`);
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError("Грешка при вчитување");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-center min-h-[160px] mb-6">
        <Activity className="w-6 h-6 text-primary animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return null; // Silently fail on homepage if index is down
  }

  const { snapshot, jobWallIndex } = data;

  return (
    <Link href="/market-pulse" className="block mb-6 group">
      <div className="bg-card border border-border hover:border-primary/50 transition-colors rounded-xl p-5 flex flex-col md:flex-row gap-6">
        
        {/* Index Gauge (Simplified) */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center md:border-r border-border md:pr-6">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">ИНДЕКС</h3>
          <div className="relative">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/20" />
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent"
                strokeDasharray="175.9"
                strokeDashoffset={175.9 - (175.9 * jobWallIndex.score) / 100}
                className={jobWallIndex.score > 70 ? "text-emerald-500" : jobWallIndex.score > 40 ? "text-amber-500" : "text-red-500"}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-bold text-foreground">{jobWallIndex.score}</span>
            </div>
          </div>
          <p className={`mt-2 text-xs font-bold ${jobWallIndex.score > 70 ? "text-emerald-500" : jobWallIndex.score > 40 ? "text-amber-500" : "text-red-500"}`}>
            {jobWallIndex.status}
          </p>
        </div>

        {/* KPIs */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Нови Огласи (7д)</span>
            </div>
            <div className="text-xl font-bold text-foreground">{snapshot.newJobs}</div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Активни Комп.</span>
            </div>
            <div className="text-xl font-bold text-foreground">{snapshot.activeCompanies}</div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
              <MonitorSmartphone className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Далечински</span>
            </div>
            <div className="text-xl font-bold text-foreground">{snapshot.remoteJobs}</div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Трансп. Плата</span>
            </div>
            <div className="text-xl font-bold text-foreground">{snapshot.salaryJobs}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
