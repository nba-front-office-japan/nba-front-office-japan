import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { teamThemeBackground } from "@/lib/team-colors";
import { TeamRosterProfileTable } from "@/components/team-roster-profile-table";
import { TeamRosterStatsTable } from "@/components/team-roster-stats-table";
import { TeamProfileView } from "@/components/team-profile-view";
import { ROSTER_SEASON, STATS_SEASON, seasonLabel } from "@/lib/seasons";
import { fetchTeamProfileData } from "@/lib/team-profile-data";
import { fetchPriorSeasonStatsRows, fetchTeamSnapshotRoster, formatJapaneseDate } from "@/lib/team-season-data";

// 選手名鑑(チーム別)。対象は 2026-27 だけ。?view= で Profile / Stats / Team Profile を切り替える。
// ・ロスター・プロフィール: 2026-27 開幕時点の固定スナップショット(roster_snapshots)。シーズン途中の移籍・解雇は反映しない
// ・Stats: その選手たちの 2025-26 レギュラーシーズンの最終成績(player_stats)。2026-27 の試合の成績は加えない
// 25-26 の開幕ロスターの記録はないため、25-26 の選手名鑑は作らない(?season= は受け付けず、2026-27 の URL へ移す)。
// 現在のロスター・今季の成績は Teams(/teams/[teamId])で扱い、このページからは変えない。

const ROSTER_LABEL = seasonLabel(ROSTER_SEASON);
const STATS_LABEL = seasonLabel(STATS_SEASON);

type GuideView = "profile" | "stats" | "team-profile";

const VIEW_OPTIONS: { view: GuideView; label: string }[] = [
  { view: "profile", label: "Profile" },
  { view: "stats", label: "Stats" },
  { view: "team-profile", label: "Team Profile" },
];

function guideHref(teamId: string, view: GuideView): string {
  return view === "profile" ? `/players/guide/${teamId}` : `/players/guide/${teamId}?view=${view}`;
}

export default async function PlayerGuideTeamPage({
  params,
  searchParams,
}: PageProps<"/players/guide/[teamId]">) {
  const { teamId } = await params;
  const { view: viewParam, season: seasonParam } = await searchParams;
  const selectedView: GuideView =
    viewParam === "stats" ? "stats" : viewParam === "team-profile" ? "team-profile" : "profile";

  // 選手名鑑は 2026-27 だけ。以前の ?season= 付きの URL は、シーズン指定なしの URL へ移す
  if (seasonParam !== undefined) redirect(guideHref(teamId, selectedView));

  const supabase = createServerSupabaseClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    notFound();
  }

  // チームページ(/teams/[teamId])と同じく、ヘッダーより下の背景をチームのメインカラーにする
  const teamColor = teamThemeBackground(team.abbreviation);

  const tabAccent = teamColor ?? "#1f63e9";
  const viewToggle = (
    <div
      className="mb-6 flex flex-wrap gap-2"
      style={{
        "--team-tab-accent": tabAccent,
        "--team-tab-tint": `${tabAccent}20`,
      } as CSSProperties}
    >
      {VIEW_OPTIONS.map((opt) => (
        <Link
          key={opt.view}
          href={guideHref(teamId, opt.view)}
          aria-current={selectedView === opt.view ? "page" : undefined}
          className={`rounded-lg border px-4 py-2 text-sm font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            selectedView === opt.view
              ? teamColor
                ? "border-white bg-white text-[var(--team-tab-accent)] shadow-sm"
                : "border-blue bg-blue text-white"
              : teamColor
                ? "border-white/35 bg-white/[.06] text-white hover:-translate-y-0.5 hover:scale-[1.06] hover:border-white hover:bg-white hover:text-[var(--team-tab-accent)] hover:shadow-lg active:translate-y-1 active:scale-[0.92]"
                : "border-line text-muted hover:-translate-y-0.5 hover:scale-[1.06] hover:border-[var(--team-tab-accent)] hover:bg-[var(--team-tab-accent)] hover:text-white hover:shadow-lg active:translate-y-1 active:scale-[0.92]"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );

  const header = (
    <>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        選手名鑑 {ROSTER_LABEL} · {team.abbreviation}
      </p>
      <h1 className="mb-3 text-[32px] font-semibold tracking-tight sm:text-[36px]">
        {team.name}
      </h1>
      <p className="mb-6 text-sm">
        <Link
          href={`/teams/${teamId}`}
          className="font-semibold text-foreground underline underline-offset-4 hover:no-underline"
        >
          Teams（{team.abbreviation} のチームページ）→
        </Link>
      </p>
    </>
  );

  // Team Profile(基本情報・ホームアリーナ・フロント・2026-27のコーチ陣・確認情報)
  if (selectedView === "team-profile") {
    const { profile, staff, arena, valuation } = await fetchTeamProfileData(supabase, teamId);
    return (
      <PageShell teamColor={teamColor}>
        {header}
        {viewToggle}
        <TeamProfileView
          team={team}
          profile={profile}
          arena={arena}
          valuation={valuation}
          assistantCoaches={staff}
        />
      </PageShell>
    );
  }

  const roster = await fetchTeamSnapshotRoster(supabase, teamId, ROSTER_SEASON);

  if (!roster || roster.rows.length === 0) {
    return (
      <PageShell teamColor={teamColor}>
        {header}
        {viewToggle}
        <div className="border border-line bg-surface p-10 text-center">
          <p className="text-lg font-bold">ロスター準備中</p>
          <p className="mt-2 text-sm text-muted">
            {ROSTER_LABEL}開幕時点のロスター情報はまだ登録されていません。
          </p>
        </div>
      </PageShell>
    );
  }

  const asOfText = formatJapaneseDate(roster.snapshot.as_of);
  const statsRows = selectedView === "stats" ? await fetchPriorSeasonStatsRows(supabase, roster.rows, STATS_SEASON) : [];

  return (
    <PageShell teamColor={teamColor}>
      {header}
      {viewToggle}

      {selectedView === "profile" ? (
        <div>
          <p className="mb-4 border-l-[3px] border-gold pl-3 text-xs font-bold text-foreground">
            {ROSTER_LABEL}開幕時点（{asOfText}）のロスターです。シーズン途中の移籍・解雇は反映しません（現在のロスターは Teams をご覧ください）。POS・身長・体重・生年月日・出身校・経験年数はこの時点の値で、背番号は元データに無いため空欄です。TW = Two-Way 契約。「—」はデータなし。
          </p>
          <TeamRosterProfileTable rows={roster.rows} />
        </div>
      ) : (
        <div>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
            {STATS_LABEL} FINAL STATS
          </p>
          <p className="mb-4 border-l-[3px] border-gold pl-3 text-xs font-bold text-foreground">
            {ROSTER_LABEL}開幕ロスターの選手の、{STATS_LABEL}レギュラーシーズンの最終成績です（{STATS_LABEL}に複数チームでプレーした選手はシーズン合計。チーム欄は{STATS_LABEL}の所属）。{ROSTER_LABEL}の試合の成績は含みません。{STATS_LABEL}の出場がない選手は末尾に「—」で表示します。
          </p>
          <TeamRosterStatsTable rows={statsRows} />
        </div>
      )}
    </PageShell>
  );
}
