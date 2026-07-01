"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ChevronLeft } from "lucide-react";

export default function ExperienceCalculatorPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [result, setResult] = useState<{ years: number; months: number; days: number; totalDays: number } | null>(null);

  const handleCalculate = () => {
    if (!startDate) return;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    if (end < start) return;

    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    setResult({ years, months, days, totalDays });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/tools" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Назад кон алатки
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-amber-500" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Калкулатор за Искуство</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Датум на почеток</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-11 px-4 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Датум на крај (празно = денес)</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-11 px-4 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground outline-none transition-all" />
          </div>
          <button onClick={handleCalculate} className="w-full h-11 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
            Пресметај
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <p className="text-3xl font-bold text-foreground">{result.years}</p>
              <p className="text-xs text-muted-foreground mt-1">Години</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{result.months}</p>
              <p className="text-xs text-muted-foreground mt-1">Месеци</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{result.days}</p>
              <p className="text-xs text-muted-foreground mt-1">Денови</p>
            </div>
          </div>
          <div className="text-center pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Вкупно: <span className="font-semibold text-foreground">{result.totalDays.toLocaleString("mk-MK")} денови</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
