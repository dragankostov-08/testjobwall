"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, Home, Monitor, TrendingUp, DollarSign, PieChart, Palette, Globe, GraduationCap, 
  Bookmark, Settings, Info, Briefcase, Users, ClipboardList, Truck, Factory, 
  Wrench, Coffee, Scale, HeartPulse, Sparkles, MoreHorizontal, Newspaper, Clock
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const CATEGORIES = [
  { name: 'Почетна', icon: Home, href: '/' },
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
  { name: 'Далечински работи', icon: Globe, href: '/remote' },
  { name: 'Пракса', icon: GraduationCap, href: '/internships' },
  { name: 'Компании', icon: Briefcase, href: '/companies' },
  { name: 'Вести', icon: Newspaper, href: '/news' },
  { name: 'Алатки', icon: Wrench, href: '/tools' },
  { name: 'ИНДЕКС', icon: TrendingUp, href: '/market-pulse' },
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
        <div className="py-6 flex flex-col h-full px-4 overflow-y-auto">
          <div className="mb-6 px-3">
            <span className="font-bold text-xl tracking-tight text-foreground">JOBWALL</span>
          </div>

          <nav className="space-y-1">
            {CATEGORIES.map((cat) => (
              <Link 
                key={cat.name} 
                href={cat.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <cat.icon className="w-5 h-5" />
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className="my-5 h-px bg-border mx-3" />

          <nav className="space-y-1">
            {ACTIONS.map((action) => (
              <Link 
                key={action.name} 
                href={action.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <action.icon className="w-5 h-5" />
                {action.name}
              </Link>
            ))}
          </nav>

          <div className="my-5 h-px bg-border mx-3" />

          <Link href="/about" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
            <Info className="w-5 h-5" />
            За Jobwall
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
