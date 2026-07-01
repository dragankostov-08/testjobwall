import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';
import { redis } from '@/lib/redis/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const isRemote = searchParams.get('remote') === 'true';
  const section = searchParams.get('section'); // 'latest' | 'trending' | 'featured'
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search')?.trim() || '';
  const location = searchParams.get('location')?.trim() || '';
  const source = searchParams.get('source')?.trim() || '';
  
  const cacheKey = `jobs:${category || 'all'}:remote:${isRemote}:section:${section || 'default'}:${limit}:search:${search}:loc:${location}:src:${source}`;
  
  try {
    // 1. Try to fetch from Redis Cache (skip cache for search queries)
    if (!search) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(JSON.parse(cachedData));
      }
    }
    
    // 2. Build query based on section type
    let query = supabaseClient
      .from('jobs')
      .select('*, sources(name, trust_score)')
      .gt('expires_at', new Date().toISOString())
      .gte('score', 0); // Exclude spam/hidden jobs

    // Apply search filter using ilike for partial matching
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      // Search across title, company, location, and description using OR
      query = query.or(
        `title.ilike.${searchLower},company.ilike.${searchLower},location.ilike.${searchLower},description.ilike.${searchLower}`
      );
    }

    // Apply category filter
    if (category && category !== 'all') {
      query = query.contains('categories', [category]);
    }
    
    // Apply remote filter
    if (isRemote) {
      query = query.eq('is_remote', true);
    }

    // Apply location filter
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    // Apply source filter
    if (source) {
      query = query.eq('source_name', source);
    }

    // Apply section-specific ordering
    if (search) {
      // When searching, order by score then freshness for best relevance
      query = query
        .order('score', { ascending: false })
        .order('created_at', { ascending: false });
    } else if (section === 'latest') {
      query = query.order('created_at', { ascending: false });
    } else if (section === 'trending') {
      // Trending: high engagement in last 24 hours (tightened from 48h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = query
        .gte('created_at', oneDayAgo)
        .order('click_count', { ascending: false })
        .order('view_count', { ascending: false })
        .order('created_at', { ascending: false });
    } else if (section === 'featured') {
      // Featured: high-quality jobs — high score, optionally with salary
      query = query
        .order('score', { ascending: false })
        .order('click_count', { ascending: false });
    } else {
      // Default: order by score (multi-factor) then date
      query = query
        .order('score', { ascending: false })
        .order('created_at', { ascending: false });
    }

    // Fetch more items than requested to allow for diversity filtering
    const fetchLimit = limit * 5;
    query = query.limit(fetchLimit);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Deduplicate by hash_key (keep highest scored version)
    const seen = new Set<string>();
    const deduped = (data || []).filter(job => {
      const key = job.hash_key || job.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Map source name for convenience and add dynamic tags
    const enableNewScoring = process.env.ENABLE_NEW_SCORING !== 'false';
    const formattedJobs = deduped.map(job => {
      const tags = [];
      if (job.is_remote) tags.push('Remote');
      if (job.metadata?.salary_disclosed) tags.push('Salary Disclosed');
      
      const breakdown = job.score_breakdown || {};
      if (breakdown.trending_bonus && breakdown.trending_bonus > 0) tags.push('Trending');
      if (breakdown.source_trust && breakdown.source_trust >= 7.0) tags.push('Verified Source');
      if (breakdown.ml_quality_boost && breakdown.ml_quality_boost > 0) tags.push('High Quality');

      return {
        ...job,
        source_name: job.sources?.name || 'Unknown',
        tags,
      };
    });
    
    if (!enableNewScoring) {
      formattedJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Enforce source diversity: try to avoid showing more than 2 jobs from the same source
    const sourceCount = new Map<string, number>();
    const diverseJobs = [];
    const deferredJobs = [];

    for (const job of formattedJobs) {
      const source = job.source_name;
      const count = sourceCount.get(source) || 0;
      
      if (count < 2) {
        diverseJobs.push(job);
        sourceCount.set(source, count + 1);
      } else {
        deferredJobs.push(job);
      }

      if (diverseJobs.length >= limit) break;
    }

    // Fill remaining spots with deferred jobs if we didn't meet the limit
    while (diverseJobs.length < limit && deferredJobs.length > 0) {
      diverseJobs.push(deferredJobs.shift());
    }

    const finalJobs = diverseJobs.slice(0, limit);

    // 3. Cache the result for 5 minutes (skip caching search results)
    if (!search) {
      await redis.setex(cacheKey, 300, JSON.stringify(finalJobs));
    }

    return NextResponse.json(finalJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
