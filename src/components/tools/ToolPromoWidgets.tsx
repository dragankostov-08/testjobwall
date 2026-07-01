"use client";

import Link from "next/link";
import { Calculator, Calendar, ArrowRight } from "lucide-react";

export function SalaryCalculatorPromo() {
  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/10 border border-indigo-500/20 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Calculator className="w-40 h-40 rotate-12" />
      </div>
      
      <div className="flex items-start gap-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Calculator className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Калкулатор за Плата</h3>
          <p className="text-sm text-muted-foreground max-w-lg">
            Пресметајте ја вашата нето или бруто плата во секунда. Вклучува детални пресметки за придонеси и даноци според најновите закони.
          </p>
        </div>
      </div>
      
      <Link href="/tools/salary-calculator" className="shrink-0 relative z-10">
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
          Пресметај сега
          <ArrowRight className="w-4 h-4" />
        </button>
      </Link>
    </div>
  );
}

export function VacationCalculatorPromo() {
  return (
    <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/10 border border-emerald-500/20 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Calendar className="w-40 h-40 -rotate-12" />
      </div>
      
      <div className="flex items-start gap-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Calendar className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Калкулатор за Годишен Одмор</h3>
          <p className="text-sm text-muted-foreground max-w-lg">
            Откријте точно колку денови годишен одмор ви следуваат врз основа на вашето искуство, образование и услови за работа.
          </p>
        </div>
      </div>
      
      <Link href="/tools/vacation-calculator" className="shrink-0 relative z-10">
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
          Провери денови
          <ArrowRight className="w-4 h-4" />
        </button>
      </Link>
    </div>
  );
}
