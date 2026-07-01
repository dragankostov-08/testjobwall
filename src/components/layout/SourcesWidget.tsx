import { supabaseClient } from "@/lib/supabase/client";
import { Globe } from "lucide-react";
import Link from "next/link";

export default async function SourcesWidget() {
  // Fetch active jobs to count per source
  const { data: jobs } = await supabaseClient
    .from('jobs')
    .select('source_name')
    .gt('expires_at', new Date().toISOString());

  if (!jobs || jobs.length === 0) return null;

  const sourceCounts = new Map<string, number>();
  
  for (const job of jobs) {
    sourceCounts.set(job.source_name, (sourceCounts.get(job.source_name) || 0) + 1);
  }

  // Fetch sources to get base URLs (optional, but good for display if needed)
  const { data: sources } = await supabaseClient
    .from('sources')
    .select('name, base_url')
    .eq('active', true);

  const sourceDetails = new Map(sources?.map(s => [s.name, s.base_url]) || []);

  const topSources = Array.from(sourceCounts.entries())
    .map(([name, count]) => ({ name, count, baseUrl: sourceDetails.get(name) }))
    .sort((a, b) => b.count - a.count);

  if (topSources.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-indigo-500" />
        <h3 className="text-base font-semibold text-foreground tracking-tight">Извори на огласи</h3>
      </div>
      <div className="space-y-3">
        {topSources.map((source) => (
          <Link 
            key={source.name} 
            href={`/?source=${encodeURIComponent(source.name)}`}
            className="flex items-center justify-between group p-2 -mx-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center shadow-sm shrink-0 group-hover:border-indigo-500/30 transition-colors">
                <span className="text-xs font-bold text-muted-foreground group-hover:text-indigo-500 transition-colors">
                  {source.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-foreground truncate group-hover:text-indigo-500 transition-colors">
                  {source.name}
                </p>
                {source.baseUrl && (
                  <p className="text-[11px] text-muted-foreground truncate opacity-70">
                    {source.baseUrl.replace(/^https?:\/\/(www\.)?/, '')}
                  </p>
                )}
              </div>
            </div>
            <div className="bg-secondary text-secondary-foreground text-[11px] font-semibold px-2 py-0.5 rounded-full border border-border/50">
              {source.count}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
