import { Queue, Worker } from 'bullmq';
import { redis } from '../lib/redis/client';
import { supabaseClient } from '../lib/supabase/client';

export const rankQueue = new Queue('rankQueue', { connection: redis });

/**
 * Multi-factor job ranking worker.
 * 
 * Score = (0.35 × Freshness) + (0.20 × Completeness) + (0.20 × Engagement) + (0.15 × SourceTrust) + (0.10 × Featured)
 */
const worker = new Worker('rankQueue', async job => {
  console.log(`Processing rank update job: ${job.id}`);

  // 1. Fetch all active jobs with source trust scores
  const { data: activeJobs, error } = await supabaseClient
    .from('jobs')
    .select('id, created_at, description, salary, company_logo_url, categories, location, is_remote, view_count, click_count, save_count, sources(trust_score)')
    .gt('expires_at', new Date().toISOString());

  if (error || !activeJobs) {
    console.error('Failed to fetch active jobs', error);
    return;
  }

  // 2. Sync Redis click counts to database
  for (const j of activeJobs) {
    try {
      const redisClicks = await redis.get(`clicks:job:${j.id}`);
      if (redisClicks && parseInt(redisClicks) > (j.click_count || 0)) {
        await supabaseClient
          .from('jobs')
          .update({ click_count: parseInt(redisClicks) })
          .eq('id', j.id);
        j.click_count = parseInt(redisClicks);
      }
    } catch {
      // Redis may not be available, skip
    }
  }

  // 3. Calculate max engagement for normalization
  const maxEngagement = Math.max(
    1,
    ...activeJobs.map(j => (j.view_count || 0) + (j.click_count || 0) * 2 + (j.save_count || 0) * 3)
  );

  const now = Date.now();

  // 4. Calculate scores for each job
  for (const j of activeJobs) {
    const ageHours = (now - new Date(j.created_at).getTime()) / (1000 * 60 * 60);

    // --- Freshness Score (35%) ---
    let freshness = 1.0;
    if (ageHours > 2 && ageHours <= 6) freshness = 0.92;
    else if (ageHours > 6 && ageHours <= 12) freshness = 0.78;
    else if (ageHours > 12 && ageHours <= 24) freshness = 0.60;
    else if (ageHours > 24 && ageHours <= 48) freshness = 0.40;
    else if (ageHours > 48 && ageHours <= 72) freshness = 0.25;
    else if (ageHours > 72) freshness = 0.10;

    // --- Completeness Score (20%) ---
    let completeness = 0;
    if (j.salary) completeness += 0.30;
    if (j.description) completeness += 0.25;
    if (j.company_logo_url) completeness += 0.20;
    if (j.location && j.location !== 'Unknown') completeness += 0.15;
    if (j.categories && j.categories.length > 0 && j.categories[0] !== 'Останато') completeness += 0.10;

    // --- Engagement Score (20%) ---
    const rawEngagement = (j.view_count || 0) + (j.click_count || 0) * 2 + (j.save_count || 0) * 3;
    const engagement = rawEngagement / maxEngagement;

    // --- Source Trust Score (15%) ---
    const sourceTrust = (j.sources as any)?.trust_score ?? 0.70;

    // --- Featured Boost (10%) ---
    let featured = 0;
    if (j.is_remote) featured += 0.50;
    if (j.salary) featured += 0.50;

    // --- Final weighted score ---
    const score = (0.35 * freshness) + (0.20 * completeness) + (0.20 * engagement) + (0.15 * sourceTrust) + (0.10 * featured);
    const newScore = parseFloat(Math.min(score, 9.99).toFixed(2));

    await supabaseClient
      .from('jobs')
      .update({ score: newScore })
      .eq('id', j.id);
  }

  // 5. Clear redis cache to serve fresh ranks
  try {
    const keys = await redis.keys('jobs:*');
    if (keys.length > 0) await redis.del(keys);
    const newsKeys = await redis.keys('news:*');
    if (newsKeys.length > 0) await redis.del(newsKeys);
  } catch {
    // Redis may not be available
  }

  console.log(`Ranked ${activeJobs.length} jobs successfully`);

}, { connection: redis });

worker.on('completed', job => {
  console.log(`${job.id} has completed rank update!`);
});
