import Link from "next/link";
import JobCard, { Job } from "./JobCard";
import { ChevronRight } from "lucide-react";

interface CategoryBlockProps {
  title: string;
  slug: string;
  color: string;
  jobs: Job[];
}

export default function CategoryBlock({ title, slug, color, jobs }: CategoryBlockProps) {
  if (jobs.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center mb-6">
        <Link 
          href={`/category/${slug}`}
          className="flex items-center justify-between bg-card rounded-xl border border-border overflow-hidden relative h-12 md:h-14 hover:bg-accent transition-all w-full group shadow-md hover:shadow-lg"
        >
          <div className="flex items-center">
            <div className="absolute left-0 top-0 bottom-0 w-3 md:w-4 transition-all group-hover:w-5" style={{ backgroundColor: color }} />
            <h2 className="text-lg md:text-xl font-bold text-foreground pl-7 md:pl-9 pr-5 md:pr-6 tracking-wide transition-colors">
              {title}
            </h2>
          </div>
          <span className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all pr-4 md:pr-6">&raquo;</span>
        </Link>
      </div>
      
      <div className="space-y-3">
        {jobs.slice(0, 3).map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}
