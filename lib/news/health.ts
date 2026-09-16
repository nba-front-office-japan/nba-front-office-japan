import type { Database } from "@/lib/supabase/types";

type JobRun = Database["public"]["Tables"]["news_collector_job_runs"]["Row"];

// 直近3回のジョブがすべて失敗していれば degraded とみなす。
// 列として保持せず、ジョブログから都度判定する（状態の二重管理を避けるため）。
// runsは started_at 降順で渡すこと。
export function isSourceDegraded(recentRunsDesc: JobRun[]): boolean {
  if (recentRunsDesc.length < 3) return false;
  return recentRunsDesc.slice(0, 3).every((run) => !run.is_success);
}
