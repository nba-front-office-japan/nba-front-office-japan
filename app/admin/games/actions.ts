"use server";

// 管理画面「試合データ」のサーバーアクション。/admin 配下は proxy.ts の管理者認証で保護されている。
// 書き込みは service_role のクライアントで行う。

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { MAX_CSV_BYTES } from "@/lib/games/box-score-csv";
import { applyTeamBoxScore, isTeamSide, prepareTeamBoxScore, type CheckReport, type TeamSide } from "@/lib/games/box-score-import";
import { MAX_SYNC_DAYS, syncGamesFromBalldontlie, type SyncResult } from "@/lib/games/balldontlie-sync";
import { addDays, isValidDateString } from "@/lib/games/date";

export type CheckResult = { ok: true; report: CheckReport } | { ok: false; message: string };

export type SaveResult = { ok: true; count: number; replaced: number } | { ok: false; message: string; report?: CheckReport };

export type SyncState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; result: SyncResult };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function validateInput(gameId: unknown, side: unknown, csvText: unknown): string | null {
  if (typeof gameId !== "string" || !UUID_RE.test(gameId)) return "試合の指定が正しくありません。試合一覧から選び直してください。";
  if (!isTeamSide(side)) return "ホーム／アウェーを選んでください。";
  if (typeof csvText !== "string" || csvText.trim() === "") return "CSVファイルを選んでください。";
  if (csvText.length > MAX_CSV_BYTES) return `ファイルが大きすぎます（上限 ${Math.round(MAX_CSV_BYTES / 1000)}KB）。1試合・1チーム分だけを入れてください。`;
  return null;
}

/** CSVを検査し、登録前のプレビューを返す(DBへの書き込みはしない) */
export async function checkTeamBoxScoreAction(gameId: string, side: TeamSide, csvText: string): Promise<CheckResult> {
  const invalid = validateInput(gameId, side, csvText);
  if (invalid) return { ok: false, message: invalid };
  try {
    const prepared = await prepareTeamBoxScore(createAdminSupabaseClient(), gameId, side, csvText);
    if (!prepared) return { ok: false, message: "試合が見つかりません。試合一覧から選び直してください。" };
    return { ok: true, report: prepared.report };
  } catch (err) {
    return { ok: false, message: `検査中にエラーが発生しました：${errorMessage(err)}` };
  }
}

/** 「このチームの成績を登録」。直前にもう一度すべて検査し、エラーがあれば書き込まない */
export async function saveTeamBoxScoreAction(gameId: string, side: TeamSide, csvText: string): Promise<SaveResult> {
  const invalid = validateInput(gameId, side, csvText);
  if (invalid) return { ok: false, message: invalid };
  try {
    const supabase = createAdminSupabaseClient();
    const prepared = await prepareTeamBoxScore(supabase, gameId, side, csvText);
    if (!prepared) return { ok: false, message: "試合が見つかりません。試合一覧から選び直してください。" };
    if (prepared.report.errors.length > 0) {
      return { ok: false, message: "検査でエラーが見つかったため、登録しませんでした。", report: prepared.report };
    }
    const count = await applyTeamBoxScore(supabase, prepared);
    revalidatePath("/admin/games");
    revalidatePath(`/admin/games/${gameId}`);
    return { ok: true, count, replaced: prepared.report.existingCount };
  } catch (err) {
    return { ok: false, message: `登録に失敗しました（以前のデータのままです）：${errorMessage(err)}` };
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
