import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { teamThemeBackground } from "@/lib/team-colors";
import { TeamRosterProfileTable } from "@/components/team-roster-profile-table";
import {
  TeamRosterStatsTable,
  type TeamStatsRow,
} from "@/components/team-roster-stats-table";
import { TeamProfileView } from "@/components/team-profile-view";
import { SeasonSelect } from "@/components/season-select";
import { SeasonStatsUnregistered } from "@/components/season-stats-unregistered";
import { deriveStats, toRawStatTotals } from "@/lib/stats";
import {
  ROSTER_SEASON,
  STATS_SEASON,
  ageReferenceFor,
  ageReferenceText,
  parseSeasonParam,
  seasonLabel,
  seasonOptionLinks,
  seasonSearch,
} from "@/lib/seasons";
import { fetchTeamProfileData } from "@/lib/team-profile-data";
import {
  buildSeasonProfileRows,
  fetchTeamSnapshotRoster,
  fetchTeamStatsSeasonRecord,
  formatJapaneseDate,
  type TeamStatsSeasonRecord,
} from "@/lib/team-season-data";

// 選手名鑑(チーム別)。?season= でシーズンを、?view= で Profile / Stats / Team Profile を切り替える。
// ・2026-27(初期表示): ロスター・プロフィールは固定スナップショット(2026-10-21時点)の値。成績は登録されるまで「未登録」
// ・2025-26: そのシーズンにこのチームでプレーした選手(成績から復元)と、このチームでの成績

type GuideView = "profile" | "stats" | "team-profile";

const VIEW_OPTIONS: { view: GuideView; label: string }[] = [
  { view: "profile", label: "Profile" },
  { view: "stats", label: "Stats" },
  { view: "team-profile", label: "Team Profile" },
];

// 成績から、選手ごとのこのチームでのレギュラーシーズン成績の行を作る(PTS降順。成績がない選手は末尾)
function buildTeamStatsRows(record: TeamStatsSeasonRecord, teamAbbr: string): TeamStatsRow[] {
  const rows: TeamStatsRow[] = record.players.map((player) => {
    const statRow = record.regularSeasonStats.find((s) => s.player_id === player.id);
    return {
      id: player.id,
      name: player.full_name_ja ?? player.full_name,
      teamAbbr,
      position: player.position,
      gamesPlayed: statRow?.games_played ?? null,
      stats: statRow ? deriveStats(toRawStatTotals(statRow)) : null,
    };
  });
  rows.sort((a, b) => {
    const aHasStats = a.stats !== null;
    const bHasStats = b.stats !== null;
    if (aHasStats !== bHasStats) return aHasStats ? -1 : 1;
    if (aHasStats && bHasStats) return (b.stats!.ppg ?? 0) - (a.stats!.ppg ?? 0);
    return a.name.localeCompare(b.name, "ja");
  });
  return rows;
}

