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
    <section className="w-full">
      <div className="flex items-center mb-4">
        <Link 
          href={`/category/${slug}`}
          className="flex items-center bg-[#1e293b] dark:bg-slate-800 rounded-full overflow-hidden relative h-10 md:h-11 hover:bg-slate-700 dark:hover:bg-slate-700 transition-colors w-full group mb-2"
        >
          <div className="absolute left-0 top-0 bottom-0 w-3 transition-all group-hover:w-4 rounded-l-full" style={{ backgroundColor: color }} />
          <h2 className="text-[16px] md:text-[18px] font-medium text-slate-100 pl-6 pr-4 tracking-wide flex items-center">
            {title} <span className="opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 inline-block transition-transform ml-1.5 text-lg">&raquo;</span>
          </h2>
        </Link>
      </div>
      
      <div className="space-y-3">
        {jobs.slice(0, 2).map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}
