import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';
import { redis } from '@/lib/redis/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '30d'; // today, yesterday, 7d, 30d, this_month, last_month

  const cacheKey = `market-pulse:${range}`;

  try {
    // Try Redis cache (10 mins)
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    // Determine date ranges
    const now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();

    startDate.setHours(0, 0, 0, 0);
    prevStartDate.setHours(0, 0, 0, 0);
    prevEndDate.setHours(0, 0, 0, 0);

    if (range === 'today') {
      prevStartDate.setDate(now.getDate() - 1);
      prevEndDate.setDate(now.getDate() - 1);
      prevEndDate.setHours(23, 59, 59, 999);
    } else if (range === 'yesterday') {
      startDate.setDate(now.getDate() - 1);
      now.setDate(now.getDate() - 1);
      now.setHours(23, 59, 59, 999);
      prevStartDate.setDate(startDate.getDate() - 1);
      prevEndDate.setDate(startDate.getDate() - 1);
      prevEndDate.setHours(23, 59, 59, 999);
    } else if (range === '7d') {
      startDate.setDate(now.getDate() - 7);
      prevStartDate.setDate(startDate.getDate() - 7);
      prevEndDate = new Date(startDate);
    } else if (range === '30d') {
      startDate.setDate(now.getDate() - 30);
      prevStartDate.setDate(startDate.getDate() - 30);
      prevEndDate = new Date(startDate);
    } else if (range === 'this_month') {
      startDate.setDate(1);
      prevStartDate.setMonth(now.getMonth() - 1, 1);
      prevEndDate = new Date(startDate);
      prevEndDate.setDate(0);
    } else if (range === 'last_month') {
      startDate.setMonth(now.getMonth() - 1, 1);
      now.setDate(0);
      now.setHours(23, 59, 59, 999);
      prevStartDate.setMonth(startDate.getMonth() - 1, 1);
      prevEndDate = new Date(startDate);
      prevEndDate.setDate(0);
    }

    // 1. Fetch current period jobs
    const { data: currentJobs, error: jobsError } = await supabaseClient
      .from('jobs')
      .select('id, title, company, location, is_remote, salary, categories, created_at, source_id, expires_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (jobsError) throw jobsError;

    // 2. Fetch previous period jobs (for growth calculation)
    const { data: prevJobs } = await supabaseClient
      .from('jobs')
      .select('id, company, categories')
      .gte('created_at', prevStartDate.toISOString())
      .lt('created_at', prevEndDate.toISOString());

    // 3. Fetch current active jobs overall (for total active counts)
    const { count: totalActiveJobs } = await supabaseClient
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .gt('expires_at', new Date().toISOString());

    const { data: activeJobsData } = await supabaseClient
      .from('jobs')
      .select('company')
      .gt('expires_at', new Date().toISOString());
    const totalActiveCompanies = new Set(activeJobsData?.map(j => j.company)).size;

    // 4. Fetch news
    const { data: news } = await supabaseClient
      .from('news')
      .select('id, title, category, published_at, view_count, summary')
      .gte('published_at', startDate.toISOString())
      .lte('published_at', now.toISOString());

    // ---- AGGREGATION ----

    const safeJobs = currentJobs || [];
    const safePrevJobs = prevJobs || [];
    const safeNews = news || [];

    // Snapshot KPIs
    const newJobsCount = safeJobs.length;
    const prevNewJobsCount = safePrevJobs.length;
    const newCompanies = new Set(safeJobs.map(j => j.company)).size;
    const newNewsCount = safeNews.length;
    
    let remoteJobsCount = 0;
    let hybridJobsCount = 0;
    let onsiteJobsCount = 0;
    let salaryJobsCount = 0;
    const sourceSet = new Set<string>();

    // Daily trends
    const dailyJobsMap = new Map<string, number>();
    
    // Category trends
    const categoryMap = new Map<string, { current: number; prev: number }>();
    
    // City trends
    const cityMap = new Map<string, number>();

    // Company insights
    const companyMap = new Map<string, number>();

    // Salary Insights
    const salaries: { category: string, min: number, max: number, avg: number }[] = [];

    // Process current jobs
    for (const job of safeJobs) {
      // Remote type
      const titleLoc = `${job.title} ${job.location}`.toLowerCase();
      if (job.is_remote || titleLoc.includes('remote') || titleLoc.includes('далечински')) {
        remoteJobsCount++;
      } else if (titleLoc.includes('hybrid') || titleLoc.includes('хибрид')) {
        hybridJobsCount++;
      } else {
        onsiteJobsCount++;
      }

      // Salary
      if (job.salary) {
        salaryJobsCount++;
        // Extract numbers from the string (e.g. "30,000 - 40,000" or "40000")
        const nums = job.salary.match(/\d+[.,]?\d*/g);
        if (nums && nums.length > 0) {
          const parsedNums = nums.map((n: string) => parseFloat(n.replace(/,/g, '')));
          let min = parsedNums[0];
          let max = parsedNums.length > 1 ? parsedNums[1] : min;
          if (min > max) {
            const temp = min; min = max; max = temp;
          }
          const avg = (min + max) / 2;
          if (avg >= 10000 && avg <= 300000) { // basic sanity check for MKD salaries
            salaries.push({ category: (job.categories && job.categories[0]) || 'Останато', min, max, avg });
          }
        }
      }

      // Sources
      if (job.source_id) sourceSet.add(job.source_id);

      // Daily
      const dateStr = new Date(job.created_at).toISOString().split('T')[0];
      dailyJobsMap.set(dateStr, (dailyJobsMap.get(dateStr) || 0) + 1);

      // Categories
      for (const cat of (job.categories || ['Останато'])) {
        const catData = categoryMap.get(cat) || { current: 0, prev: 0 };
        catData.current++;
        categoryMap.set(cat, catData);
      }

      // City
      const loc = job.location ? job.location.split(',')[0].trim() : 'Непознато';
      if (loc && loc.length > 2 && !loc.toLowerCase().includes('remote') && !loc.toLowerCase().includes('далеч')) {
        cityMap.set(loc, (cityMap.get(loc) || 0) + 1);
      }

      // Company
      companyMap.set(job.company, (companyMap.get(job.company) || 0) + 1);
    }

    // Process previous jobs (for category growth)
    for (const job of safePrevJobs) {
      for (const cat of (job.categories || ['Останато'])) {
        const catData = categoryMap.get(cat) || { current: 0, prev: 0 };
        catData.prev++;
        categoryMap.set(cat, catData);
      }
    }

    // Format output
    const daysInPeriod = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const avgJobsPerDay = Math.round(newJobsCount / daysInPeriod);

    // Job Market Trends (fill missing dates)
    const dailyJobs = [];
    const walkDate = new Date(startDate);
    while (walkDate <= now) {
      const dStr = walkDate.toISOString().split('T')[0];
      dailyJobs.push({
        date: dStr,
        jobs: dailyJobsMap.get(dStr) || 0
      });
      walkDate.setDate(walkDate.getDate() + 1);
    }

    // Category Trends
    const categoryTrends = Array.from(categoryMap.entries())
      .map(([name, { current, prev }]) => {
        let growth = 0;
        if (prev === 0 && current > 0) growth = 100;
        else if (prev > 0) growth = Math.round(((current - prev) / prev) * 100);
        return { name, jobs: current, growth };
      })
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 10);

    // City Trends
    const cityTrends = Array.from(cityMap.entries())
      .map(([name, jobs]) => ({ name, jobs }))
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 10);

    // Company Insights
    const companyInsights = Array.from(companyMap.entries())
      .map(([name, jobs]) => ({ name, jobs }))
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 10);

    // Salary Insights
    let highestSalary = 0;
    let lowestSalary = 999999;
    const salaryByCategory = new Map<string, { sum: number, count: number }>();
    
    for (const s of salaries) {
      if (s.max > highestSalary) highestSalary = s.max;
      if (s.min < lowestSalary) lowestSalary = s.min;
      const cur = salaryByCategory.get(s.category) || { sum: 0, count: 0 };
      cur.sum += s.avg;
      cur.count++;
      salaryByCategory.set(s.category, cur);
    }
    if (lowestSalary === 999999) lowestSalary = 0;

    const avgSalaryByCategory = Array.from(salaryByCategory.entries())
      .map(([name, { sum, count }]) => ({ name, avg: Math.round(sum / count) }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8);

    // News Insights
    let totalViews = 0;
    const categoryNews = new Map<string, number>();
    for (const n of safeNews) {
      totalViews += n.view_count || 0;
      if (n.category) {
        categoryNews.set(n.category, (categoryNews.get(n.category) || 0) + 1);
      }
    }
    const trendingTopics = Array.from(categoryNews.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // JobWall Index (0-100)
    // Heuristic: based on volume, growth, and company participation
    let indexScore = 50;
    const growthMod = prevNewJobsCount > 0 ? ((newJobsCount - prevNewJobsCount) / prevNewJobsCount) * 20 : 0; // +/- 20 max
    const volumeMod = Math.min(20, (newJobsCount / daysInPeriod) / 10); // up to +20 based on avg daily volume (200/day = max)
    const companyMod = Math.min(10, newCompanies / 10); // up to +10 based on unique companies hiring
    
    indexScore = Math.min(100, Math.max(0, Math.round(50 + Math.max(-20, Math.min(20, growthMod)) + volumeMod + companyMod)));
    
    let indexStatus = "Стабилно";
    if (indexScore > 80) indexStatus = "Многу активно";
    else if (indexScore > 60) indexStatus = "Активно";
    else if (indexScore < 40) indexStatus = "Забавено";

    // Build final payload
    const payload = {
      snapshot: {
        newJobs: newJobsCount,
        prevNewJobs: prevNewJobsCount,
        activeJobs: totalActiveJobs || 0,
        newCompanies,
        activeCompanies: totalActiveCompanies,
        newNews: newNewsCount,
        remoteJobs: remoteJobsCount,
        salaryJobs: salaryJobsCount,
        totalSources: sourceSet.size,
        avgJobsPerDay,
      },
      dailyJobs,
      categoryTrends,
      cityTrends,
      companyInsights,
      remoteInsights: [
        { name: 'Далечински', value: remoteJobsCount },
        { name: 'Хибридно', value: hybridJobsCount },
        { name: 'На локација', value: onsiteJobsCount }
      ],
      salaryInsights: {
        highest: highestSalary,
        lowest: lowestSalary,
        byCategory: avgSalaryByCategory
      },
      newsInsights: {
        count: newNewsCount,
        totalViews,
        trendingTopics
      },
      jobWallIndex: {
        score: indexScore,
        status: indexStatus,
        growthMod: Math.round(growthMod)
      }
    };

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(payload));

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error in Market Pulse API:', error);
    return NextResponse.json({ error: 'Failed to aggregate market data' }, { status: 500 });
  }
}
// Trigger hot reload
