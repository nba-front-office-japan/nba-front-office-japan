import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { TeamTabs, type TeamTab } from "@/components/team-tabs";
import { StatsTable, type StatRow } from "@/components/stats-table";
import { TeamRosterProfileTable } from "@/components/team-roster-profile-table";
import { TeamProfileView } from "@/components/team-profile-view";
import { SeasonSelect } from "@/components/season-select";
import { SeasonStatsUnregistered } from "@/components/season-stats-unregistered";
import { deriveStats, formatStat, toRawStatTotals } from "@/lib/stats";
import { ageAt } from "@/lib/age";
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
import { teamThemeBackground } from "@/lib/team-colors";
import { fetchTeamProfileData } from "@/lib/team-profile-data";
import {
  buildSeasonProfileRows,
  fetchTeamSnapshotRoster,
  fetchTeamStatsSeasonRecord,
  formatJapaneseDate,
} from "@/lib/team-season-data";
import { fetchTeamBoxScoreSeasonStats } from "@/lib/team-box-score-stats";
import { TeamBoxScoreStats } from "@/components/team-box-score-stats";
import type { Database } from "@/lib/supabase/types";

// /teams/[teamId] はシーズンごとのチームページ(Profile / Stats / Team Profile)。
// ?season= でシーズンを切り替える(初期表示は 2026-27。?season=2025 で 2025-26)。
// ・2026-27: ロスターは固定スナップショット(最新の基準日)。成績は取り込んだボックススコアのレギュラーシーズンの試合から
//   集計する(lib/team-box-score-stats.ts)。試合が無い間は「未登録」と表示する
// ・2025-26: レギュラーシーズン・プレーオフの成績から復元したチーム記録
// タブは ?tab=profile / ?tab=stats / ?tab=team-profile で直接開ける(Teams一覧のリンクもこのURLを使う)。?tab= なしは Team Profile。
// チームの概要(人数・平均年齢など)とシーズン切り替えは Team Profile タブだけに出す。

type PlayerStatsRow = Database["public"]["Tables"]["player_stats"]["Row"];

