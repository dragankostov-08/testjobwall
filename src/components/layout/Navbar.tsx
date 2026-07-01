"use client";

import Link from "next/link";
import { Search, Menu, TrendingUp } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isNews = pathname.startsWith("/news");
  const isCompanies = pathname.startsWith("/companies");
  const isTools = pathname.startsWith("/tools");
  const isMarketPulse = pathname.startsWith("/market-pulse");
  const isJobs = !isNews && !isCompanies && !isTools && !isMarketPulse;
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;

    if (isNews) {
      router.push(`/news?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push(`/?search=${encodeURIComponent(trimmed)}`);
    }
    setSearchValue("");
  };

  return (
    <header className="w-full flex flex-col font-sans border-b border-border shadow-sm bg-background print:hidden">
      {/* Top Row: Logo, Search */}
      <div className="max-w-[1200px] mx-auto w-full px-4 h-20 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex-1 flex justify-start">
          <Link href="/" className="text-4xl md:text-5xl font-bold tracking-tight text-foreground flex items-baseline hover:opacity-90 transition-opacity">
            JOBWALL<span className="text-2xl ml-0.5">.mk</span>
          </Link>
        </div>

        {/* Right: Search */}
        <div className="flex-1 flex items-center justify-end gap-4">
          <form onSubmit={handleSearch} className="hidden md:flex relative w-48 lg:w-64">
            <input 
              type="text" 
              placeholder="Барај..." 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full h-9 pl-3 pr-8 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-sm text-foreground placeholder-muted-foreground outline-none transition-all"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
              <Search className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          </form>
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Middle Row: Primary Nav */}
      <div className="bg-card border-t border-b border-border">
        <div className="max-w-[1200px] mx-auto w-full px-4 flex flex-wrap items-center text-sm font-medium">
          <Link 
            href="/" 
            className={`px-6 py-2.5 tracking-wide transition-colors ${isJobs && pathname === "/" ? "bg-primary text-primary-foreground hover:opacity-90" : "text-foreground hover:text-primary"}`}
          >
            ОГЛАСИ
          </Link>
          <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
          <Link 
            href="/latest" 
            className={`px-5 py-2.5 transition-colors flex items-center gap-1 ${pathname === "/latest" ? "bg-blue-500 text-white font-bold" : "text-foreground hover:text-primary"}`}
          >
            Најнови
          </Link>
          <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
          <Link 
            href="/companies" 
            className={`px-5 py-2.5 transition-colors ${isCompanies ? "bg-primary text-primary-foreground hover:opacity-90" : "text-foreground hover:text-primary"}`}
          >
            Компании
          </Link>
          <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
          <Link href="/internships" className="px-5 py-2.5 text-foreground hover:text-primary transition-colors">
            Пракса
          </Link>
          <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
          <Link 
            href="/news" 
            className={`px-5 py-2.5 tracking-wide transition-colors ${isNews ? "bg-amber-500 text-black font-bold" : "text-foreground hover:text-primary"}`}
          >
            ВЕСТИ
          </Link>
          <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
          <Link 
            href="/tools" 
            className={`px-5 py-2.5 transition-colors ${isTools ? "bg-primary text-primary-foreground hover:opacity-90" : "text-foreground hover:text-primary"}`}
          >
            Алатки
          </Link>
          <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
          <Link 
            href="/market-pulse" 
            className={`px-5 py-2.5 transition-colors flex items-center gap-1 ${isMarketPulse ? "bg-emerald-500 text-white font-bold" : "text-foreground hover:text-primary"}`}
          >
            ИНДЕКС
          </Link>
        </div>
      </div>

      {/* Bottom Row: Secondary Nav */}
      <div className="bg-background border-b border-border">
        <div className="max-w-[1200px] mx-auto w-full px-4 flex flex-wrap items-center text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {isNews ? (
            <>
              <Link href="/news" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Сите</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/news?category=hiring" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Вработување</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/news?category=salary" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Финансии</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/news?category=market" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Економија</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/news?category=tech" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Технологија</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/news?category=remote" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Далечински</Link>
            </>
          ) : isTools ? (
            <>
              <Link href="/tools" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Сите алатки</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/tools/salary-calculator" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Плата</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/tools/salary-comparison" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Споредба</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/tools/cv-checker" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">ATS CV</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/tools/experience-calculator" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Искуство</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/tools/hourly-rate-calculator" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Саатнина</Link>
            </>
          ) : (
            <>
              <Link href="/category/it" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">ИТ</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/category/marketing" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Маркетинг</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/category/sales" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Продажба</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/category/finance" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Финансии</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/category/engineering" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Инженерство</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/category/admin" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Администрација</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/category/hospitality" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Угостителство</Link>
              <div className="h-3 w-px bg-border hidden sm:block"></div>
              <Link href="/category/healthcare" className="px-4 py-2.5 hover:text-foreground hover:bg-accent/50 transition-colors">Здравство</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
