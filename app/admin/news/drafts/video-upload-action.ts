"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NEWS_MEDIA_BUCKET, newVideoPath, videoFileProblem, videoPublicUrl } from "@/lib/news/body-video";

export type VideoUploadTicket =
  | { ok: true; signedUrl: string; publicUrl: string }
  | { ok: false; message: string };

// 記事本文に入れる MP4 動画の、一時的なアップロード用URLを発行する(管理画面の「メディア挿入」から呼ぶ)。
// 動画は大きいので、サイトのサーバーを通さず、ブラウザから Supabase Storage へ直接送る(Vercel の送信サイズの上限を避ける)。
// URL は service_role で発行するため、Storage にアップロード用のポリシーは不要。発行の前にファイル名・種類・大きさを確かめる
// (バケット側でも video/mp4・50MB までに制限している)。/admin 配下のため、管理画面のBasic認証の内側でだけ呼べる。
export async function createVideoUploadUrlAction(file: { name: string; type: string; size: number }): Promise<VideoUploadTicket> {
  const problem = videoFileProblem(file);
  if (problem) return { ok: false, message: problem };

  const path = newVideoPath();
  const { data, error } = await createAdminSupabaseClient().storage.from(NEWS_MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    return { ok: false, message: `アップロードの準備に失敗しました（${error?.message ?? "原因不明"}）。時間をおいてもう一度お試しください。` };
  }
  return { ok: true, signedUrl: data.signedUrl, publicUrl: videoPublicUrl(path) };
}
