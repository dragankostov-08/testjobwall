import './env';

import { Queue, Worker } from 'bullmq';
import { redis } from '../lib/redis/client';
import { supabaseClient } from '../lib/supabase/client';
import crypto from 'crypto';
import * as cheerio from 'cheerio';
import axios from 'axios';

export const scrapeQueue = new Queue('scrapeQueue', { connection: redis });

// Configuration of CSS Selectors for the 11 websites
const SCRAPER_CONFIG: Record<string, { list: string, title: string, company: string, location: string, link: string }> = {
  'Kariera.mk': { list: '.thumbgalleries li', title: '.job-title h3', company: '.job-title .company', location: '.job-info', link: 'a' },
  'Vrabotuvanje.com.mk': { list: '.job-list-item, .job', title: 'h2, h3, .title', company: '.company-name', location: '.location, .city', link: 'a' },
  'Apliciraj.mk': { list: '.job-item, article', title: 'h2, .title', company: '.employer, .company', location: '.location', link: 'a' },
  'Najdirabota.com.mk': { list: '.oglas, .job', title: '.naslov, h3', company: '.firma, .company', location: '.grad, .location', link: 'a' },
  'Vraboti.se': { list: '.post, .job-listing', title: '.title, h2', company: '.company', location: '.location', link: 'a' },
  'Jobs.com.mk': { list: '.job, .listing', title: 'h4, .title', company: '.comp, .company', location: '.loc, .location', link: 'a' },
  'Oglasizarabota.mk': { list: '.oglas-item, .job', title: 'h3, .title', company: '.company-title', location: '.location-title', link: 'a' },
  'App.thrivity.mk': { list: '.job-card', title: '.title', company: '.company', location: '.location', link: 'a' },
  'Honorarec.mk': { list: '.project, .job', title: 'h2, .title', company: '.client, .company', location: '.loc, .location', link: 'a' },
  'Imashchoek.mk': { list: '.job-post, .listing', title: '.job-title', company: '.company-name', location: '.location', link: 'a' },
  'Manpower.mk': { list: '.position, .job', title: 'h3, .title', company: '.company', location: '.location', link: 'a' },
};

const worker = new Worker('scrapeQueue', async job => {
  console.log(`Processing scrape job: ${job.id}`);
  
  const sourceName = job.data.source;
  const config = SCRAPER_CONFIG[sourceName];
  
  // 1. Fetch Source URL from Supabase
  const { data: sourceData } = await supabaseClient.from('sources').select('id, base_url').eq('name', sourceName).single();
  
  if (!sourceData || !config) {
    console.error(`Invalid source or missing config: ${sourceName}`);
    return;
  }

  try {
    // 2. Fetch HTML
    const { data: html } = await axios.get(sourceData.base_url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    const $ = cheerio.load(html);
    const jobs: any[] = [];

    // 3. Parse HTML using the universal config
    $(config.list).each((_, el) => {
      const title = $(el).find(config.title).first().text().trim();
      const company = $(el).find(config.company).first().text().trim();
      const location = $(el).find(config.location).first().text().trim() || 'Скопје';
      let linkHref = $(el).find(config.link).first().attr('href');
      
      if (!linkHref) return; // Skip if no link
      if (!linkHref.startsWith('http')) linkHref = new URL(linkHref, sourceData.base_url).href;

      if (title && company) {
        jobs.push({
          title,
          company,
          location,
          url: linkHref,
          categories: ['Останато'], // We can implement AI categorization later
          is_remote: title.toLowerCase().includes('remote') || location.toLowerCase().includes('remote'),
          source_id: sourceData.id,
          company_logo_url: `https://logo.clearbit.com/${company.replace(/\s+/g, '').toLowerCase()}.com`
        });
      }
    });

    console.log(`Found ${jobs.length} jobs on ${sourceName}`);

    // 4. Insert jobs with deduplication
  for (const j of jobs) {
    const hash_key = crypto.createHash('sha256').update(`${j.company}${j.title}${j.location}`).digest('hex');
    
    const { data: existing } = await supabaseClient.from('jobs').select('id').eq('hash_key', hash_key).single();
    if (existing) continue;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 day expiration
    
    await supabaseClient.from('jobs').insert({
      ...j,
      hash_key,
      expires_at: expiresAt.toISOString()
    });
  }
  
  // Update last_scraped
  await supabaseClient.from('sources').update({ last_scraped: new Date().toISOString() }).eq('id', sourceData.id);

  // Clear redis cache
  const keys = await redis.keys('jobs:*');
  if (keys.length > 0) await redis.del(keys);

  } catch (error: any) {
    console.error(`Scrape failed for ${sourceName}:`, error.message);
  }
}, { connection: redis });

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});
