// 表彰データExcel(NBA_Awards_…xlsx の Awards シート)の取り込み(サーバー専用・service_roleで実行)。
// 1. Awards シートを読み、列・賞の表記・シーズン・重複を検査する
// 2. 選手を英語名でサイトの選手データ(players・player_name_aliases)と照合する。
//    同じ名前の候補が複数いる場合だけ、Excel の Current Team と 2026-27 ロスターの所属で1人に絞る。
//    1人に決まらない名前・見つからない名前は紐付けず、エラーとして返す(推測で別の選手に紐付けない)
// 3. 既存の表彰データと比べ、追加・更新・削除の予定を作る(今回のExcelを正とする)。
//    エラーになった行の選手の既存データは、取り違えを防ぐため削除しない
// 4. apply_player_award_import() で1つの処理として反映する(失敗したら全体が取り消され、以前のデータが残る)

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { ROSTER_SEASON } from "@/lib/seasons";
import { readXlsx, type CellValue } from "@/lib/games/xlsx-reader";
import { EXCEL_AWARD_MAP, TEAM_LABEL, seasonLabel, type HistoryAwardKey } from "./history";

type Client = SupabaseClient<Database>;

export type AwardImportIssue = { row: number | null; player: string | null; message: string };

type ParsedRow = {
  row: number;
  player: string;
  currentTeam: string | null;
  awardLabel: string;
  key: HistoryAwardKey;
  team: number | null;
  season: number;
  awardTeam: string | null;
  source: string | null;
};

type ImportRow = {
  player_id: string;
  season: number;
  award_key: HistoryAwardKey;
  selection_team: number | null;
  award_team: string | null;
  source: string | null;
  source_player_name: string;
};

export type AwardImportPlan = {
  /** Excel の表彰の行数(空行を除く) */
  totalRows: number;
  /** 照合できた選手数・取り込む表彰件数 */
  matchedPlayers: number;
  importRows: number;
  toInsert: number;
  toUpdate: number;
  unchanged: number;
  toDelete: number;
  /** 削除予定の記録(先頭のみ。確認用) */
  deleteSamples: string[];
  errors: AwardImportIssue[];
  warnings: AwardImportIssue[];
  /** 一致しない・1人に決まらない選手名(重複なし) */
  unmatchedPlayers: { name: string; reason: string }[];
  existingRecords: number;
};

const REQUIRED_COLUMNS = ["Player", "Current Team", "Award", "Season", "Award Team", "Source"];

function str(v: CellValue | undefined): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/** 名前の比較用(大文字小文字・発音区別符号・ピリオド・アポストロフィ・余分な空白を無視) */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 接尾辞(Jr. / Sr. / II / III / IV)を除いた名前。候補の案内にだけ使う(紐付けには使わない) */
function withoutSuffix(name: string): string {
  return normalizeName(name).replace(/\s+(jr|sr|ii|iii|iv|v)$/, "");
}

/** 「2023-24」→ 2023。形式が違う・年がつながらない場合は null */
function parseSeason(value: string): number | null {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return null;
  const start = Number(m[1]);
  return (start + 1) % 100 === Number(m[2]) && start >= 1946 && start <= 2100 ? start : null;
}

function parseAwardsSheet(rows: CellValue[][]): { parsed: ParsedRow[]; errors: AwardImportIssue[]; totalRows: number } {
  const errors: AwardImportIssue[] = [];
  const headerIndex = rows.findIndex((r) => str(r[0]) === "Player");
  if (headerIndex < 0) {
    errors.push({ row: null, player: null, message: "Awards シートに「Player」から始まる見出しの行がありません。" });
    return { parsed: [], errors, totalRows: 0 };
  }
  const header = new Map(rows[headerIndex].map((h, i) => [str(h) ?? "", i]));
  const missing = REQUIRED_COLUMNS.filter((c) => !header.has(c));
  if (missing.length > 0) {
    errors.push({ row: headerIndex + 1, player: null, message: `必要な列がありません：${missing.join("、")}` });
    return { parsed: [], errors, totalRows: 0 };
  }

  const parsed: ParsedRow[] = [];
  const seen = new Map<string, number>();
  let totalRows = 0;
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const r = rows[i];
    const get = (c: string) => str(r[header.get(c) ?? -1]);
    if (REQUIRED_COLUMNS.every((c) => get(c) === null)) continue;
    totalRows++;
    const line = i + 1;
    const player = get("Player");
    const awardLabel = get("Award");
    const seasonText = get("Season");
    const problems: string[] = [];
    if (!player) problems.push("Player（選手名）が空欄です");
    const award = awardLabel ? EXCEL_AWARD_MAP[awardLabel] : undefined;
    if (!awardLabel) problems.push("Award（賞）が空欄です");
    else if (!award) problems.push(`Award「${awardLabel}」は取り込み対象の賞ではありません`);
    const season = seasonText ? parseSeason(seasonText) : null;
    if (!seasonText) problems.push("Season が空欄です");
    else if (season === null) problems.push(`Season「${seasonText}」は「2023-24」の形ではありません`);
    if (problems.length > 0) {
      for (const message of problems) errors.push({ row: line, player, message });
      continue;
    }
    // 同じ選手・賞・シーズンは1件だけ(1st と 2nd の両方に入っている場合も重複として扱う)
    const dupKey = `${normalizeName(player!)}|${award!.key}|${season}`;
    const prev = seen.get(dupKey);
    if (prev !== undefined) {
      errors.push({ row: line, player, message: `${awardLabel} ${seasonText} が重複しています（${prev}行目と同じ選手・賞・シーズン）。この行は登録しません` });
      continue;
    }
    seen.set(dupKey, line);
    parsed.push({
      row: line,
      player: player!,
      currentTeam: get("Current Team"),
      awardLabel: awardLabel!,
      key: award!.key,
      team: award!.team,
      season: season!,
      awardTeam: get("Award Team"),
      source: get("Source"),
    });
  }
  return { parsed, errors, totalRows };
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

