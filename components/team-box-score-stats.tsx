import Link from "next/link";
import { TeamRosterStatsTable } from "@/components/team-roster-stats-table";
import { formatJapaneseDate } from "@/lib/team-season-data";
import type { TeamBoxScoreSeasonStats } from "@/lib/team-box-score-stats";

// Teams の 2026-27 Stats: 取り込んだボックススコアから集計したレギュラーシーズン累計(1試合平均)。
// ロスターの選手の表と、今季このチームで出場したがロスターにいない選手の表を出す。
export function TeamBoxScoreStats({
  seasonLabel,
  teamName,
  stats,
}: {
  seasonLabel: string;
  teamName: string;
  stats: TeamBoxScoreSeasonStats;
}) {
  const notes: string[] = [];
  if (stats.incompleteGames > 0) {
    notes.push(`${stats.incompleteGames}試合は、個人成績の一部が取得元データで不足しているため、チーム合計と一致しない場合があります。`);
  }
  if (stats.unmatchedRows > 0) {
    notes.push(`選手データと照合できない出場記録が${stats.unmatchedRows}件あり、この表には含めていません。`);
  }
  if (stats.unclassifiedGames > 0) {
    notes.push(`試合の種別を確認できない${stats.unclassifiedGames}試合は集計していません。`);
  }

  return (
    <div className="border border-line bg-surface p-6">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        {seasonLabel} Regular Season Stats
      </p>
      <h2 className="mb-1 text-lg font-semibold">選手成績（1試合平均）</h2>
      <p className="mb-4 text-xs text-muted">
        {stats.lastGameDate ? `${formatJapaneseDate(stats.lastGameDate)}（米国日付）の試合まで、` : ""}
        {teamName}の{seasonLabel}レギュラーシーズン{stats.gamesCounted}試合を、
        <Link href="/games" className="underline underline-offset-2 hover:no-underline">
          試合結果＆ボックススコア
        </Link>
        から集計しています（プレシーズンは含みません）。成績はこのチームでの出場分です。選手はTeamsのロスターの選手で、出場のない選手は末尾に「—」で表示します。
      </p>
      {notes.length > 0 && (
        <ul className="mb-4 space-y-1 border-l-[3px] border-gold pl-3 text-xs font-bold text-foreground">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>
      <TeamRosterStatsTable rows={stats.rosterRows} variant="team" />

      {stats.formerRows.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-1 text-base font-semibold">ロスター外の選手（今季このチームで出場）</h3>
          <p className="mb-3 text-xs text-muted">
            移籍・契約解除などで現在のロスターにいない選手の、このチームでの成績です。
          </p>
          <TeamRosterStatsTable rows={stats.formerRows} variant="team" />
        </div>
      )}
    </div>
  );
}
