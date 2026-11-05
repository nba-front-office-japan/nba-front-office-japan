import type { Metadata } from "next";
import { BriefSheet, BriefSide } from "@/components/brief-sheet";
import { PageShell } from "@/components/page-shell";
import { StandingsBoard } from "@/components/standings-board";
import { ROSTER_SEASON, seasonLabel } from "@/lib/seasons";
import { fetchStandings } from "@/lib/standings-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// 取り込んだ試合が再デプロイなしで反映されるよう、5分ごとに集計し直す(選手スタッツ一覧の今季分と同じ間隔)
export const revalidate = 300;

export const metadata: Metadata = {
  title: `NBA順位表 ${seasonLabel(ROSTER_SEASON)}｜東西カンファレンス別の最新順位 | NBA Front Office Japan`,
  description: `NBA ${seasonLabel(ROSTER_SEASON)}シーズンの最新順位表。東西カンファレンス別に勝敗・勝率・ゲーム差・直近10試合・連勝連敗を毎日更新。録画で観る人も安心、試合結果はネタバレ防止つき。`,
  alternates: { canonical: "/standings" },
};

export default async function StandingsPage() {
  let data: Awaited<ReturnType<typeof fetchStandings>> | null = null;
  let error: string | null = null;
  try {
    data = await fetchStandings(createServerSupabaseClient(), ROSTER_SEASON);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "順位表の取得に失敗しました。";
  }

  const hasRows = !!data && data.rows.length > 0;

  return (
    <PageShell>
      <BriefSheet
        file="01"
        mark={["LEAGUE", "STANDINGS"]}
        edition={`${seasonLabel(ROSTER_SEASON)} REGULAR SEASON`}
        report="LEAGUE-WIDE REPORT"
        kicker="Standings"
        title="NBA順位表"
        lead={`${seasonLabel(ROSTER_SEASON)}レギュラーシーズンの最新順位です。東西カンファレンス別に、試合結果をもとに毎日更新します。プレシーズンは含みません。`}
        side={
          data && hasRows ? (
            <BriefSide label="Data status">
              <p>集計済み: <strong className="text-foreground">{data.gamesCounted}試合</strong></p>
              {data.lastUpdatedAt && <p>最終更新: <strong className="text-foreground">{new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(data.lastUpdatedAt))}</strong></p>}
            </BriefSide>
          ) : undefined
        }
      >
        {error ? (
          <p className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>
        ) : !data || !hasRows ? (
          <p className="border border-line bg-surface px-4 py-8 text-sm text-muted">レギュラーシーズンの試合結果がまだないため、順位表は開幕後に表示します。</p>
        ) : (
          <>
            <StandingsBoard rows={data.rows} />
            <p className="mt-5 text-xs leading-6 text-muted">同率チームは勝率・勝数・敗数・チーム名の順で仮表示しています。NBA公式のタイブレーク基準による確定順位ではありません。</p>
            <p className="mt-1 text-xs leading-6 text-muted">WIN%：勝率／GB：首位とのゲーム差／CONF：同カンファレンスとの対戦成績／DIV：同ディビジョンとの対戦成績／HOME・ROAD：ホーム・アウェイの成績／LAST10：直近10試合の成績／STREAK：連勝（W）・連敗（L）</p>
          </>
        )}
      </BriefSheet>
    </PageShell>
  );
}
