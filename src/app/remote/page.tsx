import { Job } from "@/components/jobs/JobCard";
import JobCard from "@/components/jobs/JobCard";
import { headers } from "next/headers";
import Link from "next/link";
import { ChevronLeft, Globe } from "lucide-react";

async function fetchRemoteJobs(): Promise<Job[]> {
  try {
    const host = (await headers()).get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    
    const params = new URLSearchParams();
    params.append("remote", "true");
    params.append("limit", "100");
    
    const url = `${protocol}://${host}/api/jobs?${params.toString()}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch remote jobs:", error);
    return [];
  }
}

export default async function RemoteJobsPage() {
  const jobs = await fetchRemoteJobs();

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
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Далечинска работа (Remote)
          </h1>
        </div>
        <p className="text-muted-foreground mt-2">
          {jobs.length} активни далечински огласи
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
          <p className="text-muted-foreground">Нема активни далечински огласи во моментов.</p>
        </div>
      )}
    </div>
  );
}
