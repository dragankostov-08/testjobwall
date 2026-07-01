import { Job } from "@/components/jobs/JobCard";
import JobCard from "@/components/jobs/JobCard";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { getJobs } from "@/lib/data/jobs";
import LoadMoreJobs from "@/components/jobs/LoadMoreJobs";
import { fetchMoreJobs } from "@/app/actions/jobActions";

export const revalidate = 60;

function getDbCategory(slug: string): string {
  if (slug === 'remote') return '';
  const map: Record<string, string> = {
    'it': 'IT', 'design': 'Design', 'marketing': 'Marketing', 'sales': 'Sales',
    'hr': 'HR', 'finance': 'Finance', 'admin': 'Admin', 'management': 'Management',
    'logistics': 'Logistics', 'production': 'Production', 'engineering': 'Engineering',
    'hospitality': 'Hospitality', 'legal': 'Legal', 'healthcare': 'Healthcare',
    'cleaning': 'Cleaning', 'other': 'Останато'
  };
  return map[slug] || slug;
}

async function fetchCategoryJobs(category: string, dbCategory: string): Promise<Job[]> {
  if (category === 'remote') {
    return (await getJobs({ remote: true, limit: 50 })) || [];
  }
  return (await getJobs({ category: dbCategory, limit: 50 })) || [];
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  
  const validSlugs = [
    'it', 'design', 'marketing', 'sales', 'hr', 'finance', 'admin', 
    'management', 'logistics', 'production', 'engineering', 'hospitality', 
    'legal', 'healthcare', 'cleaning', 'remote', 'other'
  ];
  if (!validSlugs.includes(slug)) {
    notFound();
  }

  const dbCategory = getDbCategory(slug);
  const jobs = await fetchCategoryJobs(slug, dbCategory);
  
  const titleMap: Record<string, string> = {
    'it': 'IT Огласи',
    'design': 'Дизајн Огласи',
    'marketing': 'Маркетинг Огласи',
    'sales': 'Продажба Огласи',
    'hr': 'Човечки Ресурси Огласи',
    'finance': 'Финансии Огласи',
    'admin': 'Администрација Огласи',
    'management': 'Менаџмент Огласи',
    'logistics': 'Логистика и Транспорт Огласи',
    'production': 'Производство Огласи',
    'engineering': 'Инженерство и Одржување Огласи',
    'hospitality': 'Угостителство Огласи',
    'legal': 'Право Огласи',
    'healthcare': 'Здравство Огласи',
    'cleaning': 'Хигиена Огласи',
    'remote': 'Далечински работи',
    'other': 'Останати Огласи'
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Назад кон почетна
        </Link>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          {titleMap[slug]}
        </h1>
        <p className="text-muted-foreground mt-2">
          {jobs.length} активни огласи во оваа категорија
        </p>
      </div>
      
      {jobs.length > 0 ? (
        <>
          <div className="space-y-4">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          <LoadMoreJobs
            fetchAction={fetchMoreJobs}
            params={slug === 'remote' ? { remote: true, limit: 50 } : { category: dbCategory, limit: 50 }}
            initialJobsLength={jobs.length}
          />
        </>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">Нема активни огласи во оваа категорија во моментов.</p>
        </div>
      )}
    </div>
  );
}
