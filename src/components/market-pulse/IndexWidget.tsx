"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";

type MarketData = {
  snapshot: {
    newJobs: number; prevNewJobs: number; activeJobs: number;
    newCompanies: number; activeCompanies: number; newNews: number;
    remoteJobs: number; salaryJobs: number; totalSources: number; avgJobsPerDay: number;
  };
  jobWallIndex: { score: number; status: string; growthMod: number };
};

function SplitGauge({ title, val1, val2 }: { title: string, val1: number | string, val2: number | string }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <h3 className="text-[11px] font-semibold text-slate-300 mb-3 uppercase tracking-wider">{title}</h3>
      <div className="relative w-[60px] h-[60px]">
        {/* Background circle */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle cx="30" cy="30" r="26" stroke="#334155" strokeWidth="5" fill="transparent" />
          {/* Top-Left Arc (Orange) - approx 40% of circle */}
          <circle cx="30" cy="30" r="26" stroke="#f97316" strokeWidth="5" fill="transparent"
            strokeDasharray="163.3"
            strokeDashoffset="98" 
            strokeLinecap="round"
          />
          {/* Diagonal Line */}
          <line x1="30" y1="12" x2="12" y2="48" stroke="#475569" strokeWidth="1.5" transform="rotate(-45 30 30)" />
        </svg>
        <div className="absolute inset-0 flex flex-col justify-between py-[12px] px-[12px]">
          <span className="text-orange-500 font-bold text-[13px] self-start leading-none -mt-1">{val1}</span>
          <span className="text-emerald-500 font-bold text-[13px] self-end leading-none -mb-1">{val2}</span>
        </div>
      </div>
    </div>
  );
}

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
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 flex items-center justify-center min-h-[140px] mb-8">
        <Activity className="w-6 h-6 text-slate-500 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return null; 
  }

  const { snapshot, jobWallIndex } = data;

  return (
    <Link href="/market-pulse" className="block group mb-8">
      <div className="bg-[#0f172a] border border-slate-800/60 rounded-xl p-5 md:p-6 hover:border-slate-700 transition-colors">
        <div className="flex flex-wrap items-center justify-around gap-6">
          <SplitGauge title="ИНДЕКС" val1={jobWallIndex.score} val2={jobWallIndex.growthMod || 11} />
          <SplitGauge title="НОВИ ОГЛАСИ" val1={snapshot.newJobs} val2={snapshot.prevNewJobs} />
          <SplitGauge title="КОМПАНИИ" val1={snapshot.activeCompanies} val2={snapshot.newCompanies} />
          <SplitGauge title="БАЗА ОГЛАСИ" val1={snapshot.activeJobs} val2={snapshot.remoteJobs} />
          <SplitGauge title="ПЛАТА" val1={snapshot.salaryJobs} val2="-" />
        </div>
      </div>
    </Link>
  );
}
