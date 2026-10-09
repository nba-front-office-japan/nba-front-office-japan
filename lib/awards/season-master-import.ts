// 年度別アワードのマスターExcel(NBA_Awards_Master_…xlsx)の取り込み(サーバー専用・service_roleで実行)。
// 使うシートは「Awards Data」(個人賞・All-NBA など)と「All-Star」(オールスター選出)だけ。
// Stat Leaders・Records・Player Summary などのシートは読まない。
// 1. 列・賞の表記・区分(1st/2nd/3rd・East/West)・シーズン・重複を検査する
// 2. 選手名をサイトの選手データと照合する(プロフィールへのリンク用)。1人に決まる場合だけ選手IDを付け、
//    見つからない(引退選手など)・同じ名前が複数いる場合はリンクなしで登録する(エラーにはしない)
// 3. 既存のマスターデータと比べ、追加・更新・削除の予定を作る(今回のExcelを正とする)
// 4. apply_nba_season_award_import() で1つの処理として反映する(失敗したら全体が取り消され、以前のデータが残る)
// 選手プロフィール用の表彰履歴(player_award_records)には触れない。

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { readXlsx, type CellValue } from "@/lib/games/xlsx-reader";
import { seasonLabel } from "./history";
import { DETAIL_LABEL, MASTER_AWARD_LABEL, MASTER_AWARD_MAP, type SeasonAwardKey } from "./season-master";

type Client = SupabaseClient<Database>;

export type MasterIssue = { sheet: string; row: number | null; player: string | null; message: string };

type Row = {
  season: number;
  award_key: SeasonAwardKey;
  detail: string;
  player_name: string;
  player_id: string | null;
  team: string | null;
  source: string | null;
};

export type MasterImportPlan = {
  awardRows: number;
  allStarRows: number;
  seasons: number;
  seasonRange: string;
  importRows: number;
  toInsert: number;
  toUpdate: number;
  unchanged: number;
  toDelete: number;
  deleteSamples: string[];
  errors: MasterIssue[];
  /** 選手プロフィールへリンクできた選手数・できなかった選手数(引退選手などは正常にリンクなし) */
  linkedPlayers: number;
  unlinkedPlayers: number;
  /** 同じ名前の選手が複数いてリンクを付けなかった名前 */
  ambiguousNames: string[];
  existingRecords: number;
};

function str(v: CellValue | undefined): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSeason(value: string | null): number | null {
  const m = value ? /^(\d{4})-(\d{2})$/.exec(value) : null;
  if (!m) return null;
  const start = Number(m[1]);
  return (start + 1) % 100 === Number(m[2]) && start >= 1946 && start <= 2100 ? start : null;
}

function sheetRows(rows: CellValue[][], required: string[], sheet: string, errors: MasterIssue[]) {
  const headerIndex = rows.findIndex((r) => str(r[0]) === "Player");
  if (headerIndex < 0) {
    errors.push({ sheet, row: null, player: null, message: `「${sheet}」シートに「Player」から始まる見出しの行がありません。` });
    return null;
  }
  const header = new Map(rows[headerIndex].map((h, i) => [str(h) ?? "", i]));
  const missing = required.filter((c) => !header.has(c));
  if (missing.length > 0) {
    errors.push({ sheet, row: headerIndex + 1, player: null, message: `必要な列がありません：${missing.join("、")}` });
    return null;
  }
  return { headerIndex, get: (r: CellValue[], c: string) => str(r[header.get(c) ?? -1]) };
}

