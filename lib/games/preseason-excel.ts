// プレシーズンExcel(NBA_Preseason_2026.xlsx)の読み取りと検査。DBへの書き込みは lib/games/preseason-import.ts。
// 取り込むシート: Game Summary(試合)・Player Stats(個人成績)・Team Totals(チーム合計)・Coverage(管理画面の照合用)。
// 選手名は Excel の表記のまま使い、選手データ(players)とは照合しない。
// チーム名は Excel のカタカナ表記(例: ヒート、７６ＥＲＳ)を、当サイトのチーム略称に置き換える。

import type { CellValue, SheetRows } from "./xlsx-reader";
import { excelSerialToDate } from "./xlsx-reader";

/** Excel のチーム表記(全角・半角や「・」の違いはそろえてから比べる) → チーム略称 */
const TEAM_NAME_TO_ABBR: Record<string, string> = {
  ホークス: "ATL",
  セルティックス: "BOS",
  ネッツ: "BKN",
  ホーネッツ: "CHA",
  ブルズ: "CHI",
  キャバリアーズ: "CLE",
  キャブス: "CLE",
  マーベリックス: "DAL",
  マブス: "DAL",
  ナゲッツ: "DEN",
  ピストンズ: "DET",
  ウォリアーズ: "GSW",
  ロケッツ: "HOU",
  ペイサーズ: "IND",
  クリッパーズ: "LAC",
  レイカーズ: "LAL",
  グリズリーズ: "MEM",
  ヒート: "MIA",
  バックス: "MIL",
  ティンバーウルブズ: "MIN",
  ティンバーウルヴズ: "MIN",
  ウルブズ: "MIN",
  ウルヴズ: "MIN",
  ペリカンズ: "NOP",
  ニックス: "NYK",
  サンダー: "OKC",
  マジック: "ORL",
  "76ERS": "PHI",
  セブンティシクサーズ: "PHI",
  シクサーズ: "PHI",
  サンズ: "PHX",
  トレイルブレイザーズ: "POR",
  ブレイザーズ: "POR",
  キングス: "SAC",
  スパーズ: "SAS",
  ラプターズ: "TOR",
  ジャズ: "UTA",
  ウィザーズ: "WAS",
};

function normalizeTeamLabel(label: string): string {
  return label.normalize("NFKC").toUpperCase().replace(/[\s・･]/g, "");
}

export function teamAbbrFromLabel(label: string): string | null {
  return TEAM_NAME_TO_ABBR[normalizeTeamLabel(label)] ?? null;
}

export type ImportIssue = { sheet: string; row: number | null; message: string };

type Stats = {
  minutes: number | null;
  pts: number | null;
  fgm: number | null;
  fga: number | null;
  fg3m: number | null;
  fg3a: number | null;
  ftm: number | null;
  fta: number | null;
  oreb: number | null;
  dreb: number | null;
  reb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
  tov: number | null;
  pf: number | null;
};

export type PreseasonGameRow = {
  game_key: string;
  game_date: string;
  away_abbr: string;
  home_abbr: string;
  away_team_label: string;
  home_team_label: string;
  status: "scheduled" | "in_progress" | "final" | "postponed";
  status_detail: string | null;
  away_score: number | null;
  home_score: number | null;
  away_q1: number | null;
  away_q2: number | null;
  away_q3: number | null;
  away_q4: number | null;
  home_q1: number | null;
  home_q2: number | null;
  home_q3: number | null;
  home_q4: number | null;
  game_info: string | null;
  venue: string | null;
  source_notes: string | null;
  source_url: string | null;
};

export type PreseasonPlayerRow = Stats & {
  game_key: string;
  side: "away" | "home";
  row_order: number;
  player_name: string;
  position: string | null;
  played: boolean;
};

export type PreseasonTotalRow = Omit<Stats, "minutes"> & {
  game_key: string;
  side: "away" | "home";
  fg_pct: string | null;
  fg3_pct: string | null;
  ft_pct: string | null;
};

export type PreseasonCoverageRow = {
  game_date: string;
  scheduled_games: number | null;
  linked_games: number | null;
  final_games: number | null;
  monthly_completed_games: number | null;
  source_notes: string | null;
  source_url: string | null;
};

export type ParsedPreseason = {
  games: PreseasonGameRow[];
  players: PreseasonPlayerRow[];
  totals: PreseasonTotalRow[];
  coverage: PreseasonCoverageRow[];
  /** 取り込めなかった行(その試合は取り込まない) */
  errors: ImportIssue[];
  /** 取り込むが、確認が必要な点(出典の不整合など) */
  warnings: ImportIssue[];
  /** エラーのため取り込まない Game ID */
  skippedGameKeys: string[];
};

