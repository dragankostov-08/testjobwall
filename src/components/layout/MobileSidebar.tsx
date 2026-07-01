"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, Home, Monitor, TrendingUp, DollarSign, PieChart, Palette, Globe, GraduationCap, 
  Bookmark, Settings, Info, Briefcase, Users, ClipboardList, Truck, Factory, 
  Wrench, Coffee, Scale, HeartPulse, Sparkles, MoreHorizontal, Newspaper, Clock
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TOP_LINKS = [
  { name: 'ОГЛАСИ', href: '/', color: 'bg-blue-500 hover:bg-blue-600' },
  { name: 'ВЕСТИ', href: '/news', color: 'bg-amber-500 hover:bg-amber-600 text-black' },
  { name: 'ИНДЕКС', href: '/market-pulse', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { name: 'АЛАТКИ', href: '/tools', color: 'bg-purple-500 hover:bg-purple-600' },
];

const CATEGORIES = [
  { name: 'Најнови', icon: Clock, href: '/latest' },
  { name: 'IT', icon: Monitor, href: '/category/it' },
  { name: 'Дизајн', icon: Palette, href: '/category/design' },
  { name: 'Маркетинг', icon: TrendingUp, href: '/category/marketing' },
  { name: 'Продажба', icon: DollarSign, href: '/category/sales' },
  { name: 'Менаџмент', icon: Briefcase, href: '/category/management' },
  { name: 'Човечки Ресурси', icon: Users, href: '/category/hr' },
  { name: 'Финансии', icon: PieChart, href: '/category/finance' },
  { name: 'Администрација', icon: ClipboardList, href: '/category/admin' },
  { name: 'Логистика', icon: Truck, href: '/category/logistics' },
  { name: 'Производство', icon: Factory, href: '/category/production' },
  { name: 'Инженерство', icon: Wrench, href: '/category/engineering' },
  { name: 'Угостителство', icon: Coffee, href: '/category/hospitality' },
  { name: 'Право', icon: Scale, href: '/category/legal' },
  { name: 'Здравство', icon: HeartPulse, href: '/category/healthcare' },
  { name: 'Хигиена', icon: Sparkles, href: '/category/cleaning' },
  { name: 'Останати', icon: MoreHorizontal, href: '/category/other' },
  { name: 'Далечински работи', icon: Globe, href: '/category/remote' },
  { name: 'Пракса', icon: GraduationCap, href: '/internships' },
  { name: 'Компании', icon: Briefcase, href: '/companies' },
];

const ACTIONS = [
  { name: 'Зачувани', icon: Bookmark, href: '/saved' },
  { name: 'Преференции', icon: Settings, href: '/preferences' },
];

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
        <Menu className="w-6 h-6" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 border-r-border bg-background">
        <div className="py-6 flex flex-col h-full overflow-y-auto">
          <div className="mb-6 px-4">
            <span className="font-bold text-xl tracking-tight text-foreground">JOBWALL</span>
          </div>

          {/* Top Prominent Pills */}
          <div className="px-4 grid grid-cols-2 gap-2 mb-6">
            {TOP_LINKS.map((link) => (
              <Link 
                key={link.name}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-center py-2 px-3 rounded-full text-sm font-bold text-white transition-colors ${link.color}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Main Links */}
          <nav className="flex flex-col">
            {CATEGORIES.map((cat) => (
              <Link 
                key={cat.name} 
                href={cat.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-4 px-4 py-3.5 text-sm font-medium text-foreground hover:bg-accent border-b border-border/40 transition-colors"
              >
                <cat.icon className="w-5 h-5 text-muted-foreground" />
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className="my-2" />

          <nav className="flex flex-col">
            {ACTIONS.map((action) => (
              <Link 
                key={action.name} 
                href={action.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-4 px-4 py-3.5 text-sm font-medium text-foreground hover:bg-accent border-b border-border/40 transition-colors"
              >
                <action.icon className="w-5 h-5 text-muted-foreground" />
                {action.name}
              </Link>
            ))}
            <Link href="/about" onClick={() => setOpen(false)} className="flex items-center gap-4 px-4 py-3.5 text-sm font-medium text-foreground hover:bg-accent border-b border-border/40 transition-colors">
              <Info className="w-5 h-5 text-muted-foreground" />
              За Jobwall
            </Link>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
