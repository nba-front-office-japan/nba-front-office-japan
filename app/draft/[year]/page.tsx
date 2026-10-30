import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DraftYearView } from "@/components/draft-year-view";
import { PAST_DRAFT_YEARS, draftPicksForYear } from "@/lib/draft/draft-history";

// 過去の年だけを事前に生成する。2026年は /draft で表示する
export const dynamicParams = false;

export function generateStaticParams() {
  return PAST_DRAFT_YEARS.map((year) => ({ year: String(year) }));
}

export async function generateMetadata({ params }: PageProps<"/draft/[year]">): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `${year} NBAドラフト指名結果一覧 | NBA Front Office Japan`,
    description: `${year}年NBAドラフトの全指名選手を指名順に一覧で。指名チーム・ポジション・出身・身長・体重をまとめています。`,
    alternates: { canonical: `/draft/${year}` },
  };
}

export default async function DraftYearPage({ params }: PageProps<"/draft/[year]">) {
  const { year } = await params;
  const picks = draftPicksForYear(Number(year));
  if (!picks) notFound();
  return <DraftYearView year={Number(year)} picks={picks} />;
}
