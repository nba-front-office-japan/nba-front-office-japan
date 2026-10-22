// サイトのお知らせ(announcements テーブル)の読み取りと入力チェック。
// 公開サイト(トップページ・/announcements)は公開中のものだけを読む(RLS でも公開中だけに制限している)。
// テーブルがまだ無い(マイグレーション未実行)ときは「お知らせなし」として扱い、画面を壊さない。

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

export const ANNOUNCEMENT_TITLE_MAX = 200;
export const ANNOUNCEMENT_BODY_MAX = 20000;

const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"]);

export function isMissingTableError(error: { code?: string } | null): boolean {
  return Boolean(error?.code && MISSING_TABLE_CODES.has(error.code));
}

/** 公開中のお知らせ(新しい順。投稿日が同じなら作成の新しい順) */
export async function fetchPublishedAnnouncements(supabase: Client, limit?: number): Promise<Announcement[]> {
  let query = supabase
    .from("announcements")
    .select("*")
    .eq("is_published", true)
    .order("posted_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

/** 公開中のお知らせ1件(非公開・存在しない場合は null) */
export async function fetchPublishedAnnouncement(supabase: Client, id: string): Promise<Announcement | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase.from("announcements").select("*").eq("id", id).eq("is_published", true).maybeSingle();
  if (error) return null;
  return data ?? null;
}

/** 本文の短い抜粋(改行は空白にし、長い場合は … で切る) */
export function announcementExcerpt(body: string, length = 80): string {
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

/** 2026-10-23 → 2026年10月23日 */
export function formatAnnouncementDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

export type AnnouncementInput = { title: string; body: string; postedOn: string; isPublished: boolean };

/** 管理画面の入力を確かめる。問題があればエラーの文を返す */
export function validateAnnouncementInput(input: AnnouncementInput): string | null {
  if (input.title.trim() === "") return "タイトルを入力してください。";
  if (input.title.trim().length > ANNOUNCEMENT_TITLE_MAX) return `タイトルは${ANNOUNCEMENT_TITLE_MAX}文字以内にしてください。`;
  if (input.body.trim() === "") return "本文を入力してください。";
  if (input.body.trim().length > ANNOUNCEMENT_BODY_MAX) return `本文は${ANNOUNCEMENT_BODY_MAX}文字以内にしてください。`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.postedOn) || Number.isNaN(Date.parse(`${input.postedOn}T00:00:00Z`))) {
    return "投稿日を正しく入力してください。";
  }
  return null;
}
