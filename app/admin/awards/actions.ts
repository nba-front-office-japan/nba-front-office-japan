"use server";

// 管理画面「表彰データ」のサーバーアクション。/admin 配下は proxy.ts の管理者認証で保護されている。
// 書き込みは service_role のクライアントで行う。

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { applyAwardImport, prepareAwardImport, type AwardImportPlan, type AwardImportResult } from "@/lib/awards/history-import";
import { applyMasterImport, prepareMasterImport, type MasterImportPlan, type MasterImportResult } from "@/lib/awards/season-master-import";

// サーバーアクションの送信サイズ上限(既定1MB)に収まる大きさ
const MAX_BYTES = 900_000;

export type AwardPreviewState = { status: "idle" } | { status: "error"; message: string } | { status: "ready"; fileName: string; plan: AwardImportPlan };

export type AwardApplyState =
  | { status: "idle" }
  | { status: "error"; message: string; plan?: AwardImportPlan }
  | { status: "done"; fileName: string; result: AwardImportResult; plan: AwardImportPlan };

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function readFile(formData: FormData): Promise<{ name: string; buf: Buffer } | string> {
  const file = formData.get("xlsx");
  if (!(file instanceof File) || file.size === 0) return "Excelファイル（.xlsx）を選んでください。";
  if (!/\.xlsx$/i.test(file.name)) return "拡張子が .xlsx のファイルを選んでください。";
  if (file.size > MAX_BYTES) return `ファイルが大きすぎます（上限 ${Math.round(MAX_BYTES / 1000)}KB）。`;
  return { name: file.name, buf: Buffer.from(await file.arrayBuffer()) };
}

/** 取り込み前の確認(DBへの書き込みはしない) */
export async function previewAwardImportAction(_prev: AwardPreviewState, formData: FormData): Promise<AwardPreviewState> {
  const file = await readFile(formData);
  if (typeof file === "string") return { status: "error", message: file };
  try {
    const { plan } = await prepareAwardImport(createAdminSupabaseClient(), file.buf);
    return { status: "ready", fileName: file.name, plan };
  } catch (err) {
    return { status: "error", message: `確認中にエラーが発生しました：${errorMessage(err)}` };
  }
}

/** 取り込みの実行。直前にもう一度すべて確認し、削除がある場合は置き換えの確認が必要 */
export async function applyAwardImportAction(_prev: AwardApplyState, formData: FormData): Promise<AwardApplyState> {
  const file = await readFile(formData);
  if (typeof file === "string") return { status: "error", message: file };
  try {
    const supabase = createAdminSupabaseClient();
    const prepared = await prepareAwardImport(supabase, file.buf);
    const { plan } = prepared;
    if (plan.importRows === 0) return { status: "error", message: "取り込める表彰の行がありません。エラーの内容を確認してください。", plan };
    if (plan.toDelete > 0 && formData.get("confirmReplace") !== "yes") {
      return { status: "error", message: `今回のExcelに含まれない既存の表彰データ ${plan.toDelete}件を削除します。「今回のExcelを正として既存の表彰データを置き換える」にチェックしてから実行してください。`, plan };
    }
    const result = await applyAwardImport(supabase, prepared);
    revalidatePath("/admin/awards");
    revalidatePath("/players/[playerId]", "page");
    return { status: "done", fileName: file.name, result, plan };
  } catch (err) {
    return { status: "error", message: `取り込みに失敗しました（既存の表彰データは変更されていません）：${errorMessage(err)}` };
  }
}

// ==========================================================================
// 年度別アワード(/awards)のマスターデータ。選手プロフィール用の表彰履歴とは別のデータ
// ==========================================================================

export type MasterPreviewState = { status: "idle" } | { status: "error"; message: string } | { status: "ready"; fileName: string; plan: MasterImportPlan };

export type MasterApplyState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done"; fileName: string; result: MasterImportResult; plan: MasterImportPlan };

/** 年度別アワードの取り込み前の確認(DBへの書き込みはしない) */
export async function previewMasterImportAction(_prev: MasterPreviewState, formData: FormData): Promise<MasterPreviewState> {
  const file = await readFile(formData);
  if (typeof file === "string") return { status: "error", message: file };
  try {
    const { plan } = await prepareMasterImport(createAdminSupabaseClient(), file.buf);
    return { status: "ready", fileName: file.name, plan };
  } catch (err) {
    return { status: "error", message: `確認中にエラーが発生しました：${errorMessage(err)}` };
  }
}

/** 年度別アワードの取り込み。直前にもう一度すべて確認し、削除がある場合は置き換えの確認が必要 */
export async function applyMasterImportAction(_prev: MasterApplyState, formData: FormData): Promise<MasterApplyState> {
  const file = await readFile(formData);
  if (typeof file === "string") return { status: "error", message: file };
  try {
    const supabase = createAdminSupabaseClient();
    const prepared = await prepareMasterImport(supabase, file.buf);
    const { plan } = prepared;
    if (plan.importRows === 0) return { status: "error", message: "取り込める行がありません。エラーの内容を確認してください。" };
    if (plan.toDelete > 0 && formData.get("confirmReplace") !== "yes") {
      return { status: "error", message: `今回のExcelに含まれない既存の年度別アワード ${plan.toDelete}件を削除します。「今回のExcelを正として既存の年度別アワードを置き換える」にチェックしてから実行してください。` };
    }
    const result = await applyMasterImport(supabase, prepared);
    revalidatePath("/admin/awards");
    revalidatePath("/awards");
    return { status: "done", fileName: file.name, result, plan };
  } catch (err) {
    return { status: "error", message: `取り込みに失敗しました（既存の年度別アワードは変更されていません）：${errorMessage(err)}` };
  }
}