async function fetchAll<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await fetchPage(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

type Prepared = { plan: MasterImportPlan; upserts: Row[]; deleteIds: string[] };

/** Excel を検査・照合し、反映の予定を作る(DBへの書き込みはしない) */
export async function prepareMasterImport(supabase: Client, file: Buffer): Promise<Prepared> {
  const sheets = readXlsx(file);
  const errors: MasterIssue[] = [];
  const parsed: Omit<Row, "player_id">[] = [];
  const seen = new Map<string, string>();
  let awardRows = 0;
  let allStarRows = 0;

  const add = (sheet: string, line: number, row: Omit<Row, "player_id">) => {
    const key = `${row.season}|${row.award_key}|${row.detail}|${normalizeName(row.player_name)}`;
    const prev = seen.get(key);
    if (prev) {
      errors.push({ sheet, row: line, player: row.player_name, message: `${MASTER_AWARD_LABEL[row.award_key]} ${seasonLabel(row.season)} が重複しています（${prev}と同じ）。この行は登録しません` });
      return;
    }
    seen.set(key, `${sheet} ${line}行目`);
    parsed.push(row);
  };

  // --- Awards Data ---
  const ad = sheets.get("Awards Data");
  if (!ad) errors.push({ sheet: "Awards Data", row: null, player: null, message: "「Awards Data」シートがありません。" });
  else {
    const s = sheetRows(ad, ["Player", "Award", "Season", "Detail", "Team", "Source"], "Awards Data", errors);
    if (s) {
      for (let i = s.headerIndex + 1; i < ad.length; i++) {
        const r = ad[i];
        const player = s.get(r, "Player");
        const award = s.get(r, "Award");
        const seasonText = s.get(r, "Season");
        if (!player && !award && !seasonText) continue;
        awardRows++;
        const line = i + 1;
        const def = award ? MASTER_AWARD_MAP[award] : undefined;
        const season = parseSeason(seasonText);
        const detail = s.get(r, "Detail") ?? "";
        const problems: string[] = [];
        if (!player) problems.push("Player（選手名）が空欄です");
        if (!award) problems.push("Award（賞）が空欄です");
        else if (!def) problems.push(`Award「${award}」は年度別アワードの対象の賞ではありません`);
        if (season === null) problems.push(`Season「${seasonText ?? ""}」は「2023-24」の形ではありません`);
        if (def && !def.details.includes(detail)) {
          problems.push(def.details[0] === "" ? `Detail「${detail}」は ${award} では空欄にしてください` : `Detail「${detail || "空欄"}」は ${def.details.join(" / ")} のどれかにしてください`);
        }
        if (problems.length > 0) {
          for (const message of problems) errors.push({ sheet: "Awards Data", row: line, player, message });
          continue;
        }
        add("Awards Data", line, { season: season!, award_key: def!.key, detail, player_name: player!, team: s.get(r, "Team"), source: s.get(r, "Source") });
      }
    }
  }

  // --- All-Star ---
  const as = sheets.get("All-Star");
  if (!as) errors.push({ sheet: "All-Star", row: null, player: null, message: "「All-Star」シートがありません。" });
  else {
    const s = sheetRows(as, ["Player", "Season", "Selection Type", "Source"], "All-Star", errors);
    if (s) {
      for (let i = s.headerIndex + 1; i < as.length; i++) {
        const r = as[i];
        const player = s.get(r, "Player");
        const seasonText = s.get(r, "Season");
        if (!player && !seasonText) continue;
        allStarRows++;
        const line = i + 1;
        const season = parseSeason(seasonText);
        const problems: string[] = [];
        if (!player) problems.push("Player（選手名）が空欄です");
        if (season === null) problems.push(`Season「${seasonText ?? ""}」は「2023-24」の形ではありません`);
        if (problems.length > 0) {
          for (const message of problems) errors.push({ sheet: "All-Star", row: line, player, message });
          continue;
        }
        add("All-Star", line, { season: season!, award_key: "all_star", detail: "", player_name: player!, team: null, source: s.get(r, "Source") });
      }
    }
  }

  // --- 選手プロフィールへのリンク(1人に決まる場合だけ) ---
  const [players, aliases, existing] = await Promise.all([
    fetchAll<{ id: string; full_name: string }>((f, t) => supabase.from("players").select("id, full_name").order("id").range(f, t)),
    fetchAll<{ player_id: string; alias_full_name: string }>((f, t) => supabase.from("player_name_aliases").select("player_id, alias_full_name").order("id").range(f, t)),
    fetchAll<{ id: string; season: number; award_key: string; detail: string; player_name: string; player_id: string | null; team: string | null; source: string | null }>(
      (f, t) => supabase.from("nba_season_awards").select("id, season, award_key, detail, player_name, player_id, team, source").order("id").range(f, t)
    ),
  ]);
  const exact = new Map<string, Set<string>>();
  const normalized = new Map<string, Set<string>>();
  const put = (m: Map<string, Set<string>>, k: string, id: string) => m.set(k, (m.get(k) ?? new Set()).add(id));
  for (const p of players) {
    put(exact, p.full_name, p.id);
    put(normalized, normalizeName(p.full_name), p.id);
  }
  for (const a of aliases) put(normalized, normalizeName(a.alias_full_name), a.player_id);
  const linkOf = new Map<string, string | null>();
  const ambiguous = new Set<string>();
  for (const name of new Set(parsed.map((r) => r.player_name))) {
    const c = [...(exact.get(name) ?? normalized.get(normalizeName(name)) ?? new Set<string>())];
    linkOf.set(name, c.length === 1 ? c[0] : null);
    if (c.length > 1) ambiguous.add(name);
  }
  const rows: Row[] = parsed.map((r) => ({ ...r, player_id: linkOf.get(r.player_name) ?? null }));

  // --- 既存データとの比較(今回のExcelを正とする) ---
  const keyOf = (r: { season: number; award_key: string; detail: string; player_name: string }) => `${r.season}|${r.award_key}|${r.detail}|${r.player_name}`;
  const existingByKey = new Map(existing.map((e) => [keyOf(e), e]));
  const fileKeys = new Set(rows.map(keyOf));
  const upserts: Row[] = [];
  let toInsert = 0;
  let toUpdate = 0;
  let unchanged = 0;
  for (const r of rows) {
    const e = existingByKey.get(keyOf(r));
    if (!e) {
      toInsert++;
      upserts.push(r);
    } else if (e.player_id !== r.player_id || e.team !== r.team || e.source !== r.source) {
      toUpdate++;
      upserts.push(r);
    } else {
      unchanged++;
    }
  }
  const toDeleteRows = existing.filter((e) => !fileKeys.has(keyOf(e)));
  const seasons = [...new Set(rows.map((r) => r.season))].sort((a, b) => a - b);
  const names = [...linkOf.entries()];

  return {
    plan: {
      awardRows,
      allStarRows,
      seasons: seasons.length,
      seasonRange: seasons.length > 0 ? `${seasonLabel(seasons[0])}〜${seasonLabel(seasons[seasons.length - 1])}` : "—",
      importRows: rows.length,
      toInsert,
      toUpdate,
      unchanged,
      toDelete: toDeleteRows.length,
      deleteSamples: toDeleteRows.slice(0, 20).map((e) => `${seasonLabel(e.season)} ${MASTER_AWARD_LABEL[e.award_key as SeasonAwardKey] ?? e.award_key}${e.detail ? ` ${DETAIL_LABEL[e.detail] ?? e.detail}` : ""}：${e.player_name}`),
      errors: errors.sort((a, b) => a.sheet.localeCompare(b.sheet) || (a.row ?? 0) - (b.row ?? 0)),
      linkedPlayers: names.filter(([, id]) => id).length,
      unlinkedPlayers: names.filter(([, id]) => !id).length,
      ambiguousNames: [...ambiguous],
      existingRecords: existing.length,
    },
    upserts,
    deleteIds: toDeleteRows.map((e) => e.id),
  };
}

export type MasterImportResult = { inserted: number; updated: number; deleted: number };

export async function applyMasterImport(supabase: Client, prepared: Prepared): Promise<MasterImportResult> {
  const { data, error } = await supabase.rpc("apply_nba_season_award_import", { p_rows: prepared.upserts, p_delete_ids: prepared.deleteIds });
  if (error) throw new Error(error.message);
  return { inserted: data?.inserted ?? 0, updated: data?.updated ?? 0, deleted: data?.deleted ?? 0 };
}
