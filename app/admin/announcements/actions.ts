"use server";

// 管理画面「お知らせ」のサーバーアクション。/admin 配下は proxy.ts の管理者認証で保護されている。
// 書き込みは service_role のクライアントで行う。変更したら、トップページ・お知らせのページを作り直す。

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { validateAnnouncementInput, type AnnouncementInput } from "@/lib/announcements";
import type { ActionState } from "@/app/admin/_components/action-ui";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readInput(formData: FormData): AnnouncementInput {
  return {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    postedOn: String(formData.get("posted_on") ?? ""),
    isPublished: formData.get("is_published") === "on",
  };
}

function revalidatePublic(id?: string) {
  revalidatePath("/");
  revalidatePath("/announcements");
  if (id) revalidatePath(`/announcements/${id}`);
  revalidatePath("/admin/announcements");
}

/** 新しいお知らせを作る。作ったら一覧へ戻る */
export async function createAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const input = readInput(formData);
  const invalid = validateAnnouncementInput(input);
  if (invalid) return { status: "error", message: invalid };

  const { data, error } = await createAdminSupabaseClient()
    .from("announcements")
    .insert({ title: input.title.trim(), body: input.body.trim(), posted_on: input.postedOn, is_published: input.isPublished })
    .select("id")
    .single();
  if (error) return { status: "error", message: `保存に失敗しました：${error.message}` };
  revalidatePublic(data.id);
  redirect("/admin/announcements?saved=created");
}

/** お知らせを更新する */
export async function updateAnnouncementAction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!UUID_RE.test(id)) return { status: "error", message: "お知らせの指定が正しくありません。" };
  const input = readInput(formData);
  const invalid = validateAnnouncementInput(input);
  if (invalid) return { status: "error", message: invalid };

  const { error } = await createAdminSupabaseClient()
    .from("announcements")
    .update({ title: input.title.trim(), body: input.body.trim(), posted_on: input.postedOn, is_published: input.isPublished })
    .eq("id", id);
  if (error) return { status: "error", message: `保存に失敗しました：${error.message}` };
  revalidatePublic(id);
  return { status: "success", message: input.isPublished ? "保存しました（公開中）。" : "保存しました（非公開）。" };
}

/** 公開/非公開を切り替える(一覧のボタン) */
export async function setAnnouncementPublishedAction(id: string, published: boolean): Promise<ActionState> {
  if (!UUID_RE.test(id)) return { status: "error", message: "お知らせの指定が正しくありません。" };
  const { error } = await createAdminSupabaseClient().from("announcements").update({ is_published: published }).eq("id", id);
  if (error) return { status: "error", message: `変更に失敗しました：${error.message}` };
  revalidatePublic(id);
  return { status: "success", message: published ? "公開しました。" : "非公開にしました。" };
}

/** お知らせを削除する(元に戻せない) */
export async function deleteAnnouncementAction(id: string): Promise<ActionState> {
  if (!UUID_RE.test(id)) return { status: "error", message: "お知らせの指定が正しくありません。" };
  const { error } = await createAdminSupabaseClient().from("announcements").delete().eq("id", id);
  if (error) return { status: "error", message: `削除に失敗しました：${error.message}` };
  revalidatePublic(id);
  return { status: "success", message: "削除しました。" };
}
