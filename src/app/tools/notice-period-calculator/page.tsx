"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft } from "lucide-react";

export default function NoticePeriodCalculatorPage() {
  const [noticeDate, setNoticeDate] = useState("");
  const [periodValue, setPeriodValue] = useState("");
  const [periodUnit, setPeriodUnit] = useState<"days" | "months">("months");
  const [result, setResult] = useState<{ lastDay: Date } | null>(null);

  const handleCalculate = () => {
    if (!noticeDate || !periodValue) return;
    const start = new Date(noticeDate);
    const value = parseInt(periodValue);
    if (isNaN(value) || value <= 0) return;

    const lastDay = new Date(start);
    if (periodUnit === "months") {
      lastDay.setMonth(lastDay.getMonth() + value);
    } else {
      lastDay.setDate(lastDay.getDate() + value);
    }

    setResult({ lastDay });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/tools" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Назад кон алатки
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="w-6 h-6 text-red-500" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Калкулатор за Отказен Рок</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Датум на отказ</label>
            <input
              type="date"
              value={noticeDate}
              onChange={(e) => setNoticeDate(e.target.value)}
              className="w-full h-11 px-4 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Отказен рок</label>
              <input
                type="number"
                value={periodValue}
                onChange={(e) => setPeriodValue(e.target.value)}
                placeholder="пр. 1"
                className="w-full h-11 px-4 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground placeholder-muted-foreground outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Единица</label>
              <select
                value={periodUnit}
                onChange={(e) => setPeriodUnit(e.target.value as "days" | "months")}
                className="w-full h-11 pl-3 pr-8 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="months">Месеци</option>
                <option value="days">Денови</option>
              </select>
            </div>
          </div>

          <button onClick={handleCalculate} className="w-full h-11 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
            Пресметај
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Последен работен ден</p>
          <p className="text-3xl font-bold text-foreground">
            {result.lastDay.toLocaleDateString("mk-MK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      )}
    </div>
  );
}
