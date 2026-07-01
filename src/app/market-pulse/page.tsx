"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  TrendingUp, Activity, Briefcase, Building2, MapPin, 
  MonitorSmartphone, DollarSign, Newspaper, ChevronDown, Download,
  BarChart as BarChartIcon
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

type MarketData = {
  snapshot: {
    newJobs: number; prevNewJobs: number; activeJobs: number;
    newCompanies: number; activeCompanies: number; newNews: number;
    remoteJobs: number; salaryJobs: number; totalSources: number; avgJobsPerDay: number;
  };
  dailyJobs: { date: string; jobs: number }[];
  categoryTrends: { name: string; jobs: number; growth: number }[];
  cityTrends: { name: string; jobs: number }[];
  companyInsights: { name: string; jobs: number }[];
  remoteInsights: { name: string; value: number }[];
  salaryInsights: {
    highest: number; lowest: number;
    byCategory: { name: string; avg: number }[];
  };
  newsInsights: { count: number; totalViews: number; trendingTopics: { name: string; count: number }[] };
  jobWallIndex: { score: number; status: string; growthMod: number };
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const PIE_COLORS = ['#8b5cf6', '#10b981', '#64748b'];

export default function MarketPulsePage() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d"); // 7d, 30d, this_month, last_month
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/market-pulse?range=${range}`);
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError("Грешка при вчитување на податоците. Обидете се повторно.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range]);

  const handleExportCSV = () => {
    if (!data) return;
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Category,Jobs,Growth\n" +
      data.categoryTrends.map(c => `${c.name},${c.jobs},${c.growth}%`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `market_pulse_${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-10 h-10 text-primary animate-pulse" />
          <p className="text-muted-foreground font-medium">Анализирање на пазарот...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-background">
        <p className="text-red-500">{error || "Нема податоци"}</p>
      </div>
    );
  }

  const { snapshot, dailyJobs, categoryTrends, cityTrends, companyInsights, remoteInsights, salaryInsights, newsInsights, jobWallIndex } = data;

  const topInsight = categoryTrends.length > 0 
    ? `${categoryTrends[0].name} индустријата води со ${categoryTrends[0].jobs} нови огласи овој период.`
    : "Пазарот е моментално стабилен.";

  return (
    <div className="min-h-screen bg-background pb-20 print:bg-white print:pb-0">
      <div className="max-w-[1400px] mx-auto px-4 pt-8">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground tracking-tight print:text-black">ИНДЕКС</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Интелигенција за пазарот на труд во реално време, базирана на податоци од JobWall.mk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="h-10 pl-4 pr-10 rounded-md border border-border bg-card text-sm font-medium outline-none cursor-pointer appearance-none"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="7d">Последни 7 дена</option>
              <option value="30d">Последни 30 дена</option>
              <option value="this_month">Овој месец</option>
              <option value="last_month">Претходен месец</option>
            </select>
            
            <button onClick={handleExportCSV} className="h-10 px-4 rounded-md border border-border bg-card text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={handlePrint} className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
              <BarChartIcon className="w-4 h-4" /> Извештај (PDF)
            </button>
          </div>
        </div>

        {/* Auto Insights Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8 flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Топ Влезна Информација</h3>
            <p className="text-sm text-muted-foreground mt-1">{topInsight}</p>
          </div>
        </div>

        {/* 1. JobWall Index & KPI Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Index Gauge */}
          <div className="lg:col-span-1 bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 opacity-20"></div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">JobWall Индекс</h3>
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/20" />
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent"
                  strokeDasharray="351.85"
                  strokeDashoffset={351.85 - (351.85 * jobWallIndex.score) / 100}
                  className={jobWallIndex.score > 70 ? "text-emerald-500" : jobWallIndex.score > 40 ? "text-amber-500" : "text-red-500"}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-4xl font-bold text-foreground">{jobWallIndex.score}</span>
              </div>
            </div>
            <p className={`mt-4 font-bold text-lg ${jobWallIndex.score > 70 ? "text-emerald-500" : jobWallIndex.score > 40 ? "text-amber-500" : "text-red-500"}`}>
              {jobWallIndex.status}
            </p>
          </div>

          {/* KPIs */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm font-medium">Нови Огласи</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{snapshot.newJobs}</div>
              <div className="text-xs font-medium text-emerald-500 bg-emerald-500/10 w-fit px-2 py-0.5 rounded">
                +{snapshot.avgJobsPerDay}/ден
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">Активни Компании</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{snapshot.activeCompanies}</div>
              <div className="text-xs font-medium text-muted-foreground">Вкупно на платформата</div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <MonitorSmartphone className="w-4 h-4" />
                <span className="text-sm font-medium">Далечински</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{snapshot.remoteJobs}</div>
              <div className="text-xs font-medium text-blue-500 bg-blue-500/10 w-fit px-2 py-0.5 rounded">
                Нови во периодот
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Транспарентна Плата</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{snapshot.salaryJobs}</div>
              <div className="text-xs font-medium text-emerald-500 bg-emerald-500/10 w-fit px-2 py-0.5 rounded">
                {Math.round((snapshot.salaryJobs / Math.max(1, snapshot.newJobs)) * 100)}% од новите
              </div>
            </div>
          </div>
        </div>

        {/* 2. Job Market Trends (Line Chart) */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-foreground mb-6">Тренд на Нови Огласи</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyJobs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={(val) => val.substring(5)} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="jobs" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorJobs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 3. Category Trends */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-6">Топ Индустрии</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryTrends} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--accent))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="jobs" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                    {categoryTrends.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. City Trends */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-6">Локации</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityTrends} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--accent))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="jobs" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* 6. Remote Work */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-6">Работна Околина</h3>
            <div className="h-[200px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={remoteInsights}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {remoteInsights.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {remoteInsights.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                    <span className="text-foreground">{item.name}</span>
                  </div>
                  <span className="font-bold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Salary Insights */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Анализа на Плати</h3>
              <div className="text-xs text-muted-foreground flex gap-4">
                <span>Мин: <strong className="text-foreground">{salaryInsights.lowest.toLocaleString()} ден.</strong></span>
                <span>Макс: <strong className="text-foreground">{salaryInsights.highest.toLocaleString()} ден.</strong></span>
              </div>
            </div>
            {salaryInsights.byCategory.length > 0 ? (
              <div className="space-y-4">
                {salaryInsights.byCategory.map((cat, idx) => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground font-medium">{cat.name}</span>
                      <span className="text-foreground font-bold">~{cat.avg.toLocaleString()} ден.</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${(cat.avg / salaryInsights.highest) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                Недоволно податоци за плати во овој период
              </div>
            )}
          </div>
        </div>

        {/* 5. Company & 8. News Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-xl p-0 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Најактивни Компании</h3>
            </div>
            <div className="p-0 overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Компанија</th>
                    <th className="px-6 py-3 font-medium text-right">Нови Огласи</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {companyInsights.slice(0, 8).map((comp) => (
                    <tr key={comp.name} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-3 text-foreground font-medium">{comp.name}</td>
                      <td className="px-6 py-3 text-foreground font-bold text-right">{comp.jobs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-0 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Кариерни Вести</h3>
              <div className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground mr-1">{newsInsights.count}</span> објави
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Топ Теми</h4>
                <div className="flex flex-wrap gap-2">
                  {newsInsights.trendingTopics.map(topic => (
                    <span key={topic.name} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full font-medium border border-border">
                      {topic.name} ({topic.count})
                    </span>
                  ))}
                  {newsInsights.trendingTopics.length === 0 && <span className="text-muted-foreground text-sm">Нема новости во овој период</span>}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Ангажираност</h4>
                <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  {newsInsights.totalViews.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">прегледи</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