type Prepared = { plan: AwardImportPlan; upserts: ImportRow[]; deleteIds: string[] };

/** Excel を検査・照合し、反映の予定を作る(DBへの書き込みはしない) */
export async function prepareAwardImport(supabase: Client, file: Buffer): Promise<Prepared> {
  const sheets = readXlsx(file);
  const sheet = sheets.get("Awards");
  const empty: AwardImportPlan = {
    totalRows: 0, matchedPlayers: 0, importRows: 0, toInsert: 0, toUpdate: 0, unchanged: 0, toDelete: 0,
    deleteSamples: [], errors: [], warnings: [], unmatchedPlayers: [], existingRecords: 0,
  };
  if (!sheet) {
    return { plan: { ...empty, errors: [{ row: null, player: null, message: "Awards シートがありません（シート名「Awards」を確認してください）。" }] }, upserts: [], deleteIds: [] };
  }
  const { parsed, errors, totalRows } = parseAwardsSheet(sheet);
  const warnings: AwardImportIssue[] = [];

  const [players, aliases, rosters, teams, existing] = await Promise.all([
    fetchAll<{ id: string; full_name: string }>((f, t) => supabase.from("players").select("id, full_name").order("id").range(f, t)),
    fetchAll<{ player_id: string; alias_full_name: string }>((f, t) => supabase.from("player_name_aliases").select("player_id, alias_full_name").order("id").range(f, t)),
    fetchAll<{ player_id: string; team_id: string }>((f, t) => supabase.from("player_season_rosters").select("player_id, team_id").eq("season", ROSTER_SEASON).order("id").range(f, t)),
    fetchAll<{ id: string; abbreviation: string }>((f, t) => supabase.from("teams").select("id, abbreviation").order("id").range(f, t)),
    fetchAll<{ id: string; player_id: string; season: number; award_key: string; selection_team: number | null; award_team: string | null; source: string | null; source_player_name: string }>(
      (f, t) => supabase.from("player_award_records").select("id, player_id, season, award_key, selection_team, award_team, source, source_player_name").order("id").range(f, t)
    ),
  ]);

  const nameById = new Map(players.map((p) => [p.id, p.full_name]));
  const exact = new Map<string, Set<string>>();
  const normalized = new Map<string, Set<string>>();
  const bySuffixless = new Map<string, Set<string>>();
  const add = (m: Map<string, Set<string>>, k: string, id: string) => m.set(k, (m.get(k) ?? new Set()).add(id));
  for (const p of players) {
    add(exact, p.full_name, p.id);
    add(normalized, normalizeName(p.full_name), p.id);
    add(bySuffixless, withoutSuffix(p.full_name), p.id);
  }
  for (const a of aliases) add(normalized, normalizeName(a.alias_full_name), a.player_id);
  const abbrByTeamId = new Map(teams.map((t) => [t.id, t.abbreviation]));
  const rosterTeam = new Map(rosters.map((r) => [r.player_id, abbrByTeamId.get(r.team_id) ?? null]));

  // 選手名ごとに1回だけ照合する
  const resolved = new Map<string, { id: string } | { error: string; candidates: string[] }>();
  for (const r of parsed) {
    if (resolved.has(r.player)) continue;
    const candidates = [...(exact.get(r.player) ?? normalized.get(normalizeName(r.player)) ?? new Set<string>())];
    if (candidates.length === 1) {
      const id = candidates[0];
      const team = rosterTeam.get(id) ?? null;
      if (r.currentTeam && team && team !== r.currentTeam) {
        warnings.push({ row: r.row, player: r.player, message: `Current Team は ${r.currentTeam} ですが、サイトの 2026-27 ロスターでは ${team} です（同じ名前の選手は1人だけのため紐付けます）` });
      }
      resolved.set(r.player, { id });
      continue;
    }
    if (candidates.length > 1) {
      const byTeam = candidates.filter((id) => r.currentTeam && rosterTeam.get(id) === r.currentTeam);
      if (byTeam.length === 1) {
        resolved.set(r.player, { id: byTeam[0] });
        continue;
      }
      resolved.set(r.player, { error: `同じ名前の選手が${candidates.length}人いて、Current Team（${r.currentTeam ?? "空欄"}）でも1人に決まりません`, candidates });
      continue;
    }
    const near = [...(bySuffixless.get(withoutSuffix(r.player)) ?? new Set<string>())];
    resolved.set(r.player, {
      error: near.length > 0
        ? `サイトの選手データに同じ名前がありません（Jr. や III などの違う候補：${near.map((id) => nameById.get(id)).join("、")}。別人の可能性があるため自動では紐付けません）`
        : "サイトの選手データに同じ名前の選手がいません",
      candidates: near,
    });
  }

  const unmatched: { name: string; reason: string }[] = [];
  const blockedPlayerIds = new Set<string>();
  const upsertsByKey = new Map<string, ImportRow>();
  for (const r of parsed) {
    const m = resolved.get(r.player)!;
    if ("error" in m) {
      errors.push({ row: r.row, player: r.player, message: m.error });
      if (!unmatched.some((u) => u.name === r.player)) unmatched.push({ name: r.player, reason: m.error });
      for (const id of m.candidates) blockedPlayerIds.add(id);
      continue;
    }
    const key = `${m.id}|${r.key}|${r.season}`;
    if (upsertsByKey.has(key)) {
      errors.push({ row: r.row, player: r.player, message: `${r.awardLabel} ${seasonLabel(r.season)} が、別の表記の同じ選手の行と重複しています。この行は登録しません` });
      continue;
    }
    upsertsByKey.set(key, {
      player_id: m.id,
      season: r.season,
      award_key: r.key,
      selection_team: r.team,
      award_team: r.awardTeam,
      source: r.source,
      source_player_name: r.player,
    });
  }

  // 既存データとの比較(今回のExcelを正とする)
  const existingByKey = new Map(existing.map((e) => [`${e.player_id}|${e.award_key}|${e.season}`, e]));
  const upserts: ImportRow[] = [];
  let toInsert = 0;
  let toUpdate = 0;
  let unchanged = 0;
  for (const [key, row] of upsertsByKey) {
    const e = existingByKey.get(key);
    if (!e) {
      toInsert++;
      upserts.push(row);
    } else if (e.selection_team !== row.selection_team || e.award_team !== row.award_team || e.source !== row.source || e.source_player_name !== row.source_player_name) {
      toUpdate++;
      upserts.push(row);
    } else {
      unchanged++;
    }
  }
  // エラーになった選手(候補を含む)の既存データは、取り違えを防ぐため削除しない
  const toDeleteRows = existing.filter((e) => !upsertsByKey.has(`${e.player_id}|${e.award_key}|${e.season}`) && !blockedPlayerIds.has(e.player_id));
  const deleteSamples = toDeleteRows.slice(0, 20).map((e) => {
    const team = e.selection_team ? ` ${TEAM_LABEL[e.selection_team]}` : "";
    return `${nameById.get(e.player_id) ?? e.source_player_name}：${e.award_key}${team} ${seasonLabel(e.season)}`;
  });

  return {
    plan: {
      totalRows,
      matchedPlayers: new Set([...upsertsByKey.values()].map((r) => r.player_id)).size,
      importRows: upsertsByKey.size,
      toInsert,
      toUpdate,
      unchanged,
      toDelete: toDeleteRows.length,
      deleteSamples,
      errors: errors.sort((a, b) => (a.row ?? 0) - (b.row ?? 0)),
      warnings,
      unmatchedPlayers: unmatched,
      existingRecords: existing.length,
    },
    upserts,
    deleteIds: toDeleteRows.map((e) => e.id),
  };
}

export type AwardImportResult = { inserted: number; updated: number; deleted: number };

/** 予定どおりに反映する(1つの処理。失敗したら何も変わらない) */
export async function applyAwardImport(supabase: Client, prepared: Prepared): Promise<AwardImportResult> {
  const { data, error } = await supabase.rpc("apply_player_award_import", { p_rows: prepared.upserts, p_delete_ids: prepared.deleteIds });
  if (error) throw new Error(error.message);
  return { inserted: data?.inserted ?? 0, updated: data?.updated ?? 0, deleted: data?.deleted ?? 0 };
}
