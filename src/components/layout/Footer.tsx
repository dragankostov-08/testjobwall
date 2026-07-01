import Link from "next/link";
import { TrendingUp } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-8 bg-background border-t border-border print:hidden">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="bg-card border border-border rounded-xl p-6 md:p-8 text-center space-y-6 shadow-sm">
          <div className="text-xs text-muted-foreground leading-relaxed max-w-3xl mx-auto space-y-1.5">
            <p>Изборот и позициите на вестите и огласите на JOBWALL се одредуваат автоматски со компјутерска програма.</p>
            <p>Прикажаното време, или датум, се однесува на моментот кога веста или огласот биле внесени или освежени во JOBWALL.</p>
            <p>JOBWALL не презема никаква одговорност за веродостојноста на преземените информации.</p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-foreground font-medium">
              <Link href="/sources" className="hover:text-primary transition-colors">Извори</Link>
              <span className="text-border">-</span>
              <Link href="/indexing" className="hover:text-primary transition-colors">Услови за индексирање</Link>
              <span className="text-border">-</span>
              <Link href="/about" className="hover:text-primary transition-colors">Како работи JOBWALL?</Link>
              <span className="text-border">-</span>
              <Link href="/marketing" className="hover:text-primary transition-colors">Маркетинг</Link>
              <span className="text-border">-</span>
              <Link href="/blog" className="hover:text-primary transition-colors">Блог</Link>
              <span className="text-border">-</span>
              <Link href="/contact" className="hover:text-primary transition-colors">Контакт</Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-foreground font-medium">
              <Link href="/remote" className="hover:text-primary transition-colors">Далечинска работа</Link>
              <span className="text-border">-</span>
              <Link href="/internships" className="hover:text-primary transition-colors">Пракса</Link>
              <span className="text-border">-</span>
              <Link href="/news" className="hover:text-primary transition-colors">Кариерни вести</Link>
              <span className="text-border">-</span>
              <Link href="/companies" className="hover:text-primary transition-colors">Компании</Link>
              <span className="text-border">-</span>
              <Link href="/tools" className="hover:text-primary transition-colors">Алатки</Link>
              <span className="text-border">-</span>
              <Link href="/market-pulse" className="hover:text-primary transition-colors flex items-center gap-1">ИНДЕКС</Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-foreground font-medium">
              <Link href="/terms" className="hover:text-primary transition-colors">Услови за користење</Link>
              <span className="text-border">-</span>
              <Link href="/privacy" className="hover:text-primary transition-colors">Политика за приватност</Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-xs text-muted-foreground font-medium">
          &copy; {new Date().getFullYear()} JOBWALL.mk
        </div>
      </div>
    </footer>
  );
}
