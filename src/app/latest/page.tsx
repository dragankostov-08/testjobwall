import { Job } from "@/components/jobs/JobCard";
import FeedSection from "@/components/jobs/FeedSection";
import SidebarNewsWidget from "@/components/layout/SidebarNewsWidget";
import TopHiringWidget from "@/components/layout/TopHiringWidget";
import { headers } from "next/headers";
import { Clock } from "lucide-react";

export const metadata = {
  title: "Најнови Огласи | JobWall.mk",
  description: "Сите најнови огласи за работа на едно место. Ажурирано во реално време.",
};

async function fetchLatestJobs(): Promise<Job[]> {
  try {
    const host = (await headers()).get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    
    // Fetch a larger list for the dedicated page (e.g., 20 jobs)
    const url = `${protocol}://${host}/api/jobs?section=latest&limit=20`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch latest jobs:", error);
    return [];
  }
}

export default async function LatestJobsPage() {
  const latestJobs = await fetchLatestJobs();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
      {/* Main Content */}
      <div className="lg:col-span-8">
        <div className="mb-6 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Најнови Огласи</h1>
              <p className="text-sm text-muted-foreground mt-1">Огласи објавени неодамна од сите извори</p>
            </div>
          </div>
        </div>

        <FeedSection
          title="Сите Најнови"
          icon={Clock}
          color="#3b82f6"
          jobs={latestJobs}
          maxJobs={20}
        />
      </div>

      {/* Right Sidebar */}
      <div className="lg:col-span-4 space-y-8">
        <SidebarNewsWidget />
        <div className="h-px bg-border my-8" />
        <TopHiringWidget />
      </div>
    </div>
  );
}
