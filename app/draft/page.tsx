import type { Metadata } from "next";
import { DraftYearView } from "@/components/draft-year-view";
import { DRAFT_2026_PICKS } from "@/lib/draft/draft-2026-picks";
import { DEFAULT_DRAFT_YEAR } from "@/lib/draft-format";
import { fetchDraftPlayerIds } from "@/lib/draft/draft-player-links";

// 選手ページへのリンク(選手名鑑との照合)を1日ごとに更新する
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "2026 NBAドラフト指名結果一覧 | NBA Front Office Japan",
  description: "2026年NBAドラフトの全指名選手を指名順に一覧で。指名チーム・ポジション・出身を日本語でまとめています。",
  alternates: { canonical: "/draft" },
};

export default async function DraftPage() {
  const playerIds = await fetchDraftPlayerIds(DEFAULT_DRAFT_YEAR, DRAFT_2026_PICKS);
  return <DraftYearView year={DEFAULT_DRAFT_YEAR} picks={DRAFT_2026_PICKS} playerIds={playerIds} />;
}
