// お知らせ(announcements)の作成・公開の切り替え(サーバー専用・service_role で実行)。
// 管理画面(app/admin/announcements/actions.ts)と入稿API(app/api/ingest/announcements)が同じ処理を使う。
// 変更したら revalidateAnnouncementPages() で、トップページ(最新3件)・お知らせのページを作り直す。

import "server-only";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { validateAnnouncementInput, type AnnouncementInput } from "@/lib/announcements";
import { SITE_URL } from "@/lib/site";

type Client = SupabaseClient<Database>;

export function announcementPublicUrl(id: string): string {
  return `${SITE_URL}/announcements/${id}`;
}

export function revalidateAnnouncementPages(id?: string) {
  revalidatePath("/");
  revalidatePath("/announcements");
  if (id) revalidatePath(`/announcements/${id}`);
  revalidatePath("/admin/announcements");
}

/** 入力を確かめてお知らせを作る(タイトル・本文は前後の空白を除いて保存) */
export async function createAnnouncement(
  supabase: Client,
  input: AnnouncementInput
): Promise<{ ok: true; id: string } | { ok: false; message: string; invalid: boolean }> {
  const invalid = validateAnnouncementInput(input);
  if (invalid) return { ok: false, message: invalid, invalid: true };

  const { data, error } = await supabase
    .from("announcements")
    .insert({ title: input.title.trim(), body: input.body.trim(), posted_on: input.postedOn, is_published: input.isPublished })
    .select("id")
    .single();
  if (error) return { ok: false, message: `保存に失敗しました：${error.message}`, invalid: false };
  return { ok: true, id: data.id };
}

/** 公開/非公開を切り替える。指定のお知らせが無ければ found: false */
export async function setAnnouncementPublished(
  supabase: Client,
  id: string,
  published: boolean
): Promise<{ ok: true; found: boolean } | { ok: false; message: string }> {
  const { data, error } = await supabase.from("announcements").update({ is_published: published }).eq("id", id).select("id");
  if (error) return { ok: false, message: `変更に失敗しました：${error.message}` };
  return { ok: true, found: (data ?? []).length > 0 };
}
