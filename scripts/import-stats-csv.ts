// Basketball-ReferenceからExcel/CSVで手作業投入されたスタッツをplayer_statsに取り込むスクリプト。
//
// 実行方法: npx ts-node scripts/import-stats-csv.ts <CSVファイルパス>
//
// CSVの列: 選手名, チーム略称, シーズン, シーズン種別, G, GS, MP, FG, FGA, 3P, 3PA,
//          FT, FTA, ORB, DRB, TRB, AST, STL, BLK, TOV, PF, PTS
// （Basketball-Referenceの「Totals」表をそのままエクスポートし、先頭4列を追加したもの。
//   Age/Rk/FG%等の余計な列は無視するので削除不要）
//
// 重要: Excelで保存する際は必ず「CSV UTF-8（コンマ区切り）」形式を選んでください。
// 通常の「CSV（コンマ区切り）」だとShift-JISで保存され、日本語列（シーズン種別等）が
// 文字化けして読み込めません。
//
// 選手名の照合は、まず完全一致を試み、見つからなければ発音区別符号（例: Porziņģis の
// ņ ģ 等）を取り除いた正規化名でも照合する（当サイトのplayersテーブルはASCII表記の
// ことが多いため）。

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import type { Database } from "../lib/supabase/types";

function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Basketball-Reference独自のチーム略称 → 当サイトの略称
const TEAM_ABBR_ALIASES: Record<string, string> = {
  BRK: "BKN",
  CHO: "CHA",
  PHO: "PHX",
};

type SeasonType = "regular_season" | "playoffs";

const SEASON_TYPE_LABELS: Record<string, SeasonType> = {
  レギュラーシーズン: "regular_season",
  レギュラー: "regular_season",
  プレーオフ: "playoffs",
  regular_season: "regular_season",
  playoffs: "playoffs",
};

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

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