const REQUIRED_SHEETS = ["Game Summary", "Player Stats", "Team Totals"] as const;

const STATUS_MAP: Record<string, PreseasonGameRow["status"]> = {
  final: "final",
  "final/ot": "final",
  scheduled: "scheduled",
  "in progress": "in_progress",
  live: "in_progress",
  postponed: "postponed",
};

function header(rows: SheetRows): Map<string, number> {
  return new Map((rows[0] ?? []).map((h, i) => [String(h ?? "").trim(), i]));
}

function str(v: CellValue): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/** 整数(空欄は null)。整数でなければ undefined */
function int(v: CellValue): number | null | undefined {
  if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isInteger(n) && n >= -999 && n <= 999 ? n : undefined;
}

function dateOf(v: CellValue): string | null {
  if (typeof v === "number") return excelSerialToDate(v);
  const s = str(v);
  if (!s) return null;
  const m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(s);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : null;
}

/** 「成功-試投」(例: 4-6)。「-」は 0-0(試投なし) */
function madeAttempted(v: CellValue): [number, number] | null | undefined {
  const s = str(v);
  if (s === null) return null;
  if (s === "-") return [0, 0];
  const m = /^(\d+)-(\d+)$/.exec(s);
  if (!m) return undefined;
  const made = Number(m[1]);
  const att = Number(m[2]);
  return made <= att ? [made, att] : undefined;
}

/** リバウンド「オフェンス-ディフェンス-合計」(例: 0-1-1)。合計が空欄なら O+D で計算する */
function rebounds(v: CellValue): [number, number, number] | null | undefined {
  const s = str(v);
  if (s === null) return null;
  const m = /^(\d+)-(\d+)-(\d*)$/.exec(s);
  if (!m) return undefined;
  const o = Number(m[1]);
  const d = Number(m[2]);
  const t = m[3] === "" ? o + d : Number(m[3]);
  return t === o + d ? [o, d, t] : undefined;
}

function sideOf(v: CellValue): "away" | "home" | null {
  const s = str(v)?.toLowerCase();
  return s === "away" ? "away" : s === "home" ? "home" : null;
}

/** 個人成績・チーム合計の行の数値部分を読む(列名は Player Stats と Team Totals で共通) */
function readStats(row: CellValue[], col: Map<string, number>, problems: string[]): Stats {
  const get = (name: string) => row[col.get(name) ?? -1] ?? null;
  const num = (name: string, label: string) => {
    const n = int(get(name));
    if (n === undefined) {
      problems.push(`${label}「${get(name)}」が数値ではありません`);
      return null;
    }
    if (n !== null && n < 0) problems.push(`${label}がマイナスです`);
    return n;
  };
  const pair = (name: string, label: string) => {
    const p = madeAttempted(get(name));
    if (p === undefined) {
      problems.push(`${label}「${get(name)}」が「成功-試投」の形ではありません（例: 4-6）`);
      return null;
    }
    return p;
  };
  const fg = pair("FG率", "FG");
  const fg3 = pair("3P率", "3P");
  const ft = pair("FT率", "FT");
  const rb = rebounds(get("リバウ"));
  if (rb === undefined) problems.push(`リバウンド「${get("リバウ")}」が「オフェンス-ディフェンス-合計」の形ではありません（例: 0-1-1）`);
  if (fg && fg3 && (fg3[0] > fg[0] || fg3[1] > fg[1])) problems.push("3PがFGより多くなっています（FGは3Pを含む数です）");
  return {
    minutes: num("分", "分"),
    pts: num("点", "点"),
    fgm: fg ? fg[0] : null,
    fga: fg ? fg[1] : null,
    fg3m: fg3 ? fg3[0] : null,
    fg3a: fg3 ? fg3[1] : null,
    ftm: ft ? ft[0] : null,
    fta: ft ? ft[1] : null,
    oreb: rb ? rb[0] : null,
    dreb: rb ? rb[1] : null,
    reb: rb ? rb[2] : null,
    ast: num("ア", "アシスト"),
    stl: num("ス", "スティール"),
    blk: num("ブ", "ブロック"),
    tov: num("TO", "TO"),
    pf: num("反", "反則"),
  };
}

const STAT_COLUMNS = ["Game ID", "Team", "Side", "Position", "Player", "分", "FG率", "3P率", "FT率", "リバウ", "ア", "ス", "ブ", "TO", "反", "点"];

