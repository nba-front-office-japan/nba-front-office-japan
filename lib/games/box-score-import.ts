// 試合ボックススコアCSV(1試合・1チーム分)の、DBを使う検査と登録(サーバー専用・service_roleで実行)。
// 1. lib/games/box-score-csv.ts で列・必須項目・数値・重複・PTSと得点内訳を検査
// 2. ここで試合の存在、相手チームの登録済みデータとの重複、選手の照合、試合のスコアとの照合を行う
// 3. 登録は replace_game_player_stats()(1試合分を削除と登録の1トランザクションで入れ替える関数)を使う。
//    この関数は試合単位で入れ替えるため、「相手チームの登録済みの行」＋「今回のCSVの行」を渡し、
//    選んだチームの分だけが置き換わるようにする(相手チームの行は登録済みの値のまま渡し直す)。
//    途中で失敗した場合は全体が取り消され、以前のデータが残る。

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { normalizePlayerName, parseBoxScoreCsv, type CsvIssue, type PreviewRow } from "./box-score-csv";

type Client = SupabaseClient<Database>;
type StatRow = Database["public"]["Tables"]["game_player_stats"]["Row"];

export type TeamSide = "home" | "away";

export const SIDE_LABEL: Record<TeamSide, string> = { home: "ホーム", away: "アウェー" };

export function isTeamSide(value: unknown): value is TeamSide {
  return value === "home" || value === "away";
}

/** 管理画面に表示する、対象の試合とチーム */
export type TargetInfo = {
  gameId: string;
  gameDate: string;
  status: string;
  side: TeamSide;
  teamAbbr: string;
  teamName: string;
  opponentAbbr: string;
  /** 試合管理の最終スコア(未確定ならnull) */
  teamScore: number | null;
  opponentScore: number | null;
};

export type PreviewPlayer = PreviewRow & { matched: boolean | null };

export type CheckReport = {
  target: TargetInfo;
  errors: CsvIssue[];
  warnings: CsvIssue[];
  preview: PreviewPlayer[];
  /** エラーがない場合の選手数と合計 */
  playerCount: number;
  totals: { pts: number; reb: number; ast: number; fgm: number; fga: number; fg3m: number; fg3a: number; ftm: number; fta: number } | null;
  /** このチームの登録済みの人数(置き換え対象) */
  existingCount: number;
  /** 相手チームの登録済みの人数(そのまま残す) */
  opponentExistingCount: number;
  unmatchedPlayers: string[];
};

type InsertRow = {
  team_id: string;
  player_id: string | null;
  player_name: string;
  seconds_played: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  plus_minus: number | null;
};

export type Prepared = { report: CheckReport; teamRows: InsertRow[]; opponentRows: InsertRow[] };

async function fetchAllPlayers(supabase: Client): Promise<{ id: string; full_name: string }[]> {
  // 1ページ目で件数を取り、残りのページはまとめて並行に取得する(検査の待ち時間を短くするため)
  const PAGE = 1000;
  const page = (from: number) => supabase.from("players").select("id, full_name", from === 0 ? { count: "exact" } : undefined).order("id").range(from, from + PAGE - 1);
  const first = await page(0);
  if (first.error) throw new Error(`playersの取得に失敗しました: ${first.error.message}`);
  const total = first.count ?? 0;
  const rest = await Promise.all(Array.from({ length: Math.max(0, Math.ceil(total / PAGE) - 1) }, (_, i) => page((i + 1) * PAGE)));
  const all = [...(first.data ?? [])];
  for (const r of rest) {
    if (r.error) throw new Error(`playersの取得に失敗しました: ${r.error.message}`);
    all.push(...(r.data ?? []));
  }
  return all;
}

