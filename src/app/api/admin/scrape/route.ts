import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { sourceId, sourceName } = await request.json();

    // Get the Python scraper URL from environment
    const SCRAPER_URL = process.env.NEXT_PUBLIC_SCRAPER_URL || 'http://localhost:8000';

    // Trigger the Python scraper via API
    const response = await fetch(`${SCRAPER_URL}/scrape?sources=${encodeURIComponent(sourceName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Scraper returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, message: data.message });
  } catch (error: any) {
    console.error('Scraper trigger error:', error);
    return NextResponse.json(
      { error: `Failed to trigger scraper: ${error.message}` },
      { status: 500 }
    );
  }
}
