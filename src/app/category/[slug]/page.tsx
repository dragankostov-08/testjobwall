import { Job } from "@/components/jobs/JobCard";
import JobCard from "@/components/jobs/JobCard";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

async function fetchCategoryJobs(category: string): Promise<Job[]> {
  try {
    const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL || "localhost:3000";
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    
    const params = new URLSearchParams();
    if (category === 'remote') {
      params.append("remote", "true");
    } else {
      let dbCategory = category;
      if (category === 'it') dbCategory = "IT";
      if (category === 'design') dbCategory = "Design";
      if (category === 'marketing') dbCategory = "Marketing";
      if (category === 'sales') dbCategory = "Sales";
      if (category === 'hr') dbCategory = "HR";
      if (category === 'finance') dbCategory = "Finance";
      if (category === 'admin') dbCategory = "Admin";
      if (category === 'management') dbCategory = "Management";
      if (category === 'logistics') dbCategory = "Logistics";
      if (category === 'production') dbCategory = "Production";
      if (category === 'engineering') dbCategory = "Engineering";
      if (category === 'hospitality') dbCategory = "Hospitality";
      if (category === 'legal') dbCategory = "Legal";
      if (category === 'healthcare') dbCategory = "Healthcare";
      if (category === 'cleaning') dbCategory = "Cleaning";
      if (category === 'other') dbCategory = "Останато";
      
      params.append("category", dbCategory);
    }
    
    // Fetch up to 50 jobs for the category view
    params.append("limit", "50");
    
    const url = `${protocol}://${host}/api/jobs?${params.toString()}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch category jobs:", error);
    return [];
  }
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

  const jobs = await fetchCategoryJobs(slug);
  
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
        <div className="space-y-4">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">Нема активни огласи во оваа категорија во моментов.</p>
        </div>
      )}
    </div>
  );
}
