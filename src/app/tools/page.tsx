import Link from "next/link";
import {
  Calculator, BarChart3, FileCheck, CalendarDays, Palmtree,
  Clock, DollarSign, FileText, Wrench
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Кариерни Алатки - JOBWALL",
  description: "Бесплатни кариерни алатки: калкулатор за плата, споредба на плати, ATS проверка на CV, калкулатор за искуство и повеќе.",
};

const TOOLS = [
  {
    title: "Калкулатор за Плата",
    description: "Пресметај нето од бруто и обратно, со сите даноци и придонеси.",
    href: "/tools/salary-calculator",
    icon: Calculator,
    color: "#3b82f6",
  },
  {
    title: "Споредба на Плати",
    description: "Спореди ја твојата плата со пазарот по позиција и искуство.",
    href: "/tools/salary-comparison",
    icon: BarChart3,
    color: "#8b5cf6",
  },
  {
    title: "ATS Проверка на CV",
    description: "Анализирај го твоето CV за ATS компатибилност и добиј предлози.",
    href: "/tools/cv-checker",
    icon: FileCheck,
    color: "#10b981",
  },
  {
    title: "Калкулатор за Отказен Рок",
    description: "Пресметај го последниот работен ден според отказниот рок.",
    href: "/tools/notice-period-calculator",
    icon: CalendarDays,
    color: "#ef4444",
  },
  {
    title: "Калкулатор за Годишен Одмор",
    description: "Пресметај ги преостанатите денови од годишен одмор.",
    href: "/tools/vacation-calculator",
    icon: Palmtree,
    color: "#06b6d4",
  },
  {
    title: "Калкулатор за Искуство",
    description: "Пресметај го вкупното работно искуство во години, месеци и денови.",
    href: "/tools/experience-calculator",
    icon: Clock,
    color: "#f59e0b",
  },
  {
    title: "Калкулатор за Саатнина",
    description: "Пресметај саатнина, дневница и неделна заработка.",
    href: "/tools/hourly-rate-calculator",
    icon: DollarSign,
    color: "#ec4899",
  },
  {
    title: "Време за Читање на CV",
    description: "Провери колку време е потребно за читање на твоето CV.",
    href: "/tools/resume-reading-time",
    icon: FileText,
    color: "#14b8a6",
  },
];

export default function ToolsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Wrench className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Кариерни Алатки
          </h1>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Бесплатни алатки за пресметка на плата, анализа на CV, планирање на кариера и повеќе.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group block bg-card hover:bg-accent border border-border rounded-lg p-5 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: tool.color + '15' }}
              >
                <tool.icon className="w-5 h-5" style={{ color: tool.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-foreground group-hover:underline">
                  {tool.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {tool.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