/** 選手名 → 選手ID。完全一致 → 正規化一致 → 別名(player_name_aliases)の順で照合し、1人に決まる場合だけ返す */
async function buildPlayerResolver(supabase: Client): Promise<(name: string) => string | null> {
  const [players, aliasesResult] = await Promise.all([
    fetchAllPlayers(supabase),
    supabase.from("player_name_aliases").select("player_id, alias_full_name"),
  ]);
  if (aliasesResult.error) throw new Error(`player_name_aliasesの取得に失敗しました: ${aliasesResult.error.message}`);

  const exact = new Map<string, string[]>();
  const normalized = new Map<string, string[]>();
  const add = (map: Map<string, string[]>, key: string, id: string) => {
    const list = map.get(key) ?? [];
    if (!list.includes(id)) list.push(id);
    map.set(key, list);
  };
  for (const p of players) {
    add(exact, p.full_name, p.id);
    add(normalized, normalizePlayerName(p.full_name), p.id);
  }
  for (const a of aliasesResult.data ?? []) add(normalized, normalizePlayerName(a.alias_full_name), a.player_id);

  return (name: string) => {
    const e = exact.get(name);
    if (e && e.length === 1) return e[0];
    const n = normalized.get(normalizePlayerName(name));
    if (n && n.length === 1) return n[0];
    return null;
  };
}

/** 対象の試合とチームを読み込む。見つからなければnull */
export async function loadTarget(supabase: Client, gameId: string, side: TeamSide): Promise<(TargetInfo & { teamId: string; opponentId: string }) | null> {
  const { data: game, error } = await supabase
    .from("games")
    .select("id, game_date, status, home_team_id, away_team_id, home_score, away_score")
    .eq("id", gameId)
    .maybeSingle();
  if (error) throw new Error(`gamesの取得に失敗しました: ${error.message}`);
  if (!game) return null;

  const teamId = side === "home" ? game.home_team_id : game.away_team_id;
  const opponentId = side === "home" ? game.away_team_id : game.home_team_id;
  const { data: teams, error: teamsError } = await supabase.from("teams").select("id, abbreviation, name").in("id", [teamId, opponentId]);
  if (teamsError) throw new Error(`teamsの取得に失敗しました: ${teamsError.message}`);
  const team = teams?.find((t) => t.id === teamId);
  const opponent = teams?.find((t) => t.id === opponentId);

  return {
    gameId: game.id,
    gameDate: game.game_date,
    status: game.status,
    side,
    teamId,
    opponentId,
    teamAbbr: team?.abbreviation ?? "—",
    teamName: team?.name ?? "（不明）",
    opponentAbbr: opponent?.abbreviation ?? "—",
    teamScore: side === "home" ? game.home_score : game.away_score,
    opponentScore: side === "home" ? game.away_score : game.home_score,
  };
}

function toInsertRow(s: StatRow): InsertRow {
  return {
    team_id: s.team_id,
    player_id: s.player_id,
    player_name: s.player_name,
    seconds_played: s.seconds_played,
    pts: s.pts,
    reb: s.reb,
    ast: s.ast,
    stl: s.stl,
    blk: s.blk,
    fgm: s.fgm,
    fga: s.fga,
    fg3m: s.fg3m,
    fg3a: s.fg3a,
    ftm: s.ftm,
    fta: s.fta,
    plus_minus: s.plus_minus,
  };
}

