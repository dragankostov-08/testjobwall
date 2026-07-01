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

  const { jobWallIndex } = data;

  return (
    <Link href="/market-pulse" className="block group">
      <div className="flex flex-col items-center justify-center">
        <h3 className="text-[13px] font-bold text-muted-foreground mb-3 uppercase tracking-widest">ИНДЕКС</h3>
        <div className="relative mb-3">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/20" />
            <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent"
              strokeDasharray="213.6"
              strokeDashoffset={213.6 - (213.6 * jobWallIndex.score) / 100}
              className={jobWallIndex.score > 70 ? "text-emerald-500" : jobWallIndex.score > 40 ? "text-amber-500" : "text-red-500"}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-2xl font-black text-foreground tracking-tighter">{jobWallIndex.score}</span>
          </div>
        </div>
        <p className={`text-sm font-black uppercase tracking-wide ${jobWallIndex.score > 70 ? "text-emerald-500" : jobWallIndex.score > 40 ? "text-amber-500" : "text-red-500"}`}>
          {jobWallIndex.status}
        </p>
      </div>
    </Link>
  );
}
