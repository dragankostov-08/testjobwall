"use client";

import { useState } from "react";
import Link from "next/link";
import { DollarSign, ChevronLeft } from "lucide-react";

export default function HourlyRateCalculatorPage() {
  const [monthlySalary, setMonthlySalary] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");
  const [result, setResult] = useState<{ hourly: number; daily: number; weekly: number } | null>(null);

  const handleCalculate = () => {
    const salary = parseFloat(monthlySalary);
    const hours = parseFloat(hoursPerWeek);
    if (isNaN(salary) || isNaN(hours) || salary <= 0 || hours <= 0) return;

    const weeksPerMonth = 4.33;
    const totalMonthlyHours = hours * weeksPerMonth;
    const hourly = salary / totalMonthlyHours;
    const daily = hourly * (hours / 5);
    const weekly = hourly * hours;

    setResult({
      hourly: Math.round(hourly * 100) / 100,
      daily: Math.round(daily * 100) / 100,
      weekly: Math.round(weekly * 100) / 100,
    });
  };

  const formatMKD = (n: number) => n.toLocaleString("mk-MK", { minimumFractionDigits: 2 }) + " ден.";

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/tools" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Назад кон алатки
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-6 h-6 text-pink-500" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Калкулатор за Саатнина</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Месечна плата (ден.)</label>
            <input type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} placeholder="пр. 30000" className="w-full h-11 px-4 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground placeholder-muted-foreground outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Работни часови неделно</label>
            <input type="number" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} className="w-full h-11 px-4 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground outline-none transition-all" />
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
              <p className="text-2xl font-bold text-foreground">{formatMKD(result.hourly)}</p>
              <p className="text-xs text-muted-foreground mt-1">Саатнина</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatMKD(result.daily)}</p>
              <p className="text-xs text-muted-foreground mt-1">Дневница</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatMKD(result.weekly)}</p>
              <p className="text-xs text-muted-foreground mt-1">Неделна</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
