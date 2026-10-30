import type { Metadata } from "next";
import { DraftYearView } from "@/components/draft-year-view";
import { DRAFT_2026_PICKS } from "@/lib/draft/draft-2026-picks";
import { DEFAULT_DRAFT_YEAR } from "@/lib/draft-format";

export const metadata: Metadata = {
  title: "2026 NBAドラフト指名結果一覧 | NBA Front Office Japan",
  description: "2026年NBAドラフトの全指名選手を指名順に一覧で。指名チーム・ポジション・出身を日本語でまとめています。",
  alternates: { canonical: "/draft" },
};

export default function DraftPage() {
  return <DraftYearView year={DEFAULT_DRAFT_YEAR} picks={DRAFT_2026_PICKS} />;
}
