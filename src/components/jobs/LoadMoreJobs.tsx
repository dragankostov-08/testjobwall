"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import JobCard, { Job } from "./JobCard";
import { GetJobsParams } from "@/lib/data/jobs";

interface LoadMoreJobsProps {
  fetchAction: (params: GetJobsParams, page: number) => Promise<Job[]>;
  params: GetJobsParams;
  initialJobsLength: number;
}

export default function LoadMoreJobs({
  fetchAction,
  params,
  initialJobsLength
}: LoadMoreJobsProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialJobsLength >= (params.limit || 10));
  const observerRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const newJobs = await fetchAction(params, page);
      
      if (newJobs.length === 0) {
        setHasMore(false);
      } else {
        // Filter out any potential duplicates based on job id or hash_key
        setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          
          const uniqueNewJobs = newJobs.filter(j => {
            if (existingIds.has(j.id)) return false;
            return true;
          });
          
          return [...prev, ...uniqueNewJobs];
        });
        
        setPage(p => p + 1);
        if (newJobs.length < (params.limit || 10)) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to load more jobs", error);
    } finally {
      setLoading(false);
    }
  }, [fetchAction, params, page, loading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loadMore, loading, hasMore]);

  if (!hasMore && jobs.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3 mt-3">
        {jobs.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
      
      {hasMore && (
        <div ref={observerRef} className="py-8 flex justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
        </div>
      )}
      
      {!hasMore && jobs.length > 0 && (
        <div className="py-8 text-center text-muted-foreground text-sm">
          Нема повеќе огласи.
        </div>
      )}
    </>
  );
}
