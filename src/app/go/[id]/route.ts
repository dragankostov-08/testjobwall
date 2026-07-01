import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';
import { redis } from '@/lib/redis/client';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  if (!id) {
    return new NextResponse('Missing Job ID', { status: 400 });
  }

  try {
    // Track click asynchronously using Redis for speed
    const trackClick = async () => {
      const clickKey = `clicks:job:${id}`;
      await redis.incr(clickKey);
    };
    
    // Fire and forget
    trackClick().catch(console.error);

    // Fetch the target URL from Supabase
    const { data, error } = await supabaseClient
      .from('jobs')
      .select('url')
      .eq('id', id)
      .single();

    if (error || !data?.url) {
      return new NextResponse('Job not found', { status: 404 });
    }

    // 302 Redirect to the original source
    return NextResponse.redirect(data.url, { status: 302 });
  } catch (error) {
    console.error('Error redirecting:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
