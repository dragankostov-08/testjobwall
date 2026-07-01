"use client";

import { useState } from "react";
import Link from "next/link";
import { Palmtree, ChevronLeft } from "lucide-react";

export default function VacationCalculatorPage() {
  const [totalDays, setTotalDays] = useState("20");
  const [usedDays, setUsedDays] = useState("");
  const [startDate, setStartDate] = useState("");
  const [result, setResult] = useState<{ remaining: number; dailyRate: number; accumulated: number } | null>(null);

  const handleCalculate = () => {
    const total = parseInt(totalDays);
    const used = parseInt(usedDays) || 0;
    if (isNaN(total) || total <= 0) return;

    const remaining = Math.max(0, total - used);

    // Calculate daily accumulation rate
    const dailyRate = total / 365;

    // If start date provided, calculate accumulated days to today
    let accumulated = total;
    if (startDate) {
      const start = new Date(startDate);
      const today = new Date();
      const daysPassed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      accumulated = Math.min(total, Math.round(dailyRate * Math.max(0, daysPassed) * 100) / 100);
    }

    setResult({ remaining, dailyRate: Math.round(dailyRate * 1000) / 1000, accumulated: Math.round(accumulated * 10) / 10 });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/tools" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Назад кон алатки
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Palmtree className="w-6 h-6 text-cyan-500" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Калкулатор за Годишен Одмор</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Вкупно денови годишен одмор</label>
            <input type="number" value={totalDays} onChange={(e) => setTotalDays(e.target.value)} className="w-full h-11 px-4 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Искористени денови</label>
            <input type="number" value={usedDays} onChange={(e) => setUsedDays(e.target.value)} placeholder="0" className="w-full h-11 px-4 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground placeholder-muted-foreground outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Почеток на работен однос (опционално)</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-11 px-4 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground outline-none transition-all" />
          </div>
          <button onClick={handleCalculate} className="w-full h-11 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
            Пресметај
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-emerald-500">{result.remaining}</p>
              <p className="text-xs text-muted-foreground mt-1">Преостанати денови</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{result.accumulated}</p>
              <p className="text-xs text-muted-foreground mt-1">Акумулирани денови</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{result.dailyRate}</p>
              <p className="text-xs text-muted-foreground mt-1">Денови/ден</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