function toInt(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function normalizeTeamAbbr(abbr: string): string {
  const upper = abbr.trim().toUpperCase();
  return TEAM_ABBR_ALIASES[upper] ?? upper;
}

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

interface PlayerRef {
  id: string;
  full_name: string;
}

async function fetchAllPlayers(
  supabase: ReturnType<typeof createAdminSupabaseClient>
): Promise<PlayerRef[]> {
  const PAGE_SIZE = 1000;
  const all: PlayerRef[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("players")
      .select("id, full_name")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`players取得に失敗しました: ${error.message}`);
    all.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return all;
}

function resolvePlayerId(
  playerName: string,
  exactMap: Map<string, string[]>,
  normalizedMap: Map<string, string[]>
): { id: string | null; note: string | null } {
  const exact = exactMap.get(playerName);
  if (exact && exact.length === 1) {
    return { id: exact[0], note: null };
  }
  if (exact && exact.length > 1) {
    return { id: null, note: `同姓同名が${exact.length}件見つかりました（完全一致）` };
  }

  const normalized = normalizedMap.get(normalizeName(playerName));
  if (normalized && normalized.length === 1) {
    return { id: normalized[0], note: "発音区別符号を無視して一致" };
  }
  if (normalized && normalized.length > 1) {
    return {
      id: null,
      note: `同姓同名が${normalized.length}件見つかりました（正規化一致）`,
    };
  }

  return { id: null, note: null };
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    throw new Error(
      "使い方: npx ts-node scripts/import-stats-csv.ts <CSVファイルパス>"
    );
  }

  const csvText = readFileSync(csvPath, "utf-8").replace(/^﻿/, "");
  const rows = parseCsv(csvText);
  console.log(`CSVから${rows.length}行読み込みました\n`);

  const supabase = createAdminSupabaseClient();

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, abbreviation");
  if (teamsError) {
    throw new Error(`teams取得に失敗しました: ${teamsError.message}`);
  }
  const teamIdByAbbr = new Map(
    (teams ?? []).map((t) => [t.abbreviation, t.id])
  );

  console.log("players一覧を取得中...");
  const players = await fetchAllPlayers(supabase);
  const exactMap = new Map<string, string[]>();
  const normalizedMap = new Map<string, string[]>();
  for (const p of players) {
    const exactList = exactMap.get(p.full_name) ?? [];
    exactList.push(p.id);
    exactMap.set(p.full_name, exactList);

    const key = normalizeName(p.full_name);
    const normList = normalizedMap.get(key) ?? [];
    normList.push(p.id);
    normalizedMap.set(key, normList);
  }
  console.log(`players ${players.length}件を読み込みました\n`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (let index = 0; index < rows.length; index++) {
    const raw = rows[index];
    const rowNum = index + 2; // ヘッダー行(1行目)を考慮

    const playerName = raw["選手名"]?.trim();
    const teamAbbrRaw = raw["チーム略称"]?.trim();
    const seasonRaw = raw["シーズン"]?.trim();
    const seasonTypeRaw = raw["シーズン種別"]?.trim();

    if (!playerName || !teamAbbrRaw || !seasonRaw || !seasonTypeRaw) {
      console.warn(`[行${rowNum}] 必須列が空のためスキップしました`);
      skipped++;
      continue;
    }

    const seasonType = SEASON_TYPE_LABELS[seasonTypeRaw];
    if (!seasonType) {
      console.warn(
        `[行${rowNum}] シーズン種別が不正です: "${seasonTypeRaw}"（"レギュラーシーズン" か "プレーオフ" を指定してください / 選手: ${playerName}）`
      );
      skipped++;
      continue;
    }

    const teamAbbr = normalizeTeamAbbr(teamAbbrRaw);
    const teamId = teamIdByAbbr.get(teamAbbr);
    if (!teamId) {
      console.warn(
        `[行${rowNum}] チーム略称が見つかりません: "${teamAbbrRaw}"（選手: ${playerName}）`
      );
      skipped++;
      continue;
    }

    const { id: playerId, note } = resolvePlayerId(
      playerName,
      exactMap,
      normalizedMap
    );
    if (!playerId) {
      console.warn(
        `[行${rowNum}] 選手が見つかりません: "${playerName}"${note ? `（${note}、手動確認が必要）` : ""}`
      );
      skipped++;
      continue;
    }
    if (note) {
      console.log(`[行${rowNum}] ${playerName}: ${note}`);
    }

    const season = toInt(seasonRaw);

    const row = {
      player_id: playerId,
      team_id: teamId,
      season,
      season_type: seasonType,
      games_played: toInt(raw["G"]),
      games_started: toInt(raw["GS"]),
      minutes_played: toInt(raw["MP"]),
      points: toInt(raw["PTS"]),
      field_goals_made: toInt(raw["FG"]),
      field_goals_attempted: toInt(raw["FGA"]),
      three_pointers_made: toInt(raw["3P"]),
      three_pointers_attempted: toInt(raw["3PA"]),
      free_throws_made: toInt(raw["FT"]),
      free_throws_attempted: toInt(raw["FTA"]),
      rebounds_offensive: toInt(raw["ORB"]),
      rebounds_defensive: toInt(raw["DRB"]),
      rebounds_total: toInt(raw["TRB"]),
      assists: toInt(raw["AST"]),
      steals: toInt(raw["STL"]),
      blocks: toInt(raw["BLK"]),
      turnovers: toInt(raw["TOV"]),
      personal_fouls: toInt(raw["PF"]),
    };

    const { data: existing, error: existingError } = await supabase
      .from("player_stats")
      .select("id")
      .eq("player_id", playerId)
      .eq("season", season)
      .eq("season_type", seasonType)
      .eq("team_id", teamId)
      .maybeSingle();

    if (existingError) {
      console.error(
        `[行${rowNum}] 既存データ確認でエラー: ${existingError.message}`
      );
      skipped++;
      continue;
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from("player_stats")
        .update(row)
        .eq("id", existing.id);
      if (updateError) {
        console.error(`[行${rowNum}] 更新に失敗: ${updateError.message}`);
        skipped++;
        continue;
      }
      updated++;
      console.log(`[行${rowNum}] 更新: ${playerName} (${teamAbbr}, ${season})`);
    } else {
      const { error: insertError } = await supabase
        .from("player_stats")
        .insert(row);
      if (insertError) {
        console.error(`[行${rowNum}] 登録に失敗: ${insertError.message}`);
        skipped++;
        continue;
      }
      inserted++;
      console.log(
        `[行${rowNum}] 新規登録: ${playerName} (${teamAbbr}, ${season})`
      );
    }
  }

  console.log("\n=== 完了 ===");
  console.log(`新規登録: ${inserted}件`);
  console.log(`更新: ${updated}件`);
  console.log(`スキップ: ${skipped}件`);
}

main().catch((error) => {
  console.error("スクリプト実行中にエラーが発生しました:", error);
  process.exit(1);
});
