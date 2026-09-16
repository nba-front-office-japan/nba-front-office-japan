import type { ArticleDraftStatus } from "@/lib/supabase/types";

// news_items.statusだけでは「イベント化済み/下書き作成済み/公開済み」を区別できない
// ため、news_event_sources・article_draftsと突き合わせて表示用の処理状況を導出する。
export type ProcessingStage =
  | "unprocessed"
  | "event_created"
  | "draft_created"
  | "published";

export const PROCESSING_STAGE_LABEL: Record<ProcessingStage, string> = {
  unprocessed: "未処理",
  event_created: "イベント作成済み",
  draft_created: "下書き作成済み",
  published: "公開済み",
};

export const PROCESSING_STAGE_BADGE_CLASS: Record<ProcessingStage, string> = {
  unprocessed: "bg-[#eef1f5] text-[#5b6472] dark:bg-white/[.08] dark:text-slate-300",
  event_created: "bg-[#eaf1ff] text-[#2457b7] dark:bg-blue-950 dark:text-blue-200",
  draft_created: "bg-[#fff0d9] text-[#ac6811] dark:bg-amber-950 dark:text-amber-200",
  published: "bg-[#e9f7f1] text-[#186b4f] dark:bg-emerald-950 dark:text-emerald-200",
};

export function deriveProcessingStage(
  itemStatus: string,
  draftStatus: ArticleDraftStatus | null
): ProcessingStage {
  if (draftStatus === "published") return "published";
  if (draftStatus) return "draft_created";
  if (itemStatus === "processed") return "event_created";
  return "unprocessed";
}
