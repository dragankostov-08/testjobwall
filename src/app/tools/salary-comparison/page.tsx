"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, ChevronLeft } from "lucide-react";

// Estimated market salary ranges (monthly net MKD) by category and experience
const SALARY_DATA: Record<string, { junior: [number, number]; mid: [number, number]; senior: [number, number] }> = {
  "IT & Software": { junior: [25000, 40000], mid: [40000, 65000], senior: [65000, 120000] },
  "Маркетинг": { junior: [18000, 28000], mid: [28000, 45000], senior: [45000, 70000] },
  "Продажба": { junior: [18000, 25000], mid: [25000, 40000], senior: [40000, 65000] },
  "Финансии": { junior: [20000, 32000], mid: [32000, 50000], senior: [50000, 80000] },
  "Администрација": { junior: [16000, 22000], mid: [22000, 35000], senior: [35000, 50000] },
  "Инженерство": { junior: [22000, 35000], mid: [35000, 55000], senior: [55000, 90000] },
  "Здравство": { junior: [20000, 30000], mid: [30000, 50000], senior: [50000, 80000] },
  "Угостителство": { junior: [14000, 20000], mid: [20000, 30000], senior: [30000, 45000] },
  "Логистика": { junior: [16000, 24000], mid: [24000, 38000], senior: [38000, 55000] },
  "Дизајн": { junior: [20000, 32000], mid: [32000, 50000], senior: [50000, 75000] },
  "Менаџмент": { junior: [25000, 38000], mid: [38000, 60000], senior: [60000, 100000] },
  "Право": { junior: [22000, 35000], mid: [35000, 55000], senior: [55000, 85000] },
};

const CATEGORIES = Object.keys(SALARY_DATA);

function getExperienceLevel(years: number): "junior" | "mid" | "senior" {
  if (years < 3) return "junior";
  if (years < 7) return "mid";
  return "senior";
}

export default function SalaryComparisonPage() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [result, setResult] = useState<{ min: number; max: number; avg: number; level: string; percentile: number } | null>(null);

  const handleCompare = () => {
    const years = parseInt(experience);
    const currentSalary = parseInt(salary);
    if (isNaN(years) || isNaN(currentSalary) || currentSalary <= 0) return;

    const expLevel = getExperienceLevel(years);
    const data = SALARY_DATA[category];
    if (!data) return;

    const [min, max] = data[expLevel];
    const avg = Math.round((min + max) / 2);

    let percentile: number;
    if (currentSalary <= min) {
      percentile = Math.max(5, Math.round((currentSalary / min) * 25));
    } else if (currentSalary >= max) {
      percentile = Math.min(95, 75 + Math.round(((currentSalary - max) / max) * 25));
    } else {
      percentile = 25 + Math.round(((currentSalary - min) / (max - min)) * 50);
    }

    let level = "Просечно";
    if (percentile < 30) level = "Под просек";
    else if (percentile > 70) level = "Над просек";

    setResult({ min, max, avg, level, percentile });
  };

  const formatMKD = (n: number) => n.toLocaleString("mk-MK") + " ден.";

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/tools" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Назад кон алатки
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-violet-500" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Споредба на Плати</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Категорија</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 pl-3 pr-8 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground outline-none transition-all appearance-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Години искуство</label>
            <input
              type="number"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="пр. 3"
              className="w-full h-11 px-4 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground placeholder-muted-foreground outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Моментална нето плата (ден.)</label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="пр. 35000"
              className="w-full h-11 px-4 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground placeholder-muted-foreground outline-none transition-all"
            />
          </div>

          <button
            onClick={handleCompare}
            className="w-full h-11 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Спореди
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Резултат за {category}</h2>

          {/* Percentile bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>{formatMKD(result.min)}</span>
              <span>{formatMKD(result.avg)}</span>
              <span>{formatMKD(result.max)}</span>
            </div>
            <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="w-1/3 bg-red-500/30" />
                <div className="w-1/3 bg-yellow-500/30" />
                <div className="w-1/3 bg-emerald-500/30" />
              </div>
              <div
                className="absolute top-0 w-3 h-3 bg-foreground rounded-full border-2 border-background shadow"
                style={{ left: `calc(${Math.min(100, Math.max(0, result.percentile))}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Под просек</span>
              <span>Просечно</span>
              <span>Над просек</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Твоја позиција</span>
              <span className={`text-sm font-semibold ${result.level === "Над просек" ? "text-emerald-500" : result.level === "Под просек" ? "text-red-400" : "text-amber-400"}`}>
                {result.level}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Пазарен ранг (мин)</span>
              <span className="text-sm font-medium text-foreground">{formatMKD(result.min)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Пазарен просек</span>
              <span className="text-sm font-medium text-foreground">{formatMKD(result.avg)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Пазарен ранг (макс)</span>
              <span className="text-sm font-medium text-foreground">{formatMKD(result.max)}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            * Проценетите плати се базирани на јавно достапни податоци за пазарот на труд во Македонија. Вистинските плати може да варираат.
          </p>
        </div>
      )}
    </div>
  );
}
