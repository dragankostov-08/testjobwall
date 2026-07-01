"use server";

import { getJobs, GetJobsParams } from "@/lib/data/jobs";
import { Job } from "@/components/jobs/JobCard";

export async function fetchMoreJobs(
  params: GetJobsParams,
  page: number
): Promise<Job[]> {
  const limit = params.limit || 10;
  const offset = page * limit;

  // We add a small delay to prevent rapid consecutive calls from overloading
  await new Promise(resolve => setTimeout(resolve, 300));

  const jobs = await getJobs({
    ...params,
    offset,
  });

  return jobs || [];
}
