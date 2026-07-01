import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';
import { redis } from '@/lib/redis/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section'); // 'latest' | 'trending'
  const category = searchParams.get('category'); // 'hiring' | 'salary' | 'remote' | 'market' | 'tech' | 'general'
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');
  const search = searchParams.get('search')?.trim() || '';

  const cacheKey = `news:${section || 'default'}:${category || 'all'}:${limit}:${offset}:search:${search}`;

  try {
    // 1. Try Redis cache (skip for search queries)
    if (!search) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(JSON.parse(cachedData));
      }
    }

    // 2. Build Supabase query
    let query = supabaseClient
      .from('news_articles')
      .select('*, news_sources(name, trust_score)');

    // Apply search filter using ilike for partial matching
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      query = query.or(
        `title.ilike.${searchLower},summary.ilike.${searchLower},category.ilike.${searchLower}`
      );
    }

    // Filter by category
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Section-specific ordering
    if (search) {
      // When searching, order by relevance then freshness then engagement
      query = query
        .order('relevance_score', { ascending: false })
        .order('published_at', { ascending: false })
        .order('click_count', { ascending: false });
    } else if (section === 'trending') {
      query = query
        .eq('is_trending', true)
        .order('click_count', { ascending: false })
        .order('view_count', { ascending: false })
        .order('published_at', { ascending: false });
    } else {
      // Default / latest: by relevance then date then engagement
      query = query
        .order('relevance_score', { ascending: false })
        .order('published_at', { ascending: false })
        .order('click_count', { ascending: false });
    }

    const fetchLimit = limit * 5;
    query = query.range(offset, offset + fetchLimit - 1);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Map source name
    const formattedArticles = (data || []).map(article => ({
      ...article,
      source_name: article.news_sources?.name || 'Непознат',
    }));

    // Enforce source diversity: max 2 articles from the same source
    const sourceCount = new Map<string, number>();
    const diverseArticles = [];
    const deferredArticles = [];

    for (const article of formattedArticles) {
      const source = article.source_name;
      const count = sourceCount.get(source) || 0;
      
      if (count < 2) {
        diverseArticles.push(article);
        sourceCount.set(source, count + 1);
      } else {
        deferredArticles.push(article);
      }

      if (diverseArticles.length >= limit) break;
    }

    // Fill remaining spots if needed
    while (diverseArticles.length < limit && deferredArticles.length > 0) {
      diverseArticles.push(deferredArticles.shift());
    }

    const finalArticles = diverseArticles.slice(0, limit);

    // 3. Cache for 5 minutes (skip caching search results)
    if (!search) {
      await redis.setex(cacheKey, 300, JSON.stringify(finalArticles));
    }

    return NextResponse.json(finalArticles);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
