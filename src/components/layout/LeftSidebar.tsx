import Link from 'next/link';
import { 
  Home, Monitor, TrendingUp, ClipboardList, Coffee, Info, Newspaper 
} from 'lucide-react';

const CATEGORIES = [
  { name: 'IT', icon: Monitor, href: '/category/it', color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' },
  { name: 'Администрација', icon: ClipboardList, href: '/category/admin', color: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' },
  { name: 'Угостителство', icon: Coffee, href: '/category/hospitality', color: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' },
  { name: 'Маркетинг', icon: TrendingUp, href: '/category/marketing', color: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' },
];

export default function LeftSidebar() {
  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block border-r border-border h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
      <div className="py-6 flex flex-col h-full px-4">
        
        <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Популарни
        </div>
        <nav className="space-y-2 mb-6">
          {CATEGORIES.map((cat) => (
            <Link 
              key={cat.name} 
              href={cat.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all border border-transparent hover:border-border ${cat.color}`}
            >
              <cat.icon className="w-5 h-5" />
              {cat.name}
            </Link>
          ))}
        </nav>

        <div className="my-2 h-px bg-border mx-2" />

        <nav className="space-y-2 mt-4">
          <Link 
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl transition-all border border-border"
          >
            <Home className="w-5 h-5" />
            Почетна
          </Link>
          <Link 
            href="/news"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl transition-all border border-border"
          >
            <Newspaper className="w-5 h-5" />
            Вести
          </Link>
        </nav>

        <div className="mt-auto pt-6 pb-2">
          <Link href="/about" className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Info className="w-4 h-4" />
            За Jobwall
          </Link>
        </div>
      </div>
    </aside>
  );
}
