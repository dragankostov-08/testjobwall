import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';
import { redis } from '@/lib/redis/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() || '';
  const industry = searchParams.get('industry') || '';
  const sort = searchParams.get('sort') || 'jobs'; // 'jobs' | 'name'

  const cacheKey = `companies:${search}:${industry}:${sort}`;

  try {
    // Try Redis cache (skip for search queries)
    if (!search) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(JSON.parse(cachedData));
      }
    }

    // Fetch all active jobs with company info
    const { data: jobs, error } = await supabaseClient
      .from('jobs')
      .select('company, company_logo_url, location, categories')
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    // Aggregate companies
    const companyMap = new Map<string, {
      name: string;
      logo: string | null;
      location: string;
      jobCount: number;
      categories: Map<string, number>;
    }>();

    for (const job of (jobs || [])) {
      const name = job.company;
      const existing = companyMap.get(name);

      if (existing) {
        existing.jobCount++;
        if (!existing.logo && job.company_logo_url) {
          existing.logo = job.company_logo_url;
        }
        // Track category frequency
        for (const cat of (job.categories || [])) {
          existing.categories.set(cat, (existing.categories.get(cat) || 0) + 1);
        }
      } else {
        const catMap = new Map<string, number>();
        for (const cat of (job.categories || [])) {
          catMap.set(cat, 1);
        }
        companyMap.set(name, {
          name,
          logo: job.company_logo_url || null,
          location: job.location || 'Непознато',
          jobCount: 1,
          categories: catMap,
        });
      }
    }

    // Secondary fetch: For companies missing a logo, try to find one from their expired jobs
    const companiesMissingLogo = Array.from(companyMap.values())
      .filter(c => !c.logo)
      .map(c => c.name);

    if (companiesMissingLogo.length > 0) {
      // Fetch up to 1000 recent jobs with logos for these companies
      const { data: historicalJobs } = await supabaseClient
        .from('jobs')
        .select('company, company_logo_url')
        .in('company', companiesMissingLogo)
        .not('company_logo_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (historicalJobs) {
        for (const job of historicalJobs) {
          const comp = companyMap.get(job.company);
          if (comp && !comp.logo && job.company_logo_url) {
            comp.logo = job.company_logo_url;
          }
        }
      }
    }

    // Convert to array with top category as industry
    let companies = Array.from(companyMap.values()).map(c => {
      // Find top category
      let topCategory = 'Останато';
      let maxCount = 0;
      c.categories.forEach((count, cat) => {
        if (count > maxCount) {
          maxCount = count;
          topCategory = cat;
        }
      });

      return {
        name: c.name,
        slug: encodeURIComponent(c.name.toLowerCase().replace(/\s+/g, '-')),
        logo: c.logo,
        location: c.location,
        jobCount: c.jobCount,
        industry: topCategory,
      };
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      companies = companies.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.location.toLowerCase().includes(searchLower) ||
        c.industry.toLowerCase().includes(searchLower)
      );
    }

    // Apply industry filter
    if (industry && industry !== 'all') {
      companies = companies.filter(c => c.industry === industry);
    }

    // Sort
    if (sort === 'name') {
      companies.sort((a, b) => a.name.localeCompare(b.name, 'mk'));
    } else {
      companies.sort((a, b) => b.jobCount - a.jobCount);
    }

    // Cache for 5 minutes
    if (!search) {
      await redis.setex(cacheKey, 300, JSON.stringify(companies));
    }

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
