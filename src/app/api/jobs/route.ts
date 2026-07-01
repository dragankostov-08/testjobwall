import { NextResponse } from 'next/server';
import { getJobs } from '@/lib/data/jobs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const isRemote = searchParams.get('remote') === 'true';
  const section = searchParams.get('section') || undefined;
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search')?.trim() || undefined;
  const location = searchParams.get('location')?.trim() || undefined;
  const source = searchParams.get('source')?.trim() || undefined;
  
  try {
    const finalJobs = await getJobs({
      category,
      remote: isRemote,
      section,
      limit,
      search,
      location,
      source
    });

    if (finalJobs === null) {
       return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    return NextResponse.json(finalJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
