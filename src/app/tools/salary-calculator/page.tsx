"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, ChevronLeft, ArrowLeftRight } from "lucide-react";

// North Macedonia 2024/2025 tax rates
const TAX_RATES = {
  personalIncomeTax: 0.10,
  pension: 0.188,
  health: 0.075,
  additionalHealth: 0.005,
  employment: 0.012,
};

const TOTAL_CONTRIBUTIONS = TAX_RATES.pension + TAX_RATES.health + TAX_RATES.additionalHealth + TAX_RATES.employment;

function calculateGrossToNet(gross: number) {
  const contributions = gross * TOTAL_CONTRIBUTIONS;
  const taxableIncome = gross - contributions;
  const incomeTax = taxableIncome * TAX_RATES.personalIncomeTax;
  const net = gross - contributions - incomeTax;

  return {
    gross,
    net: Math.round(net),
    pension: Math.round(gross * TAX_RATES.pension),
    health: Math.round(gross * TAX_RATES.health),
    additionalHealth: Math.round(gross * TAX_RATES.additionalHealth),
    employment: Math.round(gross * TAX_RATES.employment),
    totalContributions: Math.round(contributions),
    incomeTax: Math.round(incomeTax),
  };
}

function calculateNetToGross(net: number) {
  // net = gross - gross*contributions - (gross - gross*contributions)*tax
  // net = gross * (1 - contributions) * (1 - tax)
  const factor = (1 - TOTAL_CONTRIBUTIONS) * (1 - TAX_RATES.personalIncomeTax);
  const gross = Math.round(net / factor);
  return calculateGrossToNet(gross);
}

export default function SalaryCalculatorPage() {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"grossToNet" | "netToGross">("grossToNet");
  const [result, setResult] = useState<ReturnType<typeof calculateGrossToNet> | null>(null);

  const handleCalculate = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;

    if (direction === "grossToNet") {
      setResult(calculateGrossToNet(value));
    } else {
      setResult(calculateNetToGross(value));
    }
  };

  const formatMKD = (n: number) => n.toLocaleString("mk-MK") + " ден.";

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/tools" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Назад кон алатки
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Калкулатор за Плата</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        {/* Direction toggle */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => { setDirection("grossToNet"); setResult(null); }}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${direction === "grossToNet" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}
          >
            Бруто → Нето
          </button>
          <ArrowLeftRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <button
            onClick={() => { setDirection("netToGross"); setResult(null); }}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${direction === "netToGross" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}
          >
            Нето → Бруто
          </button>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            {direction === "grossToNet" ? "Бруто плата (ден.)" : "Нето плата (ден.)"}
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Внеси износ..."
            className="w-full h-11 px-4 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-foreground placeholder-muted-foreground outline-none transition-all"
          />
        </div>

        <button
          onClick={handleCalculate}
          className="w-full h-11 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Пресметај
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Резултат</h2>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Бруто плата</span>
              <span className="text-sm font-semibold text-foreground">{formatMKD(result.gross)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Пензиско осигурување (18.8%)</span>
              <span className="text-sm text-destructive">-{formatMKD(result.pension)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Здравствено осигурување (7.5%)</span>
              <span className="text-sm text-destructive">-{formatMKD(result.health)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Доп. здравствено (0.5%)</span>
              <span className="text-sm text-destructive">-{formatMKD(result.additionalHealth)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Вработување (1.2%)</span>
              <span className="text-sm text-destructive">-{formatMKD(result.employment)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Данок на доход (10%)</span>
              <span className="text-sm text-destructive">-{formatMKD(result.incomeTax)}</span>
            </div>
            <div className="flex justify-between py-3 bg-secondary/30 rounded-md px-3 -mx-1">
              <span className="text-base font-bold text-foreground">Нето плата</span>
              <span className="text-base font-bold text-emerald-500">{formatMKD(result.net)}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            * Пресметката користи стапки за лично примање во Р. Северна Македонија (2024/2025).
          </p>
        </div>
      )}
    </div>
  );
}
