import { notFound } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { mk } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ExternalLink, ArrowLeft } from 'lucide-react';

export const revalidate = 60;

export default async function JobPage({ params }: { params: { id: string } }) {
  const { data: job, error } = await supabaseClient
    .from('jobs')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !job) {
    return notFound();
  }

  // Build the list of all sources including the primary
  const allSources = [
    { name: job.source_name, url: job.url, isPrimary: true },
    ...(job.metadata?.alternate_sources || []).map((s: any) => ({ ...s, isPrimary: false }))
  ];

  return (
    <main className="container mx-auto py-10 px-4 md:px-6 max-w-4xl">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад кон огласите
      </Link>
      
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="w-24 h-24 border border-border rounded-lg shrink-0 bg-background">
            {job.company_logo_url && (
              <AvatarImage 
                src={job.company_logo_url} 
                alt={job.company} 
                className="object-contain p-2 bg-white" 
              />
            )}
            <AvatarFallback className="rounded-lg bg-secondary text-secondary-foreground font-semibold text-2xl">
              {job.company.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-4 text-base text-muted-foreground">
              <span className="font-semibold text-foreground">{job.company}</span>
              <span>•</span>
              <span>{job.location}</span>
              {job.is_remote && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1A3A3A] text-[#2DD4BF] border border-[#2DD4BF]/20">
                    Remote
                  </span>
                </>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Објавено {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: mk })}
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-xl font-bold mb-4">Овој оглас е достапен на {allSources.length} платформи</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allSources.map((source, idx) => (
          <div key={idx} className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between hover:border-blue-500/50 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-foreground">{source.name}</span>
              {source.isPrimary && (
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20 font-medium">
                  Главен извор
                </span>
              )}
            </div>
            
            <a 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
            >
              Аплицирај на {source.name}
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
