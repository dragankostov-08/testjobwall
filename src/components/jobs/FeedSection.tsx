import Link from "next/link";
import JobCard, { Job } from "./JobCard";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FeedSectionProps {
  title: string;
  icon: LucideIcon;
  color: string;
  jobs: Job[];
  viewMoreHref?: string;
  viewMoreLabel?: string;
  maxJobs?: number;
  hideTitle?: boolean;
}

export default function FeedSection({
  title,
  icon: Icon,
  color,
  jobs,
  viewMoreHref,
  viewMoreLabel = "Види повеќе",
  maxJobs = 5,
  hideTitle = false,
}: FeedSectionProps) {
  if (jobs.length === 0) return null;

  return (
    <section className="mb-10">
      {!hideTitle && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: color }} />
            <Icon className="w-5 h-5" style={{ color }} />
            <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
          </div>
          {viewMoreHref && (
            <Link
              href={viewMoreHref}
              className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center transition-colors group"
            >
              {viewMoreLabel} <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}

      <div className="space-y-3">
        {jobs.slice(0, maxJobs).map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}
