import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import JobCard, { Job } from "@/components/jobs/JobCard";
import NewsCard, { NewsArticle } from "@/components/news/NewsCard";
import { ChevronLeft, MapPin, Briefcase, Calendar, BarChart3, Building2 } from "lucide-react";
import type { Metadata } from "next";

interface CompanyData {
  name: string;
  slug: string;
  logo: string | null;
  location: string;
  industry: string;
  jobCount: number;
  latestJobDate: string;
  topCategories: { name: string; count: number }[];
  jobs: Job[];
  similarCompanies: { name: string; slug: string; logo: string | null; jobCount: number }[];
}

async function fetchCompany(slug: string): Promise<CompanyData | null> {
  try {
    const host = (await headers()).get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const res = await fetch(`${protocol}://${host}/api/companies/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchRelatedNews(companyName: string): Promise<NewsArticle[]> {
  try {
    const host = (await headers()).get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const res = await fetch(
      `${protocol}://${host}/api/news?search=${encodeURIComponent(companyName)}&limit=4`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const company = await fetchCompany(slug);
  if (!company) return { title: "Компанија - JOBWALL" };
  return {
    title: `${company.name} - Огласи за работа | JOBWALL`,
    description: `Погледнете ги сите ${company.jobCount} активни огласи за работа од ${company.name}. ${company.industry} - ${company.location}.`,
  };
}

export default async function CompanyDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const company = await fetchCompany(slug);

  if (!company) {
    notFound();
  }

  const relatedNews = await fetchRelatedNews(company.name);

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Back link */}
      <Link
        href="/companies"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Назад кон компании
      </Link>

      {/* Company Header */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <div className="flex gap-5 items-start">
          <Avatar className="w-20 h-20 border border-border rounded-md shrink-0 bg-background">
            {company.logo && (
              <AvatarImage src={company.logo} alt={company.name} className="object-contain p-1.5 bg-white" />
            )}
            <AvatarFallback className="rounded-md bg-secondary text-secondary-foreground font-semibold text-2xl">
              {company.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {company.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {company.jobCount} активни огласи
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                {company.industry}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 rounded-full bg-blue-500" />
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold text-foreground tracking-tight">Статистика</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{company.jobCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Активни огласи</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {new Date(company.latestJobDate).toLocaleDateString("mk-MK", { day: "numeric", month: "short" })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Последен оглас</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center sm:col-span-1 col-span-2">
            <p className="text-2xl font-bold text-foreground">{company.topCategories.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Категории</p>
          </div>
        </div>
        {company.topCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {company.topCategories.map((cat) => (
              <span key={cat.name} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                {cat.name} ({cat.count})
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Active Jobs */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 rounded-full bg-emerald-500" />
          <Briefcase className="w-5 h-5 text-emerald-500" />
          <h2 className="text-xl font-bold text-foreground tracking-tight">Активни Огласи</h2>
        </div>
        <div className="space-y-3">
          {company.jobs.map((job: Job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>

      {/* Related News */}
      {relatedNews.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 rounded-full bg-amber-500" />
            <Calendar className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-foreground tracking-tight">Поврзани Вести</h2>
          </div>
          <div className="space-y-3">
            {relatedNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Similar Companies */}
      {company.similarCompanies.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 rounded-full bg-violet-500" />
            <Building2 className="w-5 h-5 text-violet-500" />
            <h2 className="text-xl font-bold text-foreground tracking-tight">Слични Компании</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {company.similarCompanies.map((sim) => (
              <Link
                key={sim.name}
                href={`/companies/${sim.slug}`}
                className="group flex items-center gap-3 bg-card hover:bg-accent border border-border rounded-lg p-3 transition-colors"
              >
                <Avatar className="w-10 h-10 border border-border rounded-md shrink-0 bg-background">
                  {sim.logo && (
                    <AvatarImage src={sim.logo} alt={sim.name} className="object-contain p-1 bg-white" />
                  )}
                  <AvatarFallback className="rounded-md bg-secondary text-secondary-foreground font-semibold">
                    {sim.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:underline truncate">{sim.name}</p>
                  <p className="text-xs text-muted-foreground">{sim.jobCount} огласи</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
