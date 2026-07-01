import { formatDistanceToNow } from "date-fns";
import { mk } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  categories: string[];
  is_remote: boolean;
  created_at: string;
  source_name: string;
  company_logo_url?: string;
  metadata?: {
    alternate_sources?: Array<{
      name: string;
      url: string;
    }>;
  };
}

export default function JobCard({ job }: { job: Job }) {
  // Ultra-compact, low-padding layout optimized for scanning.
  return (
    <div className="group relative block bg-card hover:bg-accent border border-border rounded-lg p-4 transition-colors">
      <Link href={`/go/${job.id}`} target="_blank" className="absolute inset-0 z-10">
        <span className="sr-only">Оди на огласот {job.title}</span>
      </Link>
      
      <div className="flex gap-4">
        {/* Avatar */}
        <Avatar className="w-20 h-20 border border-border rounded-md shrink-0 bg-background">
          {job.company_logo_url && (
            <AvatarImage 
              src={job.company_logo_url} 
              alt={job.company} 
              className="object-contain p-1 bg-white" 
            />
          )}
          <AvatarFallback className="rounded-md bg-secondary text-secondary-foreground font-semibold text-lg">
            {job.company.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="text-base font-semibold text-foreground group-hover:underline line-clamp-2">
            {job.title}
          </h3>
          
          <div className="flex items-center gap-2 mt-1 mb-2 text-sm text-foreground font-medium">
            <span>{job.company}</span>
            <span className="text-muted-foreground font-normal">•</span>
            <span className="text-muted-foreground font-normal">{job.location}</span>
          </div>

        {/* Badges / Meta */}
          <div className="flex flex-wrap items-center gap-2 mt-auto text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{job.source_name}</span>
            <span>•</span>
            <time dateTime={job.created_at}>
              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: mk })}
            </time>
            {job.is_remote && (
              <>
                <span>•</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[#1A3A3A] text-[#2DD4BF] border border-[#2DD4BF]/20">
                  Remote
                </span>
              </>
            )}
            
            {job.metadata?.alternate_sources && job.metadata.alternate_sources.length > 0 && (
              <>
                <span>•</span>
                <div className="relative z-20 group/dropdown">
                  <button className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800/60 text-blue-400 hover:bg-slate-800 hover:text-blue-300 border border-slate-700/50 transition-colors cursor-pointer">
                    +{job.metadata.alternate_sources.length} извори &raquo;
                  </button>
                  <div className="absolute top-full mt-1.5 left-0 bg-popover text-popover-foreground shadow-lg rounded-md p-2 min-w-[140px] opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all flex flex-col gap-1.5 border border-border z-30">
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-0.5 px-1">Исто така достапен на:</div>
                    {job.metadata.alternate_sources.map((src, i) => (
                      <a 
                        key={i} 
                        href={src.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs hover:bg-accent hover:text-accent-foreground px-2 py-1.5 rounded transition-colors text-foreground block truncate"
                        title={src.name}
                      >
                        {src.name}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
