// 試合ボックススコアCSVの仕様と、DBに依存しない検査(列・必須項目・数値・試合内の重複)。
// 管理画面の取込画面(説明表示)と、サーバー側の取込処理の両方から使う。
// チームの存在・試合の存在・選手の照合など、DBを使う検査は lib/games/box-score-import.ts で行う。

/** CSVの列(この順番・この見出しで作成する) */
export const BOX_SCORE_COLUMNS = [
  { key: "game_date", label: "試合日", required: true, description: "試合日（米国の日付、YYYY-MM-DD）。NBA公式・Basketball-Reference・balldontlieの試合日と同じ米国日付で記入します。", example: "2026-10-21" },
  { key: "away_team", label: "アウェーチーム", required: true, description: "アウェーチームの略称（例: BOS）。", example: "NYK" },
  { key: "home_team", label: "ホームチーム", required: true, description: "ホームチームの略称（例: NYK）。", example: "BOS" },
  { key: "team", label: "所属チーム", required: true, description: "その選手のチームの略称。away_team か home_team のどちらかと同じにします。", example: "BOS" },
  { key: "player", label: "選手名", required: true, description: "選手名（英語表記）。当サイトの選手データと名前で照合します。", example: "Example Player" },
  { key: "min", label: "出場時間", required: false, description: "出場時間を「分:秒」で記入（例: 34:12）。整数だけ（例: 34）も可。出場なしは 0 または空欄。", example: "34:12" },
  { key: "pts", label: "得点", required: true, description: "得点（0以上の整数）。", example: "27" },
  { key: "reb", label: "リバウンド", required: true, description: "リバウンド（0以上の整数）。", example: "8" },
  { key: "ast", label: "アシスト", required: true, description: "アシスト（0以上の整数）。", example: "5" },
  { key: "stl", label: "スティール", required: true, description: "スティール（0以上の整数）。", example: "1" },
  { key: "blk", label: "ブロック", required: true, description: "ブロック（0以上の整数）。", example: "0" },
  { key: "fgm", label: "FG成功", required: true, description: "フィールドゴール成功数（3Pを含む）。", example: "9" },
  { key: "fga", label: "FG試投", required: true, description: "フィールドゴール試投数（3Pを含む）。FG成功以上。", example: "19" },
  { key: "fg3m", label: "3P成功", required: true, description: "3ポイント成功数。FG成功以下。", example: "4" },
  { key: "fg3a", label: "3P試投", required: true, description: "3ポイント試投数。3P成功以上、FG試投以下。", example: "10" },
  { key: "ftm", label: "FT成功", required: true, description: "フリースロー成功数。", example: "5" },
  { key: "fta", label: "FT試投", required: true, description: "フリースロー試投数。FT成功以上。", example: "6" },
  { key: "plus_minus", label: "+/-", required: false, description: "プラスマイナス（整数、マイナス可）。不明なら空欄。", example: "-3" },
] as const;

export type BoxScoreColumnKey = (typeof BOX_SCORE_COLUMNS)[number]["key"];

export const BOX_SCORE_HEADER = BOX_SCORE_COLUMNS.map((c) => c.key).join(",");

/** 取り込めるファイルの上限 */
// サーバーアクションの送信サイズ上限(既定1MB)に収まるようにする
export const MAX_CSV_BYTES = 500_000;
export const MAX_CSV_ROWS = 2000;

export type CsvIssue = { line: number | null; message: string };

/** 検査済みの1行(CSVの行番号つき) */
export type ParsedBoxScoreRow = {
  line: number;
  gameDate: string;
  awayTeam: string;
  homeTeam: string;
  team: string;
  player: string;
  secondsPlayed: number;
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
  plusMinus: number | null;
};

/** rows はエラーのない行だけ。dataLineCount はエラーの行も含めたデータ行の数 */
export type ParseResult = { rows: ParsedBoxScoreRow[]; errors: CsvIssue[]; warnings: CsvIssue[]; dataLineCount: number };

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((v) => v.trim());
}

/** 試合を識別するキー(試合日・アウェー・ホーム) */
export function gameKey(row: { gameDate: string; awayTeam: string; homeTeam: string }): string {
  return `${row.gameDate}|${row.awayTeam}|${row.homeTeam}`;
}

