"use server";

// 管理画面「試合データ」のサーバーアクション。/admin 配下は proxy.ts の管理者認証で保護されている。
// 書き込みは service_role のクライアントで行う。

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { MAX_CSV_BYTES } from "@/lib/games/box-score-csv";
import { applyBoxScoreImport, prepareBoxScoreImport, type CheckReport, type ImportResult } from "@/lib/games/box-score-import";
import { MAX_SYNC_DAYS, syncGamesFromBalldontlie, type SyncResult } from "@/lib/games/balldontlie-sync";
import { addDays, isValidDateString } from "@/lib/games/date";

export type CheckState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "checked"; fileName: string; csvText: string; report: CheckReport };

export type ImportState =
  | { status: "idle" }
  | { status: "error"; message: string; report?: CheckReport }
  | { status: "done"; results: ImportResult[] };

export type SyncState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; result: SyncResult };

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** 1. CSVを検査する(DBへの書き込みはしない) */
export async function checkBoxScoreCsvAction(_prev: CheckState, formData: FormData): Promise<CheckState> {
  const file = formData.get("csv");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "CSVファイルを選択してください。" };
  if (file.size > MAX_CSV_BYTES) return { status: "error", message: `ファイルが大きすぎます（上限 ${Math.round(MAX_CSV_BYTES / 1000)}KB）。試合ごとなどに分けてください。` };
  if (!/\.csv$/i.test(file.name)) return { status: "error", message: "拡張子が .csv のファイルを選択してください。" };

  try {
    const csvText = await file.text();
    const { report } = await prepareBoxScoreImport(createAdminSupabaseClient(), csvText);
    return { status: "checked", fileName: file.name, csvText, report };
  } catch (err) {
    return { status: "error", message: `検査中にエラーが発生しました: ${errorMessage(err)}` };
  }
}

/** 2. 検査済みのCSVを取り込む(取込直前にもう一度すべて検査し、エラーがあれば書き込まない) */
export async function importBoxScoreCsvAction(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const csvText = formData.get("csvText");
  if (typeof csvText !== "string" || csvText === "") return { status: "error", message: "取り込むCSVがありません。もう一度検査してください。" };
  if (csvText.length > MAX_CSV_BYTES) return { status: "error", message: "CSVが大きすぎます。" };

  try {
    const supabase = createAdminSupabaseClient();
    const prepared = await prepareBoxScoreImport(supabase, csvText);
    if (prepared.report.errors.length > 0) {
      return { status: "error", message: "検査でエラーが見つかったため、取り込みませんでした。", report: prepared.report };
    }
    const results = await applyBoxScoreImport(supabase, prepared);
    revalidatePath("/admin/games");
    return { status: "done", results };
  } catch (err) {
    return { status: "error", message: `取込中にエラーが発生しました: ${errorMessage(err)}` };
  }
}

/** 試合日程・クオータースコアを balldontlie から取り込む(米国の日付で指定) */
export async function syncGamesAction(_prev: SyncState, formData: FormData): Promise<SyncState> {
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  if (!isValidDateString(from) || !isValidDateString(to)) return { status: "error", message: "日付を YYYY-MM-DD で指定してください。" };
  if (from > to) return { status: "error", message: "開始日は終了日以前にしてください。" };

  const dates: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    dates.push(d);
    if (dates.length > MAX_SYNC_DAYS) return { status: "error", message: `一度に取り込めるのは${MAX_SYNC_DAYS}日分までです。` };
  }

  try {
    const result = await syncGamesFromBalldontlie(createAdminSupabaseClient(), dates);
    revalidatePath("/admin/games");
    return { status: "done", result };
  } catch (err) {
    return { status: "error", message: `取り込みに失敗しました: ${errorMessage(err)}` };
  }
}