function toStatRow(
  s: PlayerStatsRow,
  playerName: string,
  teamAbbrById: Map<string, string>
): StatRow {
  return {
    id: s.id,
    playerName,
    teamLabel: s.team_id ? teamAbbrById.get(s.team_id) ?? "-" : "TOT",
    seasonType: s.season_type,
    gamesPlayed: s.games_played,
    minutesPlayed: s.minutes_played,
    points: s.points,
    reboundsOffensive: s.rebounds_offensive,
    reboundsDefensive: s.rebounds_defensive,
    reboundsTotal: s.rebounds_total,
    assists: s.assists,
    steals: s.steals,
    blocks: s.blocks,
    turnovers: s.turnovers,
    personalFouls: s.personal_fouls,
    fieldGoalsMade: s.field_goals_made,
    fieldGoalsAttempted: s.field_goals_attempted,
    threePointersMade: s.three_pointers_made,
    threePointersAttempted: s.three_pointers_attempted,
    freeThrowsMade: s.free_throws_made,
    freeThrowsAttempted: s.free_throws_attempted,
  };
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TeamDetailPage({
  params,
  searchParams,
}: PageProps<"/teams/[teamId]">) {
  const { teamId } = await params;
  const { season: seasonParam, view: viewParam, tab: tabParam } = await searchParams;

  // 移した表示は選手名鑑の Team Profile へ恒久転送する(公開済みURLのリンク切れを防ぐ)
  if (viewParam === "profile") {
    permanentRedirect(`/players/guide/${teamId}?view=team-profile`);
  }

  const season = parseSeasonParam(seasonParam);
  const label = seasonLabel(season);
  const tab = firstParam(tabParam);
  const initialTab: TeamTab =
    // ?tab=roster は公開済みURLの互換のため、Profileタブとして扱う
    tab === "profile" || tab === "roster"
      ? "Profile"
      : tab === "stats"
        ? "Stats"
        : // ?tab=team-profile と ?tab= なし(旧 Overview の URL を含む)は Team Profile(チームの概要)を開く
          "Team Profile";

  const supabase = createServerSupabaseClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    notFound();
  }

  // ヘッダーより下の背景をチームのメインカラーにする(白文字が読める濃さに補正済み)
  const teamColor = teamThemeBackground(team.abbreviation);

  const [{ data: allTeams }, record, snapshotRoster, teamProfileData] = await Promise.all([
    supabase.from("teams").select("id, abbreviation").order("name"),
    fetchTeamStatsSeasonRecord(supabase, teamId, season),
    fetchTeamSnapshotRoster(supabase, teamId, season),
    fetchTeamProfileData(supabase, teamId),
  ]);
  const teamAbbrById = new Map((allTeams ?? []).map((t) => [t.id, t.abbreviation]));

  const playerNameById = new Map(
    record.players.map((p) => [p.id, p.full_name_ja ?? p.full_name])
  );
  const statRows: StatRow[] = record.resolvedStats.map((s) =>
    toStatRow(s, playerNameById.get(s.player_id) ?? "不明な選手", teamAbbrById)
  );
  const hasStats = record.regularSeasonStats.length > 0;

  // Stats: 成績が登録されていれば表、未登録のシーズンは「未登録」と表示する(成績を登録すると自動で表に替わる)
  const statsContent = hasStats ? (
    <div className="border border-line bg-surface p-6">
      <StatsTable rows={statRows} />
    </div>
  ) : (
    <SeasonStatsUnregistered
      seasonLabel={label}
      fallbackHref={season !== STATS_SEASON ? `/teams/${teamId}${seasonSearch(STATS_SEASON, { tab: "stats" })}` : undefined}
      fallbackLabel={`${seasonLabel(STATS_SEASON)}シーズンのスタッツを見る`}
    />
  );

  // シーズン切り替え(Team Profile タブの中に置く。切り替えた後も Team Profile を開く)
  const seasonSelect = (
    <SeasonSelect season={season} options={seasonOptionLinks(`/teams/${teamId}`, { tab: "team-profile" })} />
  );

  const guideLink = (
    <p className="text-sm">
      <Link
        href={`/players/guide/${teamId}`}
        className="font-semibold text-foreground underline underline-offset-4 hover:no-underline"
      >
        {/* 選手名鑑は 2026-27 開幕ロスターだけ(どのシーズンを表示中でも同じリンク) */}
        選手名鑑 {seasonLabel(ROSTER_SEASON)}（開幕ロスター・Team Profile）→
      </Link>
    </p>
  );

  // Team Profile タブ: シーズン切り替え・チームの概要(旧 Overview)・選手名鑑への導線・基本情報(アリーナ・フロント・コーチ陣)。
  // チームの概要はこのタブだけに出し、Profile・Stats には出さない
  const teamProfileTab = (summary: ReactNode) => (
    <div>
      {seasonSelect}
      {summary}
      <div className="mt-4">{guideLink}</div>
      <div className="mt-8">
        {season !== ROSTER_SEASON && (
          <p className="mb-4 border-l-[3px] border-gold pl-3 text-xs font-bold text-foreground">
            Team Profile（基本情報・ホームアリーナ・フロント・コーチ陣）は、シーズンを問わず{seasonLabel(ROSTER_SEASON)}時点の情報を表示しています。
          </p>
        )}
        <TeamProfileView
          team={team}
          profile={teamProfileData.profile}
          arena={teamProfileData.arena}
          valuation={teamProfileData.valuation}
          assistantCoaches={teamProfileData.staff}
        />
      </div>
    </div>
  );

  // タブの上には、チーム名と表示中のシーズンだけを出す(人数・平均年齢などの概要は Team Profile タブ)
  // 余白は詰める: 上はページ共通の余白(main の py-8 / sm:py-10)を少し打ち消し、チーム名の行の高さを詰め、タブとの間は小さくする
  // (タブ自体の押しやすさ(py-3.5)は変えない)
  const pageTitle = (
    <div className="-mt-3 mb-1 text-foreground sm:-mt-4 sm:mb-2">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-muted">{label} Season</p>
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[36px]">{team.name}</h1>
    </div>
  );

  // チームの概要の数値カード(旧 Overview)
  const summaryCards = (kicker: string, cells: [string, string][], columnsClass: string, coverage: ReactNode) => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="border border-line bg-surface p-6">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">{kicker}</p>
        <h2 className="mb-4 text-xl font-semibold">{team.name}</h2>
        <div className={`grid grid-cols-1 gap-px bg-line ${columnsClass}`}>
          {cells.map(([metric, value]) => (
            <div key={metric} className="bg-surface p-4">
              <span className="mb-1.5 block text-[11px] text-muted">{metric}</span>
              <b className="text-[15px]">{value}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="border border-line bg-surface p-6">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
          Database Coverage
        </p>
        <h2 className="mb-2 text-lg font-semibold">収録データ</h2>
        <p className="text-sm text-muted">{coverage}</p>
      </div>
    </div>
  );

  // 固定スナップショットのあるシーズン(2026-27): スナップショット時点のロスターを表示する
  if (snapshotRoster) {
    const asOfText = formatJapaneseDate(snapshotRoster.snapshot.as_of);
    const rows = snapshotRoster.rows;
    const avgAgeText = snapshotRoster.averageAge === null ? "-" : snapshotRoster.averageAge.toFixed(1);
    // 成績は取り込んだボックススコアのレギュラーシーズンの試合から集計する(試合が無い間は「未登録」)
    const boxStats = await fetchTeamBoxScoreSeasonStats(supabase, team, season, rows);
    const hasBoxStats = boxStats.gamesCounted > 0;
    const snapshotStatsContent = hasBoxStats ? (
      <TeamBoxScoreStats seasonLabel={label} teamName={team.name} stats={boxStats} />
    ) : (
      statsContent
    );

    return (
      <PageShell teamColor={teamColor}>
        {pageTitle}
        <TeamTabs
          initialTab={initialTab}
          profile={
            <div className="border border-line bg-surface p-6">
              <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
                Profile · {label}
              </p>
              <h2 className="mb-1 text-lg font-semibold">選手プロフィール</h2>
              <p className="mb-4 text-xs text-muted">
                {asOfText}時点の{label}ロスターです。POS・身長・体重・生年月日・出身校・経験年数はこの時点の値です。TW = Two-Way 契約。「—」はデータなし。
              </p>
              <TeamRosterProfileTable rows={rows} />
            </div>
          }
          stats={snapshotStatsContent}
          teamProfile={teamProfileTab(
            summaryCards(
              `${label} Roster Snapshot`,
              [
                ["PLAYERS", `${rows.length}`],
                ["TWO-WAY", `${snapshotRoster.twoWayCount}`],
                ["ROOKIES", `${snapshotRoster.rookieCount}`],
                ["AVERAGE AGE", avgAgeText],
                ["ROSTER AS OF", asOfText],
                ["STATS", hasBoxStats ? `${boxStats.gamesCounted}試合を集計` : "未登録"],
              ],
              "sm:grid-cols-3",
              <>
                {asOfText}時点の{label}ロスター（選手名鑑と同じ開幕ロスターの固定スナップショット）です。自動では更新しません。背番号は元データに無いため空欄です。年齢は表示した日の時点。
                {hasBoxStats
                  ? `Statsは、取り込んだボックススコアから集計した${label}レギュラーシーズンの成績です（試合を取り込むと自動で更新）。`
                  : `${label}シーズンのスタッツは未登録です。`}
              </>
            )
          )}
        />
      </PageShell>
    );
  }

  // 成績から復元するシーズン(2025-26)
  const ageReference = ageReferenceFor(season);
  const playerSummaries = record.players.map((player) => {
    const statRow = record.regularSeasonStats.find((s) => s.player_id === player.id);
    const derived = statRow ? deriveStats(toRawStatTotals(statRow)) : null;
    return {
      fullName: player.full_name_ja ?? player.full_name,
      age: ageAt(player.birth_date, ageReference),
      ppg: derived?.ppg ?? null,
      rpg: derived?.rpg ?? null,
      apg: derived?.apg ?? null,
    };
  });

  const withStats = playerSummaries.filter((r) => r.ppg !== null);
  const leadingScorer = withStats.length
    ? withStats.reduce((a, b) => ((b.ppg ?? 0) > (a.ppg ?? 0) ? b : a))
    : null;
  const teamPpg = withStats.reduce((sum, r) => sum + (r.ppg ?? 0), 0);
  const teamRpg = withStats.reduce((sum, r) => sum + (r.rpg ?? 0), 0);
  const teamApg = withStats.reduce((sum, r) => sum + (r.apg ?? 0), 0);

  const threePctValues = record.regularSeasonStats
    .map((s) => deriveStats(toRawStatTotals(s)).threePct)
    .filter((v): v is number => v !== null);
  const avgThreePct = threePctValues.length
    ? threePctValues.reduce((a, b) => a + b, 0) / threePctValues.length
    : null;

  const agesKnown = playerSummaries.map((r) => r.age).filter((a): a is number => a !== null);
  const avgAge = agesKnown.length
    ? agesKnown.reduce((a, b) => a + b, 0) / agesKnown.length
    : null;

  // Profile: そのシーズンにこのチームでプレーした選手のプロフィール一覧(出場試合数の多い順)
  const rosterProfileRows = buildSeasonProfileRows(record, ageReference);

  return (
    <PageShell teamColor={teamColor}>
      {pageTitle}
      {record.playersError ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          在籍選手データの取得に失敗しました: {record.playersError}
        </p>
      ) : (
        <TeamTabs
          initialTab={initialTab}
          profile={
            <div className="border border-line bg-surface p-6">
              <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
                Profile · {label}
              </p>
              <h2 className="mb-1 text-lg font-semibold">選手プロフィール</h2>
              <p className="mb-4 text-xs text-muted">
                {label}レギュラーシーズンにこのチームで出場した選手です（シーズン途中の移籍選手を含む）。出場試合はこのチームでの試合数。POSは現在の登録値、年齢は{ageReferenceText(season)}時点です。
              </p>
              <TeamRosterProfileTable rows={rosterProfileRows} variant="season" />
            </div>
          }
          stats={statsContent}
          teamProfile={teamProfileTab(
            summaryCards(
              `${label} Team Snapshot`,
              [
                // 旧ヘッダーの PLAYERS・TEAM PPG もここにまとめる
                ["PLAYERS", String(playerSummaries.length)],
                ["TEAM PPG", withStats.length ? formatStat(teamPpg) : "-"],
                ["LEADING SCORER", leadingScorer?.fullName ?? "-"],
                ["TOP PPG", leadingScorer ? `${formatStat(leadingScorer.ppg)} PPG` : "-"],
                ["TEAM RPG", withStats.length ? formatStat(teamRpg) : "-"],
                ["TEAM APG", withStats.length ? formatStat(teamApg) : "-"],
                ["AVERAGE AGE", avgAge === null ? "-" : avgAge.toFixed(1)],
                ["3P%", avgThreePct === null ? "-" : `${avgThreePct.toFixed(1)}%`],
              ],
              "sm:grid-cols-2 xl:grid-cols-4",
              <>
                {label}レギュラーシーズンの成績から復元した、このチームの記録です。Profileは{label}にこのチームでプレーした選手のプロフィール、Statsは{label}の選手成績です。年齢は{ageReferenceText(season)}時点。
              </>
            )
          )}
        />
      )}
    </PageShell>
  );
}
