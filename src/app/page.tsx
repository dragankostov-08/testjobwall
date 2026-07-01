import CategoryBlock from "@/components/jobs/CategoryBlock";
import FeedSection from "@/components/jobs/FeedSection";
import JobsSearchBar from "@/components/jobs/JobsSearchBar";
import IndexWidget from "@/components/market-pulse/IndexWidget";
import { SalaryCalculatorPromo, VacationCalculatorPromo } from "@/components/tools/ToolPromoWidgets";
import { Job } from "@/components/jobs/JobCard";

import { Clock, TrendingUp, Globe, Star } from "lucide-react";

import { getJobs } from "@/lib/data/jobs";
export const revalidate = 60;

async function fetchJobs(category?: string, remote?: boolean, section?: string, limit?: number, source?: string): Promise<Job[]> {
  return (await getJobs({ category, remote, section, limit, source })) || [];
}

import SidebarNewsWidget from "@/components/layout/SidebarNewsWidget";
import TopHiringWidget from "@/components/layout/TopHiringWidget";

export default async function Home(
  props: { searchParams?: Promise<{ source?: string }> }
) {
  const searchParams = await props.searchParams;
  const source = searchParams?.source;

  const [
    // Feed sections
    featuredJobs, remoteTopJobs,
    // Category jobs
    itJobs, marketingJobs, salesJobs, financeJobs, adminJobs,
    engineeringJobs, healthcareJobs, hospitalityJobs, logisticsJobs,
    hrJobs, designJobs, managementJobs, productionJobs,
    legalJobs, cleaningJobs, otherJobs, remoteJobs,
  ] = await Promise.all([
    // Feed sections — Featured first
    fetchJobs(undefined, false, 'featured', 5, source),
    fetchJobs(undefined, true, undefined, 5, source),
    // Category jobs — organized by requested order
    fetchJobs('IT', undefined, undefined, undefined, source),
    fetchJobs('Marketing', undefined, undefined, undefined, source),
    fetchJobs('Sales', undefined, undefined, undefined, source),
    fetchJobs('Finance', undefined, undefined, undefined, source),
    fetchJobs('Admin', undefined, undefined, undefined, source),
    fetchJobs('Engineering', undefined, undefined, undefined, source),
    fetchJobs('Healthcare', undefined, undefined, undefined, source),
    fetchJobs('Hospitality', undefined, undefined, undefined, source),
    fetchJobs('Logistics', undefined, undefined, undefined, source),
    fetchJobs('HR', undefined, undefined, undefined, source),
    fetchJobs('Design', undefined, undefined, undefined, source),
    fetchJobs('Management', undefined, undefined, undefined, source),
    fetchJobs('Production', undefined, undefined, undefined, source),
    fetchJobs('Legal', undefined, undefined, undefined, source),
    fetchJobs('Cleaning', undefined, undefined, undefined, source),
    fetchJobs('Останато', undefined, undefined, undefined, source),
    fetchJobs(undefined, true, undefined, undefined, source),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Content (Left Column) */}
      <div className="lg:col-span-8">
        
        {source && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-indigo-500" />
              <p className="text-sm font-medium text-indigo-500">
                Прикажување огласи само од извор: <span className="font-bold">{source}</span>
              </p>
            </div>
            <a href="/" className="text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition-colors">
              Отстрани филтер
            </a>
          </div>
        )}

        {/* Search Bar */}
        <JobsSearchBar />

        {/* Featured Jobs — First */}
        <FeedSection
          title="Истакнати Огласи"
          icon={Star}
          color="#f59e0b"
          jobs={featuredJobs}
          maxJobs={5}
          hideTitle={true}
        />

        {/* Index Widget */}
        <IndexWidget />

        {/* Tool Promo 1 */}
        <SalaryCalculatorPromo />

        {/* Remote Jobs */}
        <FeedSection
          title="Далечински Работи"
          icon={Globe}
          color="#06b6d4"
          jobs={remoteTopJobs}
          viewMoreHref="/category/remote"
          maxJobs={5}
        />

        {/* Category Blocks — Organized by requested categories */}
        <CategoryBlock title="IT & Software" slug="it" color="#3b82f6" jobs={itJobs} />
        
        {/* Tool Promo 2 */}
        <VacationCalculatorPromo />

        <CategoryBlock title="Маркетинг" slug="marketing" color="#8b5cf6" jobs={marketingJobs} />
        <CategoryBlock title="Продажба" slug="sales" color="#10b981" jobs={salesJobs} />
        <CategoryBlock title="Финансии" slug="finance" color="#ef4444" jobs={financeJobs} />
        <CategoryBlock title="Администрација" slug="admin" color="#14b8a6" jobs={adminJobs} />
        <CategoryBlock title="Инженерство и Одржување" slug="engineering" color="#0ea5e9" jobs={engineeringJobs} />
        <CategoryBlock title="Здравство" slug="healthcare" color="#14b8a6" jobs={healthcareJobs} />
        <CategoryBlock title="Угостителство" slug="hospitality" color="#eab308" jobs={hospitalityJobs} />
        <CategoryBlock title="Логистика и Транспорт" slug="logistics" color="#f97316" jobs={logisticsJobs} />
        <CategoryBlock title="Човечки Ресурси" slug="hr" color="#f59e0b" jobs={hrJobs} />
        <CategoryBlock title="Дизајн" slug="design" color="#ec4899" jobs={designJobs} />
        <CategoryBlock title="Менаџмент" slug="management" color="#6366f1" jobs={managementJobs} />
        <CategoryBlock title="Производство" slug="production" color="#a855f7" jobs={productionJobs} />
        <CategoryBlock title="Право" slug="legal" color="#64748b" jobs={legalJobs} />
        <CategoryBlock title="Хигиена" slug="cleaning" color="#38bdf8" jobs={cleaningJobs} />
        <CategoryBlock title="Останати" slug="other" color="#94a3b8" jobs={otherJobs} />
        <CategoryBlock title="Далечински работи" slug="remote" color="#06b6d4" jobs={remoteJobs} />
      </div>

      {/* Right Rail (Widgets) */}
      <div className="lg:col-span-4 space-y-8 pt-2">
        <div>
          <SidebarNewsWidget />
          <div className="h-px bg-border my-8" />
          <TopHiringWidget />
        </div>
      </div>
    </div>
  );
}
