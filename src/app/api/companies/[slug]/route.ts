import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';
import { redis } from '@/lib/redis/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug);

  if (!slug) {
    return NextResponse.json({ error: 'Missing company slug' }, { status: 400 });
  }

  const cacheKey = `company:${slug}`;

  try {
    // Try cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    // Fetch all active jobs
    const { data: allJobs, error } = await supabaseClient
      .from('jobs')
      .select('*, sources(name, trust_score)')
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    // Find company by matching slug to company name
    const companyJobs = (allJobs || []).filter(job => {
      const jobSlug = encodeURIComponent(job.company.toLowerCase().replace(/\s+/g, '-'));
      return jobSlug === slug;
    });

    if (companyJobs.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const companyName = companyJobs[0].company;

    // Get company logo (first non-null)
    let logo = companyJobs.find(j => j.company_logo_url)?.company_logo_url || null;

    // Fallback: If no logo in active jobs, check historical jobs for this company
    if (!logo) {
      const { data: historicalJob } = await supabaseClient
        .from('jobs')
        .select('company_logo_url')
        .eq('company', companyName)
        .not('company_logo_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (historicalJob?.company_logo_url) {
        logo = historicalJob.company_logo_url;
      }
    }

    // Get primary location (most common)
    const locationCounts = new Map<string, number>();
    for (const job of companyJobs) {
      const loc = job.location || 'Непознато';
      locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
    }
    let primaryLocation = 'Непознато';
    let maxLocCount = 0;
    locationCounts.forEach((count, loc) => {
      if (count > maxLocCount) {
        maxLocCount = count;
        primaryLocation = loc;
      }
    });

    // Get category stats
    const categoryCounts = new Map<string, number>();
    for (const job of companyJobs) {
      for (const cat of (job.categories || [])) {
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
      }
    }
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const primaryIndustry = topCategories.length > 0 ? topCategories[0].name : 'Останато';

    // Latest job date
    const latestJobDate = companyJobs
      .map(j => j.created_at)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

    // Format jobs with source name
    const formattedJobs = companyJobs
      .map(job => ({
        ...job,
        source_name: job.sources?.name || 'Unknown',
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Find similar companies (same primary industry, different name)
    const similarCompanies = new Map<string, { name: string; slug: string; logo: string | null; jobCount: number }>();
    for (const job of (allJobs || [])) {
      if (job.company === companyName) continue;
      const jobCats = job.categories || [];
      if (!jobCats.includes(primaryIndustry)) continue;

      const simSlug = encodeURIComponent(job.company.toLowerCase().replace(/\s+/g, '-'));
      const existing = similarCompanies.get(job.company);
      if (existing) {
        existing.jobCount++;
        if (!existing.logo && job.company_logo_url) existing.logo = job.company_logo_url;
      } else {
        similarCompanies.set(job.company, {
          name: job.company,
          slug: simSlug,
          logo: job.company_logo_url || null,
          jobCount: 1,
        });
      }
    }

    const similarList = Array.from(similarCompanies.values())
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 6);

    const companyData = {
      name: companyName,
      slug,
      logo,
      location: primaryLocation,
      industry: primaryIndustry,
      jobCount: companyJobs.length,
      latestJobDate,
      topCategories,
      jobs: formattedJobs,
      similarCompanies: similarList,
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(companyData));

    return NextResponse.json(companyData);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}
