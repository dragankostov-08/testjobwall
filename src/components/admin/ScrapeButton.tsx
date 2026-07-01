"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ScrapeButton({ sourceId, sourceName }: { sourceId: string, sourceName: string }) {
  const [loading, setLoading] = useState(false);

  const handleScrape = async () => {
    setLoading(true);
    toast.info(`Triggering scrape for ${sourceName}...`);
    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, sourceName }),
      });
      if (!res.ok) throw new Error('Scrape failed');
      toast.success(`Scrape triggered for ${sourceName}!`);
    } catch (err) {
      toast.error(`Failed to scrape ${sourceName}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleScrape} disabled={loading} size="sm" variant="secondary">
      {loading ? 'Scraping...' : 'Trigger Scrape'}
    </Button>
  );
}
