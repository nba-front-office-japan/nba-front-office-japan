// 試合ボックススコアCSV(1試合・1チームごとに1ファイル)の仕様と、DBに依存しない検査。
// 試合日・ホーム／アウェー・クオータースコア・最終スコアは games(試合管理)の情報を使うため、
// CSVには選手別のボックススコアだけを入れる。どの試合のどちらのチームかは管理画面で選ぶ。
// 列は game_player_stats の列(supabase/migrations/20261003000000_games.sql)に合わせている。
// 試合の存在・相手チームの登録済みデータ・選手の照合など、DBを使う検査は lib/games/box-score-import.ts で行う。

/** CSVの列(この順番・この列名で作成する)。すべての列が必要で、空欄にできるのは plus_minus だけ */
export const BOX_SCORE_COLUMNS = [
  { key: "player", label: "選手名", required: true, dbColumn: "player_name", description: "選手名（英語表記）。当サイトの選手データと名前で照合します。1つのファイルに同じ選手は1行だけ。", example: "Jayson Tatum" },
  { key: "min", label: "出場時間", required: true, dbColumn: "seconds_played", description: "出場時間を「分:秒」で記入（例: 34:12）。整数だけ（例: 34）は分として扱います。出場なしは 0:00。", example: "34:12" },
  { key: "pts", label: "得点", required: true, dbColumn: "pts", description: "得点。FG・3P・FTから計算した値（2×(fgm−fg3m)＋3×fg3m＋ftm）と一致している必要があります。", example: "27" },
  { key: "reb", label: "リバウンド", required: true, dbColumn: "reb", description: "リバウンド（オフェンス・ディフェンスの合計）。", example: "8" },
  { key: "ast", label: "アシスト", required: true, dbColumn: "ast", description: "アシスト。", example: "5" },
  { key: "stl", label: "スティール", required: true, dbColumn: "stl", description: "スティール。", example: "1" },
  { key: "blk", label: "ブロック", required: true, dbColumn: "blk", description: "ブロック。", example: "0" },
  { key: "fgm", label: "FG成功", required: true, dbColumn: "fgm", description: "フィールドゴール成功数（3Pを含む）。", example: "9" },
  { key: "fga", label: "FG試投", required: true, dbColumn: "fga", description: "フィールドゴール試投数（3Pを含む）。FG成功以上。", example: "19" },
  { key: "fg3m", label: "3P成功", required: true, dbColumn: "fg3m", description: "3ポイント成功数。FG成功以下。", example: "4" },
  { key: "fg3a", label: "3P試投", required: true, dbColumn: "fg3a", description: "3ポイント試投数。3P成功以上、FG試投以下。", example: "10" },
  { key: "ftm", label: "FT成功", required: true, dbColumn: "ftm", description: "フリースロー成功数。", example: "5" },
  { key: "fta", label: "FT試投", required: true, dbColumn: "fta", description: "フリースロー試投数。FT成功以上。", example: "6" },
  { key: "plus_minus", label: "+/-", required: false, dbColumn: "plus_minus", description: "プラスマイナス（整数。マイナス可、+5 のように+を付けても可）。不明なら空欄。", example: "-3" },
] as const;

export type BoxScoreColumnKey = (typeof BOX_SCORE_COLUMNS)[number]["key"];

export const BOX_SCORE_HEADER = BOX_SCORE_COLUMNS.map((c) => c.key).join(",");

