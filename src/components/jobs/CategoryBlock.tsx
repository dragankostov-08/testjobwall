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
      <div className="flex items-center mb-5 group relative">
        <Link 
          href={`/category/${slug}`}
          className="inline-flex items-center bg-[#1e293b] dark:bg-slate-800 rounded-full overflow-hidden relative h-9 md:h-10 hover:bg-slate-700 dark:hover:bg-slate-700 transition-colors z-10"
        >
          <div className="absolute left-0 top-0 bottom-0 w-3 transition-all group-hover:w-4 rounded-l-full" style={{ backgroundColor: color }} />
          <h2 className="text-[15px] md:text-[16px] font-medium text-slate-100 pl-6 pr-4 tracking-wide flex items-center">
            {title} <span className="opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 inline-block transition-transform ml-1.5 text-[16px]">&raquo;</span>
          </h2>
        </Link>
        <div className="flex-grow h-px bg-slate-800 ml-3"></div>
      </div>
      
      <div className="space-y-3">
        {jobs.slice(0, 2).map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}
