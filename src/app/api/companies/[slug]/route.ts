import { NextResponse } from 'next/server';
import { getCompany } from '@/lib/data/companies';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug);

  if (!slug) {
    return NextResponse.json({ error: 'Missing company slug' }, { status: 400 });
  }

  try {
    const companyData = await getCompany(slug);

    if (companyData === null) {
      return NextResponse.json({ error: 'Company not found or failed to fetch' }, { status: 404 });
    }

    return NextResponse.json(companyData);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}