/** CSVを検査し、登録できる場合は登録データを用意する(DBへの書き込みはしない) */
export async function prepareTeamBoxScore(supabase: Client, gameId: string, side: TeamSide, csvText: string): Promise<Prepared | null> {
  const target = await loadTarget(supabase, gameId, side);
  if (!target) return null;
  const { teamId, opponentId, ...targetInfo } = target;

  const parsed = parseBoxScoreCsv(csvText);
  const errors = [...parsed.errors];
  const warnings = [...parsed.warnings];

  const { data: existing, error: existingError } = await supabase.from("game_player_stats").select("*").eq("game_id", gameId);
  if (existingError) throw new Error(`game_player_statsの取得に失敗しました: ${existingError.message}`);
  const existingRows = existing ?? [];
  const teamExisting = existingRows.filter((r) => r.team_id === teamId);
  // 選んだチーム以外の行(通常は相手チームの行)は、そのまま残す
  const keptRows = existingRows.filter((r) => r.team_id !== teamId);
  const opponentExistingCount = keptRows.filter((r) => r.team_id === opponentId).length;

  // 相手チームに同じ選手名が登録済み(チームの選び間違い、または同じ名前の選手。DBでは1試合に同じ選手名は1行だけ)
  const keptNames = new Map(keptRows.map((r) => [normalizePlayerName(r.player_name), r.player_name]));
  for (const r of parsed.rows) {
    if (keptNames.has(normalizePlayerName(r.player))) {
      errors.push({ line: r.line, message: `選手「${r.player}」は、この試合の${target.opponentAbbr}（${SIDE_LABEL[side === "home" ? "away" : "home"]}）にすでに登録されています。チームの選択を確認してください。` });
    }
  }

  const resolvePlayer = parsed.rows.length > 0 ? await buildPlayerResolver(supabase) : null;
  const unmatched: string[] = [];
  const matchedByLine = new Map<number, boolean>();
  const teamRows: InsertRow[] = parsed.rows.map((r) => {
    const playerId = resolvePlayer ? resolvePlayer(r.player) : null;
    matchedByLine.set(r.line, playerId !== null);
    if (!playerId) unmatched.push(r.player);
    return {
      team_id: teamId,
      player_id: playerId,
      player_name: r.player,
      seconds_played: r.secondsPlayed,
      pts: r.pts,
      reb: r.reb,
      ast: r.ast,
      stl: r.stl,
      blk: r.blk,
      fgm: r.fgm,
      fga: r.fga,
      fg3m: r.fg3m,
      fg3a: r.fg3a,
      ftm: r.ftm,
      fta: r.fta,
      plus_minus: r.plusMinus,
    };
  });

  const ok = errors.length === 0;
  const sum = (key: keyof InsertRow) => teamRows.reduce((acc, r) => acc + Number(r[key] ?? 0), 0);
  const totals = ok
    ? { pts: sum("pts"), reb: sum("reb"), ast: sum("ast"), fgm: sum("fgm"), fga: sum("fga"), fg3m: sum("fg3m"), fg3a: sum("fg3a"), ftm: sum("ftm"), fta: sum("fta") }
    : null;

  if (ok && totals) {
    // 試合管理の最終スコアとの照合(登録はできるが、記入漏れ・チームの選び間違いの手がかりとして表示する)
    if (target.teamScore !== null && totals.pts !== target.teamScore) {
      const swapped = target.opponentScore !== null && totals.pts === target.opponentScore;
      warnings.push({
        line: null,
        message: swapped
          ? `選手の得点合計 ${totals.pts} が、${target.teamAbbr} のスコア ${target.teamScore} ではなく、相手の${target.opponentAbbr} のスコア ${target.opponentScore} と一致しています。ホーム／アウェーの選択を確認してください。`
          : `選手の得点合計 ${totals.pts} が、試合管理の${target.teamAbbr} のスコア ${target.teamScore} と一致しません。選手の記入漏れがないか確認してください。`,
      });
    }
    if (target.status !== "final") {
      warnings.push({ line: null, message: "この試合はまだ「試合終了」になっていません。最終結果の確定後に登録し直すことをおすすめします。" });
    }
    if (unmatched.length > 0) {
      warnings.push({ line: null, message: `当サイトの選手データと照合できなかった選手が${unmatched.length}人います（${unmatched.join("、")}）。名前のまま登録し、選手ページへのリンクは付きません。` });
    }
  }

  const report: CheckReport = {
    target: targetInfo,
    errors: [...errors].sort((a, b) => (a.line ?? 0) - (b.line ?? 0)),
    warnings,
    preview: parsed.preview.map((p) => ({ ...p, matched: matchedByLine.get(p.line) ?? null })),
    playerCount: parsed.preview.length,
    totals,
    existingCount: teamExisting.length,
    opponentExistingCount,
    unmatchedPlayers: ok ? unmatched : [],
  };
  return { report, teamRows: ok ? teamRows : [], opponentRows: keptRows.map(toInsertRow) };
}

/** 検査済みのデータで、選んだチームの分だけを置き換える。戻り値はこのチームの登録人数 */
export async function applyTeamBoxScore(supabase: Client, prepared: Prepared): Promise<number> {
  const rows = [...prepared.opponentRows, ...prepared.teamRows];
  const { error } = await supabase.rpc("replace_game_player_stats", { p_game_id: prepared.report.target.gameId, p_rows: rows });
  if (error) throw new Error(error.message);
  return prepared.teamRows.length;
}
