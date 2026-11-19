// 過去シーズンの最終順位表(/standings/2024-25 など)。historical_games(balldontlie から取り込んだ過去の試合結果)の
// レギュラーシーズンの試合を、今季の順位表と同じ集計(buildStandingRows)にかける。
// ・チームは今のフランチャイズで持っているので、当時の名前・略称・地区は lib/historical-teams.ts で置き換える
// ・レギュラーシーズンの順位に入らない試合(NBAカップ決勝など)は EXCLUDED_GAME_IDS で外す
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { teamNameJa } from "@/lib/team-names-ja";
import { buildStandingRows, type StandingRow } from "@/lib/standings";
import { ROSTER_SEASON, seasonLabel } from "@/lib/seasons";
import { historicalTeamAlignment, historicalTeamIdentity, teamExistedIn } from "@/lib/historical-teams";

type Client = SupabaseClient<Database>;

/** 過去の順位表を出せるシーズン(開始年)。historical_games に取り込んだ範囲 */
export const HISTORICAL_STANDINGS_FIRST_SEASON = 2003;
export const HISTORICAL_STANDINGS_LAST_SEASON = 2025;

export function historicalStandingsSeasons(): number[] {
  const seasons: number[] = [];
  for (let s = HISTORICAL_STANDINGS_LAST_SEASON; s >= HISTORICAL_STANDINGS_FIRST_SEASON; s--) seasons.push(s);
  return seasons;
}

/** 順位表のシーズン切り替えの選択肢(今季は /standings、過去は /standings/2024-25) */
export function standingsSeasonOptions() {
  return [ROSTER_SEASON, ...historicalStandingsSeasons()].map((s) => ({
    season: s,
    label: seasonLabel(s),
    href: s === ROSTER_SEASON ? "/standings" : `/standings/${seasonSlug(s)}`,
  }));
}

/** URL のシーズン(例: 2024-25)を開始年にする。形が違う・範囲外は null */
export function parseSeasonSlug(slug: string): number | null {
  const m = /^(\d{4})-(\d{2})$/.exec(slug);
  if (!m) return null;
  const season = Number(m[1]);
  if (String((season + 1) % 100).padStart(2, "0") !== m[2]) return null;
  if (season < HISTORICAL_STANDINGS_FIRST_SEASON || season > HISTORICAL_STANDINGS_LAST_SEASON) return null;
  return season;
}

export function seasonSlug(season: number): string {
  return `${season}-${String((season + 1) % 100).padStart(2, "0")}`;
}

// balldontlie ではレギュラーシーズン扱いだが、順位(勝敗)に入らない試合(source_game_id)。
// NBAカップ決勝は勝敗に数えない(2023-24 から)。2026-11-19 の取り込み後に、試合数と日程で確認したもの。
const EXCLUDED_GAME_IDS: Record<number, number[]> = {
  2023: [8258317], // 2023-12-09 NBAカップ決勝 IND vs LAL
  2024: [17195500], // 2024-12-17 NBAカップ決勝 MIL vs OKC
  2025: [20377171], // 2025-12-16 NBAカップ決勝 SAS vs NYK
};

// 各チームのレギュラーシーズンの試合数。これを超える試合(シーズン終了後のプレーイン。balldontlie ではレギュラーシーズン扱い)は数えない。
// 2019-20 はバブルでチームごとに違うため上限なし(プレーインはプレーオフ扱いで入っていない)。
function regularSeasonGames(season: number): number | null {
  if (season === 2019) return null;
  if (season === 2011) return 66;
  if (season === 2020) return 72;
  return 82;
}

// balldontlie で得点が途中(延長の途中)で止まり、同点になっている試合の最終スコア(複数延長の試合)。
// source_game_id → [アウェイ, ホーム]
const SCORE_CORRECTIONS: Record<number, [number, number]> = {
  28012: [133, 139], // 2012-03-25 UTA @ ATL(ホークスが延長で勝利)
  32587: [144, 147], // 2015-12-18 DET @ CHI(ブルズが4OTで勝利)
  34714: [139, 142], // 2017-01-29 NYK @ ATL(ホークスが4OTで勝利)
  48851: [168, 161], // 2019-03-01 CHI @ ATL(ブルズが4OTで勝利)
};

// シーズンの注記(試合数が通常の82試合と違うシーズンなど)
export const SEASON_NOTES: Record<number, string> = {
  2011: "ロックアウトにより、各チーム66試合の短縮シーズンでした。",
  2019: "新型コロナウイルスの影響でシーズンが中断され、再開後はフロリダ州の「バブル」で22チームが順位決定のための試合を行いました。そのため、チームごとに試合数が違います（63〜75試合）。",
  2020: "新型コロナウイルスの影響で、各チーム72試合の短縮シーズンでした。",
};

export interface HistoricalStandings {
  rows: StandingRow[];
  gamesCounted: number;
}

export async function fetchHistoricalStandings(supabase: Client, season: number): Promise<HistoricalStandings> {
  const [teamsResult, gamesResult] = await Promise.all([
    supabase.from("teams").select("id, name, abbreviation, conference, division").order("name"),
    fetchAllRows<{ source_game_id: number; game_date: string; home_team_id: string; away_team_id: string; home_score: number; away_score: number }>((from, to) =>
      supabase
        .from("historical_games")
        .select("source_game_id, game_date, home_team_id, away_team_id, home_score, away_score")
        .eq("season", season)
        .eq("postseason", false)
        .order("game_date")
        .order("source_game_id")
        .range(from, to)
    ),
  ]);
  if (teamsResult.error) throw new Error(`チーム情報の取得に失敗しました: ${teamsResult.error.message}`);
  if (gamesResult.error) throw new Error(`試合結果の取得に失敗しました: ${gamesResult.error.message}`);

  const excluded = new Set(EXCLUDED_GAME_IDS[season] ?? []);
  const cap = regularSeasonGames(season);
  const played = new Map<string, number>();
  const games = [];
  // 日付の古い順に数え、どちらかのチームがシーズンの試合数に達した後の試合(プレーイン)は外す
  for (const g of gamesResult.data) {
    if (excluded.has(g.source_game_id)) continue;
    const home = played.get(g.home_team_id) ?? 0;
    const away = played.get(g.away_team_id) ?? 0;
    if (cap !== null && (home >= cap || away >= cap)) continue;
    played.set(g.home_team_id, home + 1);
    played.set(g.away_team_id, away + 1);
    const corrected = SCORE_CORRECTIONS[g.source_game_id];
    games.push(corrected ? { ...g, away_score: corrected[0], home_score: corrected[1] } : g);
  }

  const teams = (teamsResult.data ?? [])
    .filter((team) => teamExistedIn(team.abbreviation, season))
    .map((team) => {
      const identity = historicalTeamIdentity(team.abbreviation, season);
      const alignment = historicalTeamAlignment(team.abbreviation, season, team);
      return {
        teamId: team.id,
        abbreviation: identity?.abbreviation ?? team.abbreviation,
        name: identity?.name ?? team.name,
        nameJa: identity?.nameJa ?? teamNameJa(team.abbreviation) ?? team.name,
        conference: alignment.conference as StandingRow["conference"],
        division: alignment.division,
      };
    });

  return { rows: buildStandingRows(teams, games), gamesCounted: games.length };
}
