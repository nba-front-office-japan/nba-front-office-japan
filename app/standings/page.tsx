import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { StandingsBoard } from "@/components/standings-board";
import { ROSTER_SEASON, seasonLabel } from "@/lib/seasons";
import { fetchStandings } from "@/lib/standings-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "NBA順位表 | NBA Front Office Japan",
  description: "管理画面から取り込んだレギュラーシーズンのボックススコアをもとにしたNBA順位表。",
};

export default async function StandingsPage() {
  let data: Awaited<ReturnType<typeof fetchStandings>> | null = null;
  let error: string | null = null;
  try {
    data = await fetchStandings(createServerSupabaseClient(), ROSTER_SEASON);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "順位表の取得に失敗しました。";
  }

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Standings</p>
      <h1 className="mb-2 text-[28px] font-semibold tracking-tight sm:text-[36px]">NBA順位表</h1>
      <p className="mb-6 text-sm leading-7 text-muted">
        {seasonLabel(ROSTER_SEASON)}レギュラーシーズンの順位です。管理画面で取り込んだボックススコアをもとに自動更新します。プレシーズンは含みません。
      </p>

      {error ? (
        <p className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>
      ) : !data || data.rows.length === 0 ? (
        <p className="border border-line bg-surface px-4 py-8 text-sm text-muted">順位表を作成するためのレギュラーシーズンのボックススコアが、まだ取り込まれていません。</p>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-x-5 gap-y-1 border-y border-line py-3 text-xs text-muted">
            <span>集計済み: <strong className="text-foreground">{data.gamesCounted}試合</strong></span>
            {data.lastUpdatedAt && <span>最終取込: <strong className="text-foreground">{new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(data.lastUpdatedAt))}</strong></span>}
          </div>
          <StandingsBoard rows={data.rows} />
          <p className="mt-5 text-xs leading-6 text-muted">同率チームは勝率・勝数・敗数・チーム名の順で仮表示しています。NBA公式のタイブレーク基準による確定順位ではありません。</p>
        </>
      )}
    </PageShell>
  );
}