export default async function PlayerGuideTeamPage({
  params,
  searchParams,
}: PageProps<"/players/guide/[teamId]">) {
  const { teamId } = await params;
  const { view: viewParam, season: seasonParam } = await searchParams;
  const selectedView: GuideView =
    viewParam === "stats" ? "stats" : viewParam === "team-profile" ? "team-profile" : "profile";
  const season = parseSeasonParam(seasonParam);
  const label = seasonLabel(season);

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
  const viewQuery = selectedView === "profile" ? null : selectedView;

  const viewToggle = (
    <div className="mb-6 flex flex-wrap gap-2">
      {VIEW_OPTIONS.map((opt) => (
        <Link
          key={opt.view}
          href={`/players/guide/${teamId}${seasonSearch(season, { view: opt.view === "profile" ? null : opt.view })}`}
          aria-current={selectedView === opt.view ? "page" : undefined}
          className={`px-4 py-2 text-sm font-bold transition-colors ${
            selectedView === opt.view
              ? teamColor
                ? "border border-surface bg-surface text-foreground"
                : "bg-blue text-white"
              : "border border-line text-muted hover:text-foreground"
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
        選手名鑑 {label} · {team.abbreviation}
      </p>
      <h1 className="mb-3 text-[32px] font-semibold tracking-tight sm:text-[36px]">
        {team.name}
      </h1>
      <p className="mb-5 text-sm">
        <Link
          href={`/teams/${teamId}${seasonSearch(season)}`}
          className="font-semibold text-foreground underline underline-offset-4 hover:no-underline"
        >
          {label}チームページ（Overview・Profile・Stats）→
        </Link>
      </p>
      <SeasonSelect season={season} options={seasonOptionLinks(`/players/guide/${teamId}`, { view: viewQuery })} />
    </>
  );

  // Team Profile(基本情報・ホームアリーナ・フロント・2026-27のコーチ陣・確認情報)。シーズンを問わず同じ内容
  if (selectedView === "team-profile") {
    const { profile, staff, arena, valuation } = await fetchTeamProfileData(supabase, teamId);
    return (
      <PageShell teamColor={teamColor}>
        {header}
        {viewToggle}
        {season !== ROSTER_SEASON && (
          <p className="mb-4 border-l-[3px] border-gold pl-3 text-xs font-bold text-foreground">
            Team Profile（基本情報・ホームアリーナ・フロント・コーチ陣）は、シーズンを問わず{seasonLabel(ROSTER_SEASON)}時点の情報を表示しています。
          </p>
        )}
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

  const [snapshotRoster, record] = await Promise.all([
    fetchTeamSnapshotRoster(supabase, teamId, season),
    fetchTeamStatsSeasonRecord(supabase, teamId, season),
  ]);
  const hasStats = record.regularSeasonStats.length > 0;

  // ロスターも成績もないシーズン
  if (!snapshotRoster && record.players.length === 0) {
    return (
      <PageShell teamColor={teamColor}>
        {header}
        {viewToggle}
        <div className="border border-line bg-surface p-10 text-center">
          <p className="text-lg font-bold">ロスター準備中</p>
          <p className="mt-2 text-sm text-muted">
            {label}シーズンのロスター情報はまだ登録されていません。
          </p>
        </div>
      </PageShell>
    );
  }

  let content: ReactNode;
  if (selectedView === "profile") {
    content = snapshotRoster ? (
      <div>
        <p className="mb-4 border-l-[3px] border-gold pl-3 text-xs font-bold text-foreground">
          {formatJapaneseDate(snapshotRoster.snapshot.as_of)}時点の{label}ロスター（固定スナップショット）です。POS・身長・体重・生年月日・出身校・経験年数はこの時点の値で、背番号は元データに無いため空欄です。TW = Two-Way 契約。「—」はデータなし。
        </p>
        <TeamRosterProfileTable rows={snapshotRoster.rows} />
      </div>
    ) : (
      <div>
        <p className="mb-4 border-l-[3px] border-gold pl-3 text-xs font-bold text-foreground">
          {label}レギュラーシーズンにこのチームで出場した選手です（シーズン途中の移籍選手を含む）。出場試合はこのチームでの試合数。POSは現在の登録値、年齢は{ageReferenceText(season)}時点です。
        </p>
        <TeamRosterProfileTable rows={buildSeasonProfileRows(record, ageReferenceFor(season))} variant="season" />
      </div>
    );
  } else if (hasStats) {
    content = (
      <div>
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
          {label} ROSTER STATS
        </p>
        <p className="mb-4 border-l-[3px] border-gold pl-3 text-xs font-bold text-foreground">
          {label}レギュラーシーズンに、このチームで出場した選手のこのチームでの成績です（シーズン途中の移籍選手を含む）。
        </p>
        <TeamRosterStatsTable rows={buildTeamStatsRows(record, team.abbreviation)} />
      </div>
    );
  } else {
    content = (
      <SeasonStatsUnregistered
        seasonLabel={label}
        fallbackHref={
          season !== STATS_SEASON
            ? `/players/guide/${teamId}${seasonSearch(STATS_SEASON, { view: "stats" })}`
            : undefined
        }
        fallbackLabel={`${seasonLabel(STATS_SEASON)}シーズンのスタッツを見る`}
      />
    );
  }

  return (
    <PageShell teamColor={teamColor}>
      {header}
      {viewToggle}
      {content}
    </PageShell>
  );
}
