// 試合のボックススコア Excel(新書式 NBA_Box_Scores.xlsx)の読み取りと検査。DBへの書き込みは lib/games/box-score-workbook-import.ts。
// シート: Game Summary(1試合 × 1チーム1行。OT1, OT2 … は延長があるときだけ列が増える)・Player Box Scores・Team Totals・
//         Metadata(取り込み状況のメモ)・Errors(取得時のエラーの履歴。取り込みはしない)。
// 1試合ごとに両チームの検査(得点の合計・チーム合計・個人成績の合計)がすべて通った試合だけを取り込む。
// チーム略称は Basketball-Reference の表記(BRK / CHO / PHO)を当サイトの略称(BKN / CHA / PHX)に置き換える。

import type { CellValue, SheetRows } from "./xlsx-reader";
import { excelSerialToDate } from "./xlsx-reader";
import type { ImportIssue } from "./preseason-excel";

export type { ImportIssue };

const TEAM_ABBR_FIXES: Record<string, string> = { BRK: "BKN", CHO: "CHA", PHO: "PHX" };

export function siteTeamAbbr(abbr: string): string {
  const upper = abbr.trim().toUpperCase();
  return TEAM_ABBR_FIXES[upper] ?? upper;
}

type Side = "away" | "home";

export type BoxStats = {
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
  pts: number | null;
};

export type ParsedBoxGame = {
  bref_game_id: string;
  game_date: string;
  away_abbr: string;
  home_abbr: string;
  away_score: number;
  home_score: number;
  away_q1: number | null;
  away_q2: number | null;
  away_q3: number | null;
  away_q4: number | null;
  home_q1: number | null;
  home_q2: number | null;
  home_q3: number | null;
  home_q4: number | null;
  away_ot_scores: number[];
  home_ot_scores: number[];
  source_url: string | null;
};

export type ParsedBoxPlayer = BoxStats & {
  bref_game_id: string;
  side: Side;
  team_abbr: string;
  row_order: number;
  player_name: string;
  bref_player_id: string | null;
  role: "starter" | "bench" | "dnp";
  dnp_reason: string | null;
  seconds_played: number | null;
  game_score: number | null;
  plus_minus: number | null;
};

export type ParsedBoxTotal = BoxStats & {
  bref_game_id: string;
  side: Side;
  team_abbr: string;
  minutes: number | null;
};

export type SourceError = { timestamp: string | null; date: string | null; gameId: string | null; stage: string | null; error: string };

export type ParsedBoxScores = {
  games: ParsedBoxGame[];
  players: ParsedBoxPlayer[];
  totals: ParsedBoxTotal[];
  errors: ImportIssue[];
  warnings: ImportIssue[];
  skippedGameIds: string[];
  schema: string | null;
  coverage: string[];
  sourceErrors: SourceError[];
};

const SHEETS = {
  summary: "Game Summary",
  players: "Player Box Scores",
  totals: "Team Totals",
  metadata: "Metadata",
  errors: "Errors",
} as const;

function text(v: CellValue | undefined): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/** 数値のセル(数値の文字列も可)。空欄は null、数値でなければ NaN */
function num(v: CellValue | undefined): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s.replace(/^\+/, ""));
  return Number.isFinite(n) ? n : Number.NaN;
}

