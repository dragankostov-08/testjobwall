import { supabaseClient } from "@/lib/supabase/client";
import { Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function TopHiringWidget() {
  const { data: jobs } = await supabaseClient
    .from('jobs')
    .select('company, company_logo_url')
    .gt('expires_at', new Date().toISOString());

  if (!jobs || jobs.length === 0) return null;

  const companyCounts = new Map<string, { count: number, logo: string | null }>();
  
  for (const job of jobs) {
    const existing = companyCounts.get(job.company) || { count: 0, logo: null };
    companyCounts.set(job.company, {
      count: existing.count + 1,
      logo: job.company_logo_url || existing.logo
    });
  }

  const topCompanies = Array.from(companyCounts.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  if (topCompanies.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-emerald-500" />
        <h3 className="text-base font-semibold text-foreground tracking-tight">Најбарани компании</h3>
      </div>
      <div className="space-y-5">
        {topCompanies.map((company) => (
          <div key={company.name} className="flex items-center gap-4 bg-secondary/30 hover:bg-secondary/60 transition-colors p-3 rounded-lg border border-border/50">
            <Avatar className="w-14 h-14 border border-border rounded-md shrink-0 bg-background shadow-sm">
              {company.logo && (
                <AvatarImage 
                  src={company.logo} 
                  alt={company.name} 
                  className="object-contain p-1.5 bg-white" 
                />
              )}
              <AvatarFallback className="rounded-md bg-secondary text-secondary-foreground font-semibold text-base">
                {company.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-foreground truncate" title={company.name}>
                {company.name}
              </p>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {company.count} отворени позиции
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
