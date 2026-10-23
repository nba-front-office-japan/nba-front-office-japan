// Teams(/teams/[teamId])の 2026-27 Stats: 管理画面から取り込んだ試合のボックススコア(box_score_*)から、
// チームの選手のレギュラーシーズン累計を表示のたびに集計する(集計結果は保存しない)。
// ・対象はそのシーズンのレギュラーシーズンの試合だけ。プレシーズン(preseason_* の別テーブル)・プレーオフ等は入れない
//   - NBA の Game ID(0022600085 など): 先頭 "002" + シーズン下2桁 の試合だけ(001 プレシーズン / 004 プレーオフ /
//     005 プレーイン / 006 NBA Cup 決勝 などは除く)
//   - Basketball-Reference の Game ID(202610200DET など。種別を含まない): 日程(games)に同じ日付・同じ対戦の
//     そのシーズンのレギュラーシーズン(postseason = false)の試合がある場合だけ
//   - どちらとも判定できない試合は集計しない(件数だけ注記する)
// ・同じ試合が別の Game ID で2回取り込まれていても(同じ日付・同じ対戦)、最後に取り込んだ方だけを数える
// ・Excel を取り込み直すと試合の行が入れ替わるため(import_box_scores)、ここでの集計も自動で最新になる
// ・選手の成績は「このチームでの出場分」(box_score_players.team_id がこのチーム)だけを足す。
//   表示する選手はロスター(最新のスナップショット)の選手。今季このチームで出場したがロスターにいない選手(移籍・解雇など)は別に返す
import "server-only";
import type { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { ProfileRow } from "@/components/team-roster-profile-table";
import type { TeamStatsRow } from "@/components/team-roster-stats-table";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { deriveStats, type RawStatTotals } from "@/lib/stats";

type ServerClient = ReturnType<typeof createServerSupabaseClient>;
type BoxGameRow = Database["public"]["Tables"]["box_score_games"]["Row"];
type BoxPlayerRow = Database["public"]["Tables"]["box_score_players"]["Row"];

// レギュラーシーズンの開幕日(米国の日付)。これより前の試合はレギュラーシーズンとして数えない(念のための確認)
const REGULAR_SEASON_OPENER: Record<number, string> = {
  2026: "2026-10-20",
};

const NBA_GAME_ID = /^00(\d)(\d{2})\d{5}$/;
const BREF_GAME_ID = /^\d{8}0[A-Z]{3}$/;

export interface TeamBoxScoreSeasonStats {
  // ロスターの選手(成績が無い選手も含む。表で末尾に並ぶ)
  rosterRows: TeamStatsRow[];
  // 今季このチームで出場したが、ロスターにいない選手
  formerRows: TeamStatsRow[];
  // 集計したこのチームのレギュラーシーズンの試合数と、最後の試合日(米国の日付)
  gamesCounted: number;
  lastGameDate: string | null;
  // 取り込み済みだが集計しなかった試合: レギュラーシーズン以外 / 種別を判定できない / 別の Game ID の重複
  nonRegularGames: number;
  unclassifiedGames: number;
  duplicateGames: number;
  // 個人成績が取得元で不足している試合(チーム合計と一致しない場合がある)
  incompleteGames: number;
  // 選手データと照合できず、集計に入れられなかった出場行
  unmatchedRows: number;
}

type GameKind = "regular" | "other" | "unknown";

function classifyGame(game: BoxGameRow, season: number, scheduledRegular: Set<string>): GameKind {
  const opener = REGULAR_SEASON_OPENER[season];
  if (!opener || game.game_date < opener || game.game_date >= `${season + 1}-08-01`) return "other";
  const nba = NBA_GAME_ID.exec(game.bref_game_id);
  if (nba) {
    return nba[1] === "2" && nba[2] === String(season % 100).padStart(2, "0") ? "regular" : "other";
  }
  if (BREF_GAME_ID.test(game.bref_game_id)) {
    return scheduledRegular.has(matchupKey(game.game_date, game.home_team_id, game.away_team_id)) ? "regular" : "unknown";
  }
  return "unknown";
}

function matchupKey(date: string, homeTeamId: string, awayTeamId: string): string {
  return `${date}|${homeTeamId}|${awayTeamId}`;
}

const ZERO: RawStatTotals = {
  gamesPlayed: 0,
  minutesPlayed: 0,
  points: 0,
  reboundsOffensive: 0,
  reboundsDefensive: 0,
  reboundsTotal: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  personalFouls: 0,
  fieldGoalsMade: 0,
  fieldGoalsAttempted: 0,
  threePointersMade: 0,
  threePointersAttempted: 0,
  freeThrowsMade: 0,
  freeThrowsAttempted: 0,
};

// 1試合分の行を足す。出場時間は秒で保存しているため分に直す(MPG は合計から都度計算)
function addGame(acc: RawStatTotals, r: BoxPlayerRow): RawStatTotals {
  return {
    gamesPlayed: acc.gamesPlayed + 1,
    minutesPlayed: acc.minutesPlayed + (r.seconds_played ?? 0) / 60,
    points: acc.points + (r.pts ?? 0),
    reboundsOffensive: acc.reboundsOffensive + (r.oreb ?? 0),
    reboundsDefensive: acc.reboundsDefensive + (r.dreb ?? 0),
    reboundsTotal: acc.reboundsTotal + (r.reb ?? 0),
    assists: acc.assists + (r.ast ?? 0),
    steals: acc.steals + (r.stl ?? 0),
    blocks: acc.blocks + (r.blk ?? 0),
    turnovers: acc.turnovers + (r.tov ?? 0),
    personalFouls: acc.personalFouls + (r.pf ?? 0),
    fieldGoalsMade: acc.fieldGoalsMade + (r.fgm ?? 0),
    fieldGoalsAttempted: acc.fieldGoalsAttempted + (r.fga ?? 0),
    threePointersMade: acc.threePointersMade + (r.fg3m ?? 0),
    threePointersAttempted: acc.threePointersAttempted + (r.fg3a ?? 0),
    freeThrowsMade: acc.freeThrowsMade + (r.ftm ?? 0),
    freeThrowsAttempted: acc.freeThrowsAttempted + (r.fta ?? 0),
  };
}

export async function fetchTeamBoxScoreSeasonStats(
  supabase: ServerClient,
  team: { id: string; abbreviation: string },
  season: number,
  rosterRows: Pick<ProfileRow, "id" | "name" | "position">[]
): Promise<TeamBoxScoreSeasonStats> {
  const teamFilter = `home_team_id.eq.${team.id},away_team_id.eq.${team.id}`;
  const [{ data: boxGames }, { data: scheduled }] = await Promise.all([
    supabase
      .from("box_score_games")
      .select("*")
      .or(teamFilter)
      .gte("game_date", `${season}-08-01`)
      .lt("game_date", `${season + 1}-08-01`),
    supabase
      .from("games")
      .select("game_date, home_team_id, away_team_id")
      .eq("season", season)
      .eq("postseason", false)
      .or(teamFilter),
  ]);
  const scheduledRegular = new Set(
    (scheduled ?? []).map((g) => matchupKey(g.game_date, g.home_team_id, g.away_team_id))
  );

  let nonRegularGames = 0;
  let unclassifiedGames = 0;
  let duplicateGames = 0;
  // 同じ日付・同じ対戦は1試合として数える(最後に取り込んだ方を使う)
  const regularByMatchup = new Map<string, BoxGameRow>();
  for (const game of boxGames ?? []) {
    const kind = classifyGame(game, season, scheduledRegular);
    if (kind === "other") nonRegularGames++;
    else if (kind === "unknown") unclassifiedGames++;
    else {
      const key = matchupKey(game.game_date, game.home_team_id, game.away_team_id);
      const existing = regularByMatchup.get(key);
      if (existing) duplicateGames++;
      if (!existing || game.last_imported_at > existing.last_imported_at) regularByMatchup.set(key, game);
    }
  }
  const countedGames = [...regularByMatchup.values()];
  const gameIds = countedGames.map((g) => g.id);

  const { data: playerRows } =
    gameIds.length > 0
      ? await fetchAllRows<BoxPlayerRow>((from, to) =>
          supabase
            .from("box_score_players")
            .select("*")
            .in("game_id", gameIds)
            .eq("team_id", team.id)
            .neq("role", "dnp")
            .order("id")
            .range(from, to)
        )
      : { data: [] as BoxPlayerRow[] };

  const totalsByPlayer = new Map<string, RawStatTotals>();
  let unmatchedRows = 0;
  for (const row of playerRows) {
    if (!row.player_id) {
      unmatchedRows++;
      continue;
    }
    totalsByPlayer.set(row.player_id, addGame(totalsByPlayer.get(row.player_id) ?? ZERO, row));
  }

  const toRow = (id: string, name: string, position: string | null): TeamStatsRow => {
    const totals = totalsByPlayer.get(id);
    return {
      id,
      name,
      teamAbbr: team.abbreviation,
      position,
      gamesPlayed: totals?.gamesPlayed ?? null,
      stats: totals ? deriveStats(totals) : null,
    };
  };

  const rosterIds = new Set(rosterRows.map((r) => r.id));
  const formerIds = [...totalsByPlayer.keys()].filter((id) => !rosterIds.has(id));
  const { data: formerPlayers } =
    formerIds.length > 0
      ? await supabase.from("players").select("id, full_name, full_name_ja, position").in("id", formerIds)
      : { data: [] as { id: string; full_name: string; full_name_ja: string | null; position: string | null }[] };

  return {
    rosterRows: rosterRows.map((r) => toRow(r.id, r.name, r.position)),
    formerRows: (formerPlayers ?? []).map((p) => toRow(p.id, p.full_name_ja ?? p.full_name, p.position)),
    gamesCounted: countedGames.length,
    lastGameDate: countedGames.reduce<string | null>((max, g) => (max === null || g.game_date > max ? g.game_date : max), null),
    nonRegularGames,
    unclassifiedGames,
    duplicateGames,
    incompleteGames: countedGames.filter((g) => g.players_incomplete === true).length,
    unmatchedRows,
  };
}