function dateOf(v: CellValue | undefined): string | null {
  if (typeof v === "number") return excelSerialToDate(v);
  const s = text(v);
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** "37:49" → 2269 秒。空欄は null、読めなければ NaN */
function secondsOf(v: CellValue | undefined): number | null {
  const s = text(v);
  if (!s) return null;
  const m = /^(\d{1,3}):(\d{2})$/.exec(s);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const n = num(v);
  return n === null || Number.isNaN(n) ? Number.NaN : Math.round(n * 60);
}

type Table = { header: Map<string, number>; rows: { rowNumber: number; cells: CellValue[] }[] };

function table(sheets: Map<string, SheetRows>, name: string): Table | null {
  const rows = sheets.get(name);
  if (!rows || rows.length === 0) return null;
  const header = new Map<string, number>();
  rows[0].forEach((h, i) => {
    const key = text(h);
    if (key) header.set(key, i);
  });
  return {
    header,
    rows: rows
      .slice(1)
      .map((cells, i) => ({ rowNumber: i + 2, cells }))
      .filter((r) => r.cells.some((c) => text(c) !== null)),
  };
}

function cell(t: Table, row: CellValue[], column: string): CellValue | undefined {
  const i = t.header.get(column);
  return i === undefined ? undefined : row[i];
}

function sideOf(v: CellValue | undefined): Side | null {
  const s = text(v)?.toLowerCase();
  return s === "away" ? "away" : s === "home" ? "home" : null;
}

const STAT_COLUMNS: [keyof BoxStats, string][] = [
  ["fgm", "FG"],
  ["fga", "FGA"],
  ["fg3m", "3P"],
  ["fg3a", "3PA"],
  ["ftm", "FT"],
  ["fta", "FTA"],
  ["oreb", "ORB"],
  ["dreb", "DRB"],
  ["reb", "TRB"],
  ["ast", "AST"],
  ["stl", "STL"],
  ["blk", "BLK"],
  ["tov", "TOV"],
  ["pf", "PF"],
  ["pts", "PTS"],
];

function readStats(t: Table, row: CellValue[], issues: string[]): BoxStats {
  const stats = {} as BoxStats;
  for (const [key, column] of STAT_COLUMNS) {
    const v = num(cell(t, row, column));
    if (v !== null && (Number.isNaN(v) || v < 0 || !Number.isInteger(v))) {
      issues.push(`${column} の値「${String(cell(t, row, column))}」が正しくありません`);
      stats[key] = null;
    } else {
      stats[key] = v;
    }
  }
  return stats;
}

/** 成功数 ≦ 試投数、3P ≦ FG、ORB + DRB = TRB、得点 = 2×FG + 3P + FT を確かめる(空欄の項目は確かめない) */
function checkStats(s: BoxStats, issues: string[]) {
  const le = (a: number | null, b: number | null, label: string) => {
    if (a !== null && b !== null && a > b) issues.push(label);
  };
  le(s.fgm, s.fga, "FG が FGA より多くなっています");
  le(s.fg3m, s.fg3a, "3P が 3PA より多くなっています");
  le(s.ftm, s.fta, "FT が FTA より多くなっています");
  le(s.fg3m, s.fgm, "3P が FG より多くなっています");
  le(s.fg3a, s.fga, "3PA が FGA より多くなっています");
  if (s.oreb !== null && s.dreb !== null && s.reb !== null && s.oreb + s.dreb !== s.reb) issues.push("ORB + DRB が TRB と一致しません");
  if (s.fgm !== null && s.fg3m !== null && s.ftm !== null && s.pts !== null && 2 * s.fgm + s.fg3m + s.ftm !== s.pts) {
    issues.push("PTS が FG・3P・FT から計算した得点と一致しません");
  }
}

function requireColumns(t: Table, sheet: string, columns: string[], errors: ImportIssue[]): boolean {
  const missing = columns.filter((c) => !t.header.has(c));
  if (missing.length > 0) {
    errors.push({ sheet, row: 1, message: `列が見つかりません：${missing.join("、")}` });
    return false;
  }
  return true;
}

export function parseBoxScoreWorkbook(sheets: Map<string, SheetRows>): ParsedBoxScores {
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const result: ParsedBoxScores = {
    games: [],
    players: [],
    totals: [],
    errors,
    warnings,
    skippedGameIds: [],
    schema: null,
    coverage: [],
    sourceErrors: [],
  };

  const summary = table(sheets, SHEETS.summary);
  const playerTable = table(sheets, SHEETS.players);
  const totalTable = table(sheets, SHEETS.totals);
  for (const [name, t] of [
    [SHEETS.summary, summary],
    [SHEETS.players, playerTable],
    [SHEETS.totals, totalTable],
  ] as const) {
    if (!t) errors.push({ sheet: name, row: null, message: "シートが見つかりません（新書式の Excel か確認してください）" });
  }
  if (!summary || !playerTable || !totalTable) return result;

  const okColumns = [
    requireColumns(summary, SHEETS.summary, ["Game ID", "Date", "Away Team", "Home Team", "Team", "Home/Away", "Q1", "Q2", "Q3", "Q4", "Total"], errors),
    requireColumns(playerTable, SHEETS.players, ["Game ID", "Team", "Home/Away", "Player", "Starter/Bench/DNP", "MP", ...STAT_COLUMNS.map(([, c]) => c)], errors),
    requireColumns(totalTable, SHEETS.totals, ["Game ID", "Team", "Home/Away", ...STAT_COLUMNS.map(([, c]) => c)], errors),
  ];
  if (okColumns.includes(false)) return result;

  // Metadata(スキーマの版・日付ごとの取得状況)と Errors(取得時のエラーの履歴)は、管理画面に表示するだけ
  const meta = table(sheets, SHEETS.metadata);
  if (meta) {
    for (const r of meta.rows) {
      const key = text(r.cells[0]);
      const value = text(r.cells[1]);
      if (key === "Schema") result.schema = value;
      if (key?.startsWith("Coverage ") && value) result.coverage.push(`${key.slice("Coverage ".length)}：${value}`);
    }
    // 同じ日付の Coverage が複数あるときは、最後(最新)の行を使う
    const latest = new Map<string, string>();
    for (const c of result.coverage) latest.set(c.split("：")[0], c);
    result.coverage = [...latest.values()];
  }
  if (result.schema !== null && result.schema !== "1.0") {
    warnings.push({ sheet: SHEETS.metadata, row: null, message: `Schema が ${result.schema} です（この取り込み処理は 1.0 の書式に対応しています）` });
  }
  const errTable = table(sheets, SHEETS.errors);
  if (errTable) {
    for (const r of errTable.rows) {
      result.sourceErrors.push({
        timestamp: text(cell(errTable, r.cells, "Timestamp UTC")),
        date: dateOf(cell(errTable, r.cells, "Date")),
        gameId: text(cell(errTable, r.cells, "Game ID")),
        stage: text(cell(errTable, r.cells, "Stage")),
        error: text(cell(errTable, r.cells, "Error")) ?? "",
      });
    }
  }

  // 試合ごとにまとめる
  const otColumns = [...summary.header.keys()].filter((h) => /^OT\d+$/.test(h)).sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));
  const gameIds: string[] = [];
  const summaryByGame = new Map<string, typeof summary.rows>();
  for (const r of summary.rows) {
    const id = text(cell(summary, r.cells, "Game ID"));
    if (!id) {
      errors.push({ sheet: SHEETS.summary, row: r.rowNumber, message: "Game ID が空欄です" });
      continue;
    }
    if (!summaryByGame.has(id)) {
      summaryByGame.set(id, []);
      gameIds.push(id);
    }
    summaryByGame.get(id)!.push(r);
  }
  const group = <T extends Table>(t: T) => {
    const m = new Map<string, T["rows"]>();
    for (const r of t.rows) {
      const id = text(cell(t, r.cells, "Game ID"));
      if (!id) continue;
      if (!m.has(id)) m.set(id, []);
      m.get(id)!.push(r);
    }
    return m;
  };
  const playersByGame = group(playerTable);
  const totalsByGame = group(totalTable);
  for (const id of [...playersByGame.keys(), ...totalsByGame.keys()]) {
    if (!summaryByGame.has(id)) warnings.push({ sheet: SHEETS.summary, row: null, message: `${id}：Game Summary に無い試合の行があります（取り込みません）` });
  }

  for (const id of gameIds) {
    const gameErrors: ImportIssue[] = [];
    const fail = (sheet: string, row: number | null, message: string) => gameErrors.push({ sheet, row, message: `${id}：${message}` });

    // --- Game Summary(アウェー・ホームの2行)
    const rows = summaryByGame.get(id)!;
    const bySide = new Map<Side, (typeof rows)[number]>();
    for (const r of rows) {
      const side = sideOf(cell(summary, r.cells, "Home/Away"));
      if (!side) fail(SHEETS.summary, r.rowNumber, "Home/Away は Away か Home にしてください");
      else if (bySide.has(side)) fail(SHEETS.summary, r.rowNumber, `${side === "away" ? "Away" : "Home"} の行が重複しています`);
      else bySide.set(side, r);
    }
    const awayRow = bySide.get("away");
    const homeRow = bySide.get("home");
    if (!awayRow || !homeRow) {
      fail(SHEETS.summary, null, "Away と Home の2行がそろっていません");
      errors.push(...gameErrors);
      result.skippedGameIds.push(id);
      continue;
    }
    const first = awayRow.cells;
    const gameDate = dateOf(cell(summary, first, "Date"));
    const awayAbbr = siteTeamAbbr(text(cell(summary, first, "Away Team")) ?? "");
    const homeAbbr = siteTeamAbbr(text(cell(summary, first, "Home Team")) ?? "");
    if (!gameDate) fail(SHEETS.summary, awayRow.rowNumber, "Date が日付として読めません");
    for (const [side, r] of [
      ["away", awayRow],
      ["home", homeRow],
    ] as const) {
      if (dateOf(cell(summary, r.cells, "Date")) !== gameDate) fail(SHEETS.summary, r.rowNumber, "2行の Date が一致しません");
      if (siteTeamAbbr(text(cell(summary, r.cells, "Away Team")) ?? "") !== awayAbbr || siteTeamAbbr(text(cell(summary, r.cells, "Home Team")) ?? "") !== homeAbbr) {
        fail(SHEETS.summary, r.rowNumber, "2行の Away Team / Home Team が一致しません");
      }
      const team = siteTeamAbbr(text(cell(summary, r.cells, "Team")) ?? "");
      if (team !== (side === "away" ? awayAbbr : homeAbbr)) fail(SHEETS.summary, r.rowNumber, `Team（${team}）が ${side === "away" ? "Away Team" : "Home Team"} と一致しません`);
    }
    if (awayAbbr === homeAbbr) fail(SHEETS.summary, awayRow.rowNumber, "Away Team と Home Team が同じです");

    const line = (r: (typeof rows)[number]) => {
      const q = ["Q1", "Q2", "Q3", "Q4"].map((c) => num(cell(summary, r.cells, c)));
      const ot = otColumns.map((c) => num(cell(summary, r.cells, c)));
      const total = num(cell(summary, r.cells, "Total"));
      if ([...q, total].some((v) => v === null || Number.isNaN(v))) fail(SHEETS.summary, r.rowNumber, "Q1〜Q4・Total に数値でない値か空欄があります");
      if (ot.some((v) => v !== null && Number.isNaN(v))) fail(SHEETS.summary, r.rowNumber, "OT の値が数値ではありません");
      // 延長は、どちらかのチームに値がある回まで(空欄の回は延長なし)
      const sum = [...q, ...ot].reduce<number>((a, v) => a + (v !== null && !Number.isNaN(v) ? v : 0), 0);
      if (total !== null && !Number.isNaN(total) && sum !== total) fail(SHEETS.summary, r.rowNumber, `Q1〜Q4・OT の合計（${sum}）が Total（${total}）と一致しません`);
      return { q, ot, total };
    };
    const away = line(awayRow);
    const home = line(homeRow);
    const otCount = Math.max(
      ...[away.ot, home.ot].map((ot) => {
        let last = 0;
        ot.forEach((v, i) => {
          if (v !== null) last = i + 1;
        });
        return last;
      })
    );
    if (away.total !== null && home.total !== null && away.total === home.total) fail(SHEETS.summary, null, "両チームの Total が同点です（試合終了の結果か確認してください）");

    // --- Team Totals(アウェー・ホームの2行)
    const totalsRows = totalsByGame.get(id) ?? [];
    const totalsBySide = new Map<Side, ParsedBoxTotal>();
    for (const r of totalsRows) {
      const side = sideOf(cell(totalTable, r.cells, "Home/Away"));
      if (!side || totalsBySide.has(side)) {
        fail(SHEETS.totals, r.rowNumber, side ? "同じチームの行が重複しています" : "Home/Away は Away か Home にしてください");
        continue;
      }
      const issues: string[] = [];
      const stats = readStats(totalTable, r.cells, issues);
      checkStats(stats, issues);
      const team = siteTeamAbbr(text(cell(totalTable, r.cells, "Team")) ?? "");
      if (team !== (side === "away" ? awayAbbr : homeAbbr)) issues.push(`Team（${team}）が Game Summary と一致しません`);
      const expected = side === "away" ? away.total : home.total;
      if (stats.pts !== expected) issues.push(`PTS（${stats.pts ?? "空欄"}）が Game Summary の Total（${expected}）と一致しません`);
      const minutes = num(cell(totalTable, r.cells, "MP"));
      for (const m of issues) fail(SHEETS.totals, r.rowNumber, m);
      totalsBySide.set(side, { ...stats, bref_game_id: id, side, team_abbr: team, minutes: minutes === null || Number.isNaN(minutes) ? null : minutes });
    }
    if (!totalsBySide.has("away") || !totalsBySide.has("home")) fail(SHEETS.totals, null, "両チームのチーム合計がそろっていません");

    // --- Player Box Scores
    const players: ParsedBoxPlayer[] = [];
    const orderBySide = { away: 0, home: 0 };
    for (const r of playersByGame.get(id) ?? []) {
      const side = sideOf(cell(playerTable, r.cells, "Home/Away"));
      const name = text(cell(playerTable, r.cells, "Player"));
      if (!side) {
        fail(SHEETS.players, r.rowNumber, "Home/Away は Away か Home にしてください");
        continue;
      }
      if (!name) {
        fail(SHEETS.players, r.rowNumber, "Player が空欄です");
        continue;
      }
      const issues: string[] = [];
      const team = siteTeamAbbr(text(cell(playerTable, r.cells, "Team")) ?? "");
      if (team !== (side === "away" ? awayAbbr : homeAbbr)) issues.push(`${name}：Team（${team}）が Game Summary と一致しません`);
      const roleText = text(cell(playerTable, r.cells, "Starter/Bench/DNP"))?.toLowerCase();
      const role = roleText === "starter" ? "starter" : roleText === "bench" ? "bench" : roleText === "dnp" ? "dnp" : null;
      if (!role) issues.push(`${name}：Starter/Bench/DNP は Starter・Bench・DNP のいずれかにしてください`);
      const stats = readStats(playerTable, r.cells, issues);
      checkStats(stats, issues);
      const seconds = secondsOf(cell(playerTable, r.cells, "MP"));
      if (seconds !== null && Number.isNaN(seconds)) issues.push(`${name}：MP は 37:49 のような形にしてください`);
      if (role === "dnp" && STAT_COLUMNS.some(([k]) => stats[k] !== null && stats[k] !== 0)) {
        warnings.push({ sheet: SHEETS.players, row: r.rowNumber, message: `${id}：${name} は DNP ですが成績が入っています` });
      }
      const gmsc = num(cell(playerTable, r.cells, "GmSc"));
      const plusMinus = num(cell(playerTable, r.cells, "+/-"));
      for (const m of issues) fail(SHEETS.players, r.rowNumber, m.startsWith(name) ? m : `${name}：${m}`);
      orderBySide[side] += 1;
      players.push({
        ...stats,
        bref_game_id: id,
        side,
        team_abbr: team,
        row_order: orderBySide[side],
        player_name: name,
        bref_player_id: text(cell(playerTable, r.cells, "Basketball-Reference player id")),
        role: role ?? "bench",
        dnp_reason: text(cell(playerTable, r.cells, "DNP Reason")),
        seconds_played: seconds === null || Number.isNaN(seconds) ? null : seconds,
        game_score: gmsc === null || Number.isNaN(gmsc) ? null : gmsc,
        plus_minus: plusMinus === null || Number.isNaN(plusMinus) ? null : plusMinus,
      });
    }
    for (const side of ["away", "home"] as const) {
      const list = players.filter((p) => p.side === side);
      const total = totalsBySide.get(side);
      if (list.length === 0) {
        fail(SHEETS.players, null, `${side === "away" ? "アウェー" : "ホーム"}の個人成績がありません`);
        continue;
      }
      const names = new Set<string>();
      for (const p of list) {
        if (names.has(p.player_name)) fail(SHEETS.players, null, `${p.player_name} の行が重複しています`);
        names.add(p.player_name);
      }
      // 個人成績の合計がチーム合計と一致すること(両チームとも一致した試合だけを取り込む)。
      // TOV のチーム合計には、選手個人に付かないチームターンオーバーが含まれるため、個人の合計がチーム合計以下なら正しいものとする
      if (total) {
        for (const [key, column] of STAT_COLUMNS) {
          const sum = list.reduce((a, p) => a + (p[key] ?? 0), 0);
          if (key === "tov" && total.tov !== null && sum <= total.tov) continue;
          if (total[key] !== null && sum !== total[key]) {
            fail(SHEETS.players, null, `${side === "away" ? "アウェー" : "ホーム"}の個人成績の ${column} の合計（${sum}）がチーム合計（${total[key]}）と一致しません`);
          }
        }
      }
      const starters = list.filter((p) => p.role === "starter").length;
      if (starters !== 5) warnings.push({ sheet: SHEETS.players, row: null, message: `${id}：${side === "away" ? "アウェー" : "ホーム"}の先発が ${starters} 人です` });
    }

    if (gameErrors.length > 0 || !gameDate) {
      errors.push(...gameErrors);
      result.skippedGameIds.push(id);
      continue;
    }

    const qs = (q: (number | null)[]) => q.map((v) => (v === null || Number.isNaN(v) ? null : v));
    const ots = (ot: (number | null)[]) => ot.slice(0, otCount).map((v) => (v === null || Number.isNaN(v) ? 0 : v));
    const [aq1, aq2, aq3, aq4] = qs(away.q);
    const [hq1, hq2, hq3, hq4] = qs(home.q);
    result.games.push({
      bref_game_id: id,
      game_date: gameDate,
      away_abbr: awayAbbr,
      home_abbr: homeAbbr,
      away_score: away.total!,
      home_score: home.total!,
      away_q1: aq1,
      away_q2: aq2,
      away_q3: aq3,
      away_q4: aq4,
      home_q1: hq1,
      home_q2: hq2,
      home_q3: hq3,
      home_q4: hq4,
      away_ot_scores: ots(away.ot),
      home_ot_scores: ots(home.ot),
      source_url: text(cell(summary, first, "Source URL")),
    });
    result.players.push(...players);
    result.totals.push(totalsBySide.get("away")!, totalsBySide.get("home")!);
  }

  return result;
}