/** 記入例(実在選手の実際の成績ではない。数値の書き方の例) */
export const BOX_SCORE_EXAMPLE_ROWS: string[][] = [
  ["Example Player A", "34:12", "27", "8", "5", "1", "0", "9", "19", "4", "10", "5", "6", "-3"],
  ["Example Player B", "28:05", "12", "3", "7", "2", "1", "5", "11", "2", "5", "0", "0", "+5"],
  ["Example Player C", "0:00", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", ""],
];

/** 取り込めるファイルの上限(1チーム分なので小さく抑える) */
export const MAX_CSV_BYTES = 100_000;
export const MAX_CSV_ROWS = 40;

export type CsvIssue = { line: number | null; message: string };

/** 数値に変換できた1行 */
export type ParsedBoxScoreRow = {
  line: number;
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

/** プレビュー用の1行(エラーのある行も、CSVに書かれた文字のまま表示する) */
export type PreviewRow = { line: number; values: Record<BoxScoreColumnKey, string>; hasError: boolean };

/** rows はエラーのない行だけ。preview はすべてのデータ行 */
export type ParseResult = { rows: ParsedBoxScoreRow[]; preview: PreviewRow[]; errors: CsvIssue[]; warnings: CsvIssue[] };

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

/** 選手名の比較用(大文字小文字・発音区別符号・余分な空白を無視) */
export function normalizePlayerName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** 出場時間("MM:SS" または 整数の分)を秒に変換。不正ならnull */
function parseMinutes(value: string): number | null {
  const mmss = /^(\d{1,2}):([0-5]\d)$/.exec(value);
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
  if (/^\d{1,2}$/.test(value)) return Number(value) * 60;
  return null;
}

/** 得点をFG・3P・FTから計算した値 */
export function pointsFromShots(r: { fgm: number; fg3m: number; ftm: number }): number {
  return 2 * (r.fgm - r.fg3m) + 3 * r.fg3m + r.ftm;
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
  const preview: PreviewRow[] = [];
  const empty = (): ParseResult => ({ rows, preview, errors, warnings });

  const body = text.replace(/^﻿/, "");
  if (body.includes("�")) {
    errors.push({ line: null, message: "文字化けを検出しました。CSVを「CSV UTF-8（コンマ区切り）」形式で保存し直してください。" });
    return empty();
  }

  const lines = body.split(/\r\n|\n|\r/);
  const firstContent = lines.findIndex((l) => l.trim() !== "");
  if (firstContent < 0) {
    errors.push({ line: null, message: "CSVが空です。" });
    return empty();
  }

  // 見出し(列名)の検査
  const header = parseCsvLine(lines[firstContent]).map((h) => h.toLowerCase());
  const legacy = ["game_date", "away_team", "home_team", "team"].filter((k) => header.includes(k));
  const missing = BOX_SCORE_COLUMNS.filter((c) => !header.includes(c.key));
  if (missing.length > 0) {
    errors.push({
      line: firstContent + 1,
      message: `必要な列がありません：${missing.map((c) => `${c.key}（${c.label}）`).join("、")}。1行目の列名は雛形のとおりにしてください。`,
    });
    return empty();
  }
  const dupHeaders = header.filter((h, i) => h !== "" && header.indexOf(h) !== i);
  if (dupHeaders.length > 0) {
    errors.push({ line: firstContent + 1, message: `同じ列名が2回以上あります：${[...new Set(dupHeaders)].join("、")}` });
    return empty();
  }
  const known = new Set<string>(BOX_SCORE_COLUMNS.map((c) => c.key));
  const unknown = header.filter((h) => h !== "" && !known.has(h));
  if (legacy.length > 0) {
    warnings.push({ line: firstContent + 1, message: `列「${legacy.join("、")}」は使いません。試合とチームは画面で選んだものを使います。` });
  }
  const otherUnknown = unknown.filter((h) => !legacy.includes(h));
  if (otherUnknown.length > 0) warnings.push({ line: firstContent + 1, message: `使わない列は無視します：${otherUnknown.join("、")}` });
  const col = (key: BoxScoreColumnKey) => header.indexOf(key);

  const dataLines = lines
    .slice(firstContent + 1)
    .map((l, i) => ({ text: l, line: firstContent + 2 + i }))
    .filter((l) => l.text.replace(/,/g, "").trim() !== "");
  if (dataLines.length === 0) {
    errors.push({ line: null, message: "選手の行がありません（2行目以降に、1行に1選手ずつ記入してください）。" });
    return empty();
  }
  if (dataLines.length > MAX_CSV_ROWS) {
    errors.push({ line: null, message: `行数が多すぎます（${dataLines.length}行）。1チーム分のCSVは${MAX_CSV_ROWS}行までです。複数の試合・チームを1つのファイルにまとめていないか確認してください。` });
    return empty();
  }

  const seenPlayers = new Map<string, number>();

  for (const { text: lineText, line } of dataLines) {
    const cells = parseCsvLine(lineText);
    const get = (key: BoxScoreColumnKey) => cells[col(key)] ?? "";
    const values = Object.fromEntries(BOX_SCORE_COLUMNS.map((c) => [c.key, get(c.key)])) as Record<BoxScoreColumnKey, string>;
    const rowErrors: string[] = [];

    const player = get("player").replace(/\s+/g, " ").trim();
    values.player = player;

    for (const c of BOX_SCORE_COLUMNS) {
      if (c.required && get(c.key) === "") rowErrors.push(`${c.key}（${c.label}）が空欄です`);
    }
    if (player !== "" && /^\d+$/.test(player)) rowErrors.push(`選手名「${player}」が数字だけになっています（列がずれていないか確認してください）`);

    const stats: Record<(typeof STAT_KEYS)[number], number> = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0 };
    let numbersOk = true;
    for (const key of STAT_KEYS) {
      const raw = get(key);
      if (raw === "") {
        numbersOk = false;
        continue;
      }
      if (!/^\d+$/.test(raw)) {
        rowErrors.push(`${key} の値「${raw}」が数値ではありません（0以上の整数で記入）`);
        numbersOk = false;
        continue;
      }
      const n = Number(raw);
      if (n > STAT_MAX) rowErrors.push(`${key} の値 ${n} が大きすぎます（入力ミスの可能性があります）`);
      stats[key] = n;
    }
    if (numbersOk) {
      if (stats.fgm > stats.fga) rowErrors.push(`FG成功（fgm=${stats.fgm}）が FG試投（fga=${stats.fga}）より多くなっています`);
      if (stats.fg3m > stats.fg3a) rowErrors.push(`3P成功（fg3m=${stats.fg3m}）が 3P試投（fg3a=${stats.fg3a}）より多くなっています`);
      if (stats.ftm > stats.fta) rowErrors.push(`FT成功（ftm=${stats.ftm}）が FT試投（fta=${stats.fta}）より多くなっています`);
      if (stats.fg3m > stats.fgm) rowErrors.push(`3P成功（fg3m=${stats.fg3m}）が FG成功（fgm=${stats.fgm}）より多くなっています（FGは3Pを含む数です）`);
      if (stats.fg3a > stats.fga) rowErrors.push(`3P試投（fg3a=${stats.fg3a}）が FG試投（fga=${stats.fga}）より多くなっています（FGは3Pを含む数です）`);
      const expected = pointsFromShots(stats);
      if (expected !== stats.pts) {
        rowErrors.push(`PTS（${stats.pts}）が得点内訳から計算した値 ${expected}（2P ${stats.fgm - stats.fg3m}本×2 ＋ 3P ${stats.fg3m}本×3 ＋ FT ${stats.ftm}本）と一致しません`);
      }
    }

    const minRaw = get("min");
    let seconds: number | null = null;
    if (minRaw !== "") {
      seconds = parseMinutes(minRaw);
      if (seconds === null) rowErrors.push(`出場時間（min）「${minRaw}」の形式が正しくありません（例: 34:12）`);
      else if (seconds > MAX_SECONDS) rowErrors.push(`出場時間（min）「${minRaw}」が長すぎます`);
    }

    const pmRaw = get("plus_minus");
    let plusMinus: number | null = null;
    if (pmRaw !== "") {
      if (!/^[+-]?\d+$/.test(pmRaw)) rowErrors.push(`plus_minus の値「${pmRaw}」が数値ではありません（整数で記入。不明なら空欄）`);
      else plusMinus = Number(pmRaw);
    }

    // 同じファイル(=同じ試合の同じチーム)に同じ選手が2回出てこないか
    if (player !== "") {
      const key = normalizePlayerName(player);
      const prev = seenPlayers.get(key);
      if (prev !== undefined) rowErrors.push(`選手「${player}」が重複しています（${prev}行目と同じ選手）`);
      else seenPlayers.set(key, line);
    }

    preview.push({ line, values, hasError: rowErrors.length > 0 });
    if (rowErrors.length > 0) {
      for (const message of rowErrors) errors.push({ line, message });
      continue;
    }
    rows.push({ line, player, secondsPlayed: seconds ?? 0, ...stats, plusMinus });
  }

  return { rows, preview, errors, warnings };
}
