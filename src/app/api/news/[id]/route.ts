import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';
import { redis } from '@/lib/redis/client';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  if (!id) {
    return new NextResponse('Missing Article ID', { status: 400 });
  }

  try {
    // Track click asynchronously via Redis
    const trackClick = async () => {
      const clickKey = `clicks:news:${id}`;
      await redis.incr(clickKey);
    };
    trackClick().catch(console.error);

    // Also increment in Supabase directly
    const { data: article, error } = await supabaseClient
      .from('news_articles')
      .select('original_url, click_count')
      .eq('id', id)
      .single();

    if (error || !article?.original_url) {
      return new NextResponse('Article not found', { status: 404 });
    }

    // Increment click_count
    await supabaseClient
      .from('news_articles')
      .update({ click_count: (article.click_count || 0) + 1 })
      .eq('id', id);

    // 302 Redirect to the original article
    return NextResponse.redirect(article.original_url, { status: 302 });
  } catch (error) {
    console.error('Error redirecting to news:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