/** 選手名の比較用(大文字小文字・発音区別符号・余分な空白を無視) */
export function normalizePlayerName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** 出場時間("MM:SS" または 整数の分)を秒に変換。空欄は0。不正ならnull */
function parseMinutes(value: string): number | null {
  if (value === "") return 0;
  const mmss = /^(\d{1,2}):([0-5]\d)$/.exec(value);
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
  if (/^\d{1,2}$/.test(value)) return Number(value) * 60;
  return null;
}

const STAT_KEYS = ["pts", "reb", "ast", "stl", "blk", "fgm", "fga", "fg3m", "fg3a", "ftm", "fta"] as const;
// 1試合の個人記録としてありえない値を誤記入として止めるための上限
const STAT_MAX = 200;
const MAX_SECONDS = 80 * 60;

/** CSVの文字列を検査して行に変換する(DBを使わない検査のみ) */
export function parseBoxScoreCsv(text: string): ParseResult {
  const errors: CsvIssue[] = [];
  const warnings: CsvIssue[] = [];
  const rows: ParsedBoxScoreRow[] = [];

  const body = text.replace(/^﻿/, "");
  if (body.includes("�")) {
    errors.push({ line: null, message: "文字化けを検出しました。CSVを「CSV UTF-8（コンマ区切り）」形式で保存し直してください。" });
    return { rows, errors, warnings, dataLineCount: 0 };
  }

  const lines = body.split(/\r\n|\n|\r/);
  const firstContent = lines.findIndex((l) => l.trim() !== "");
  if (firstContent < 0) {
    errors.push({ line: null, message: "CSVが空です。" });
    return { rows, errors, warnings, dataLineCount: 0 };
  }

  // 見出しの検査
  const header = parseCsvLine(lines[firstContent]).map((h) => h.toLowerCase());
  const missing = BOX_SCORE_COLUMNS.map((c) => c.key).filter((k) => !header.includes(k));
  if (missing.length > 0) {
    errors.push({ line: firstContent + 1, message: `必須の列がありません: ${missing.join(", ")}（1行目に列名を書いてください）` });
    return { rows, errors, warnings, dataLineCount: 0 };
  }
  const known = new Set<string>(BOX_SCORE_COLUMNS.map((c) => c.key));
  const unknown = header.filter((h) => h !== "" && !known.has(h));
  if (unknown.length > 0) warnings.push({ line: firstContent + 1, message: `使わない列は無視します: ${unknown.join(", ")}` });
  const dupHeaders = header.filter((h, i) => h !== "" && header.indexOf(h) !== i);
  if (dupHeaders.length > 0) {
    errors.push({ line: firstContent + 1, message: `同じ列名が重複しています: ${[...new Set(dupHeaders)].join(", ")}` });
    return { rows, errors, warnings, dataLineCount: 0 };
  }
  const col = (key: BoxScoreColumnKey) => header.indexOf(key);

  const dataLines = lines.slice(firstContent + 1).map((l, i) => ({ text: l, line: firstContent + 2 + i })).filter((l) => l.text.trim() !== "");
  if (dataLines.length === 0) {
    errors.push({ line: null, message: "データの行がありません（2行目以降に選手ごとのスタッツを書いてください）。" });
    return { rows, errors, warnings, dataLineCount: 0 };
  }
  if (dataLines.length > MAX_CSV_ROWS) {
    errors.push({ line: null, message: `行数が多すぎます（${dataLines.length}行）。1回の取込は${MAX_CSV_ROWS}行までにしてください。` });
    return { rows, errors, warnings, dataLineCount: dataLines.length };
  }

  const seenPlayers = new Map<string, number>();

  for (const { text: lineText, line } of dataLines) {
    const values = parseCsvLine(lineText);
    const get = (key: BoxScoreColumnKey) => values[col(key)] ?? "";
    const rowErrors: string[] = [];

    const gameDate = get("game_date");
    const awayTeam = get("away_team").toUpperCase();
    const homeTeam = get("home_team").toUpperCase();
    const team = get("team").toUpperCase();
    const player = get("player").replace(/\s+/g, " ").trim();

    for (const c of BOX_SCORE_COLUMNS) {
      if (c.required && get(c.key) === "") rowErrors.push(`「${c.key}」（${c.label}）が空欄です`);
    }
    if (gameDate !== "" && !isValidDate(gameDate)) rowErrors.push(`試合日「${gameDate}」が正しくありません（YYYY-MM-DD で記入）`);
    if (awayTeam !== "" && homeTeam !== "" && awayTeam === homeTeam) rowErrors.push("away_team と home_team が同じです");
    if (team !== "" && awayTeam !== "" && homeTeam !== "" && team !== awayTeam && team !== homeTeam) {
      rowErrors.push(`team「${team}」が away_team（${awayTeam}）・home_team（${homeTeam}）のどちらとも一致しません`);
    }

    const stats: Record<(typeof STAT_KEYS)[number], number> = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0 };
    for (const key of STAT_KEYS) {
      const raw = get(key);
      if (raw === "") continue;
      if (!/^\d+$/.test(raw)) {
        rowErrors.push(`「${key}」の値「${raw}」は0以上の整数ではありません`);
        continue;
      }
      const n = Number(raw);
      if (n > STAT_MAX) rowErrors.push(`「${key}」の値 ${n} が大きすぎます（入力ミスの可能性があります）`);
      stats[key] = n;
    }
    if (stats.fgm > stats.fga) rowErrors.push(`FG成功（fgm=${stats.fgm}）が FG試投（fga=${stats.fga}）より多くなっています`);
    if (stats.fg3m > stats.fg3a) rowErrors.push(`3P成功（fg3m=${stats.fg3m}）が 3P試投（fg3a=${stats.fg3a}）より多くなっています`);
    if (stats.ftm > stats.fta) rowErrors.push(`FT成功（ftm=${stats.ftm}）が FT試投（fta=${stats.fta}）より多くなっています`);
    if (stats.fg3m > stats.fgm) rowErrors.push(`3P成功（fg3m=${stats.fg3m}）が FG成功（fgm=${stats.fgm}）より多くなっています（FGは3Pを含む数です）`);
    if (stats.fg3a > stats.fga) rowErrors.push(`3P試投（fg3a=${stats.fg3a}）が FG試投（fga=${stats.fga}）より多くなっています（FGは3Pを含む数です）`);
    const expectedPts = 2 * (stats.fgm - stats.fg3m) + 3 * stats.fg3m + stats.ftm;
    if (rowErrors.length === 0 && expectedPts !== stats.pts) {
      warnings.push({ line, message: `${player}: 得点（${stats.pts}）が FG・3P・FTから計算した値（${expectedPts}）と一致しません` });
    }

    const minRaw = get("min");
    const seconds = parseMinutes(minRaw);
    if (seconds === null) rowErrors.push(`出場時間「${minRaw}」が正しくありません（例: 34:12）`);
    else if (seconds > MAX_SECONDS) rowErrors.push(`出場時間「${minRaw}」が長すぎます`);

    const pmRaw = get("plus_minus");
    let plusMinus: number | null = null;
    if (pmRaw !== "") {
      if (!/^[+-]?\d+$/.test(pmRaw)) rowErrors.push(`「plus_minus」の値「${pmRaw}」は整数ではありません`);
      else plusMinus = Number(pmRaw);
    }

    // 同じ試合に同じ選手が2回出てこないか
    if (player !== "" && gameDate !== "" && awayTeam !== "" && homeTeam !== "") {
      const dupKey = `${gameKey({ gameDate, awayTeam, homeTeam })}|${normalizePlayerName(player)}`;
      const prev = seenPlayers.get(dupKey);
      if (prev !== undefined) rowErrors.push(`同じ試合に選手「${player}」が重複しています（${prev}行目と重複）`);
      else seenPlayers.set(dupKey, line);
    }

    if (rowErrors.length > 0) {
      for (const message of rowErrors) errors.push({ line, message });
      continue;
    }

    rows.push({ line, gameDate, awayTeam, homeTeam, team, player, secondsPlayed: seconds ?? 0, ...stats, plusMinus });
  }

  return { rows, errors, warnings, dataLineCount: dataLines.length };
}
