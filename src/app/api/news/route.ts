import { NextResponse } from 'next/server';
import { getNews } from '@/lib/data/news';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section') || undefined;
  const category = searchParams.get('category') || undefined;
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');
  const search = searchParams.get('search')?.trim() || undefined;

  try {
    const finalArticles = await getNews({
      section,
      category,
      limit,
      offset,
      search
    });

    if (finalArticles === null) {
      return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }

    return NextResponse.json(finalArticles);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