export function parsePreseasonWorkbook(sheets: Map<string, SheetRows>): ParsedPreseason {
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const result: ParsedPreseason = { games: [], players: [], totals: [], coverage: [], errors, warnings, skippedGameKeys: [] };

  const missingSheets = REQUIRED_SHEETS.filter((s) => !sheets.has(s));
  if (missingSheets.length > 0) {
    errors.push({ sheet: "ファイル全体", row: null, message: `必要なシートがありません：${missingSheets.join("、")}` });
    return result;
  }

  // --- Game Summary ---
  const gsRows = sheets.get("Game Summary")!;
  const gs = header(gsRows);
  const gsNeed = ["Game ID", "Game Date", "Away Team", "Home Team", "Away Score", "Home Score", "Status", "Away 1Q", "Home 1Q", "Away 2Q", "Home 2Q", "Away 3Q", "Home 3Q", "Away 4Q", "Home 4Q"];
  const gsMissing = gsNeed.filter((c) => !gs.has(c));
  if (gsMissing.length > 0) {
    errors.push({ sheet: "Game Summary", row: 1, message: `必要な列がありません：${gsMissing.join("、")}` });
    return result;
  }
  const badGames = new Set<string>();
  const gameByKey = new Map<string, PreseasonGameRow>();
  for (let i = 1; i < gsRows.length; i++) {
    const row = gsRows[i];
    const get = (name: string) => row[gs.get(name) ?? -1] ?? null;
    const key = str(get("Game ID"));
    if (!key) {
      if (row.some((v) => v !== null && v !== "")) errors.push({ sheet: "Game Summary", row: i + 1, message: "Game ID が空欄です" });
      continue;
    }
    const problems: string[] = [];
    if (gameByKey.has(key)) problems.push(`Game ID「${key}」が重複しています`);
    const date = dateOf(get("Game Date"));
    if (!date) problems.push(`Game Date「${get("Game Date")}」が日付ではありません`);
    const awayLabel = str(get("Away Team")) ?? "";
    const homeLabel = str(get("Home Team")) ?? "";
    const awayAbbr = teamAbbrFromLabel(awayLabel);
    const homeAbbr = teamAbbrFromLabel(homeLabel);
    if (!awayAbbr) problems.push(`Away Team「${awayLabel}」がどのチームか判定できません`);
    if (!homeAbbr) problems.push(`Home Team「${homeLabel}」がどのチームか判定できません`);
    if (awayAbbr && awayAbbr === homeAbbr) problems.push("Away Team と Home Team が同じチームです");
    const statusLabel = str(get("Status")) ?? "";
    const status = STATUS_MAP[statusLabel.toLowerCase()];
    if (!status) problems.push(`Status「${statusLabel}」が想定外です（Final など）`);
    const n = (name: string) => {
      const v = int(get(name));
      if (v === undefined || (v !== null && v < 0)) {
        problems.push(`${name}「${get(name)}」が0以上の整数ではありません`);
        return null;
      }
      return v;
    };
    const g: PreseasonGameRow = {
      game_key: key,
      game_date: date ?? "",
      away_abbr: awayAbbr ?? "",
      home_abbr: homeAbbr ?? "",
      away_team_label: awayLabel,
      home_team_label: homeLabel,
      status: status ?? "final",
      status_detail: statusLabel || null,
      away_score: n("Away Score"),
      home_score: n("Home Score"),
      away_q1: n("Away 1Q"),
      away_q2: n("Away 2Q"),
      away_q3: n("Away 3Q"),
      away_q4: n("Away 4Q"),
      home_q1: n("Home 1Q"),
      home_q2: n("Home 2Q"),
      home_q3: n("Home 3Q"),
      home_q4: n("Home 4Q"),
      game_info: str(get("Game Information")),
      venue: str(get("Venue / Location")),
      source_notes: str(get("Source Consistency Notes")),
      source_url: str(get("Source URL")),
    };
    if (problems.length > 0) {
      for (const m of problems) errors.push({ sheet: "Game Summary", row: i + 1, message: `${key}：${m}` });
      badGames.add(key);
      continue;
    }
    // クオーター合計と最終スコア(延長があれば一致しないため、注意として表示する)
    for (const side of ["away", "home"] as const) {
      const q = [g[`${side}_q1`], g[`${side}_q2`], g[`${side}_q3`], g[`${side}_q4`]];
      const score = g[`${side}_score`];
      if (score !== null && q.every((v) => v !== null) && q.reduce((a, b) => a! + b!, 0) !== score) {
        warnings.push({ sheet: "Game Summary", row: i + 1, message: `${key}：${side === "away" ? "アウェー" : "ホーム"}のクオーター合計が最終スコア ${score} と一致しません（延長の可能性）` });
      }
    }
    if (g.source_notes) warnings.push({ sheet: "Game Summary", row: i + 1, message: `${key}：出典の注記「${g.source_notes}」` });
    gameByKey.set(key, g);
  }

  // --- Player Stats ---
  const psRows = sheets.get("Player Stats")!;
  const ps = header(psRows);
  const psMissing = STAT_COLUMNS.filter((c) => !ps.has(c));
  if (psMissing.length > 0) {
    errors.push({ sheet: "Player Stats", row: 1, message: `必要な列がありません：${psMissing.join("、")}` });
    return { ...result, games: [], skippedGameKeys: [...gameByKey.keys()] };
  }
  const orderBySide = new Map<string, number>();
  const seenPlayers = new Set<string>();
  const players: PreseasonPlayerRow[] = [];
  for (let i = 1; i < psRows.length; i++) {
    const row = psRows[i];
    const get = (name: string) => row[ps.get(name) ?? -1] ?? null;
    const key = str(get("Game ID"));
    if (!key) continue;
    if (!gameByKey.has(key) && !badGames.has(key)) {
      errors.push({ sheet: "Player Stats", row: i + 1, message: `Game ID「${key}」が Game Summary にありません` });
      continue;
    }
    const side = sideOf(get("Side"));
    const name = str(get("Player"));
    const problems: string[] = [];
    if (!side) problems.push(`Side「${get("Side")}」は Away か Home です`);
    if (!name) problems.push("Player（選手名）が空欄です");
    const g = gameByKey.get(key);
    if (g && side) {
      const label = str(get("Team"));
      const expected = side === "away" ? g.away_team_label : g.home_team_label;
      if (label && normalizeTeamLabel(label) !== normalizeTeamLabel(expected)) problems.push(`Team「${label}」が Game Summary の${side === "away" ? "Away" : "Home"} Team（${expected}）と一致しません`);
    }
    // 同じ行が2回入っている場合(出典の行番号 Source Row が同じ)だけを重複とする。
    // 「J.ウィリアムズ」のように、略した表記が同じ別の選手がいるため、名前が同じだけでは重複にしない
    const sourceRow = str(get("Source Row"));
    const rowKey = `${key}|${side}|${sourceRow ?? `line${i}`}`;
    if (sourceRow && seenPlayers.has(rowKey)) problems.push(`出典の同じ行（Source Row ${sourceRow}）が重複しています`);
    seenPlayers.add(rowKey);
    const nameKey = `${key}|${side}|name:${name}`;
    if (name && seenPlayers.has(nameKey)) {
      warnings.push({ sheet: "Player Stats", row: i + 1, message: `${key}：同じチームに「${name}」が2人います（略した表記が同じ別の選手の可能性があります。Excelの表記のまま両方表示します）` });
    }
    seenPlayers.add(nameKey);
    // 成績がすべて空欄の行は「出場なし」
    const statCells = ["分", "FG率", "3P率", "FT率", "リバウ", "ア", "ス", "ブ", "TO", "反", "点"].map((c) => get(c));
    const played = statCells.some((v) => v !== null && String(v).trim() !== "");
    const stats = played ? readStats(row, ps, problems) : readStats([], ps, []);
    if (played && stats.fgm !== null && stats.fg3m !== null && stats.ftm !== null && stats.pts !== null) {
      const expected = 2 * (stats.fgm - stats.fg3m) + 3 * stats.fg3m + stats.ftm;
      if (expected !== stats.pts) warnings.push({ sheet: "Player Stats", row: i + 1, message: `${key} ${name}：点（${stats.pts}）がFG・3P・FTから計算した値（${expected}）と一致しません` });
    }
    if (problems.length > 0) {
      for (const m of problems) errors.push({ sheet: "Player Stats", row: i + 1, message: `${key}${name ? ` ${name}` : ""}：${m}` });
      badGames.add(key);
      continue;
    }
    const orderKey = `${key}|${side}`;
    const order = (orderBySide.get(orderKey) ?? 0) + 1;
    orderBySide.set(orderKey, order);
    players.push({ game_key: key, side: side!, row_order: order, player_name: name!, position: str(get("Position")), played, ...stats });
  }

  // --- Team Totals ---
  const ttRows = sheets.get("Team Totals")!;
  const tt = header(ttRows);
  const ttMissing = STAT_COLUMNS.filter((c) => !tt.has(c));
  if (ttMissing.length > 0) {
    errors.push({ sheet: "Team Totals", row: 1, message: `必要な列がありません：${ttMissing.join("、")}` });
    return { ...result, games: [], skippedGameKeys: [...gameByKey.keys()] };
  }
  const totalByKey = new Map<string, PreseasonTotalRow>();
  const pctRows: { key: string; side: "away" | "home"; row: CellValue[] }[] = [];
  for (let i = 1; i < ttRows.length; i++) {
    const row = ttRows[i];
    const get = (name: string) => row[tt.get(name) ?? -1] ?? null;
    const key = str(get("Game ID"));
    if (!key) continue;
    if (!gameByKey.has(key) && !badGames.has(key)) {
      errors.push({ sheet: "Team Totals", row: i + 1, message: `Game ID「${key}」が Game Summary にありません` });
      continue;
    }
    const side = sideOf(get("Side"));
    const kind = str(get("Player"));
    if (!side) {
      errors.push({ sheet: "Team Totals", row: i + 1, message: `${key}：Side「${get("Side")}」は Away か Home です` });
      badGames.add(key);
      continue;
    }
    if (kind === "成功率") {
      pctRows.push({ key, side, row });
      continue;
    }
    if (kind !== "Total") {
      warnings.push({ sheet: "Team Totals", row: i + 1, message: `${key}：「${kind}」の行は使いません（Total と 成功率 だけを取り込みます）` });
      continue;
    }
    const problems: string[] = [];
    const { minutes: _minutes, ...stats } = readStats(row, tt, problems);
    void _minutes;
    if (problems.length > 0) {
      for (const m of problems) errors.push({ sheet: "Team Totals", row: i + 1, message: `${key}：${m}` });
      badGames.add(key);
      continue;
    }
    totalByKey.set(`${key}|${side}`, { game_key: key, side, ...stats, fg_pct: null, fg3_pct: null, ft_pct: null });
  }
  for (const p of pctRows) {
    const t = totalByKey.get(`${p.key}|${p.side}`);
    if (!t) continue;
    const get = (name: string) => str(p.row[tt.get(name) ?? -1] ?? null);
    t.fg_pct = get("FG率");
    t.fg3_pct = get("3P率");
    t.ft_pct = get("FT率");
  }

  // 試合ごとの照合(最終スコアと、個人成績の合計・チーム合計)
  for (const g of gameByKey.values()) {
    if (badGames.has(g.game_key)) continue;
    for (const side of ["away", "home"] as const) {
      const label = side === "away" ? "アウェー" : "ホーム";
      const score = g[`${side}_score`];
      const sum = players.filter((p) => p.game_key === g.game_key && p.side === side).reduce((a, p) => a + (p.pts ?? 0), 0);
      const total = totalByKey.get(`${g.game_key}|${side}`);
      if (!total) warnings.push({ sheet: "Team Totals", row: null, message: `${g.game_key}：${label}のチーム合計（Total 行）がありません` });
      if (score !== null && sum !== score) warnings.push({ sheet: "Player Stats", row: null, message: `${g.game_key}：${label}の個人成績の点の合計 ${sum} が最終スコア ${score} と一致しません` });
      if (score !== null && total?.pts != null && total.pts !== score) warnings.push({ sheet: "Team Totals", row: null, message: `${g.game_key}：${label}のチーム合計の点 ${total.pts} が最終スコア ${score} と一致しません` });
    }
  }

  // --- Coverage(任意。管理画面の照合用) ---
  const cvRows = sheets.get("Coverage");
  if (cvRows) {
    const cv = header(cvRows);
    for (let i = 1; i < cvRows.length; i++) {
      const row = cvRows[i];
      const get = (name: string) => row[cv.get(name) ?? -1] ?? null;
      const date = dateOf(get("Game Date"));
      if (!date) continue;
      const n = (name: string) => int(get(name)) ?? null;
      result.coverage.push({
        game_date: date,
        scheduled_games: n("Scheduled Games"),
        linked_games: n("Linked Games"),
        final_games: n("Final Games"),
        monthly_completed_games: n("Monthly Completed Games"),
        source_notes: str(get("Source Consistency Notes")),
        source_url: str(get("Source URL")),
      });
    }
  }

  result.skippedGameKeys = [...badGames];
  result.games = [...gameByKey.values()].filter((g) => !badGames.has(g.game_key));
  const ok = new Set(result.games.map((g) => g.game_key));
  result.players = players.filter((p) => ok.has(p.game_key));
  result.totals = [...totalByKey.values()].filter((t) => ok.has(t.game_key));
  return result;
}
