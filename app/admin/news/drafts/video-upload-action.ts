"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NEWS_MEDIA_BUCKET, newVideoPath, newsMediaPublicUrl, videoFileProblem } from "@/lib/news/body-video";
import { imageFileProblem, newImagePath } from "@/lib/news/body-image";

export type VideoUploadTicket =
  | { ok: true; signedUrl: string; publicUrl: string }
  | { ok: false; message: string };

// 記事本文に入れる MP4 動画・写真の、一時的なアップロード用URLを発行する(管理画面の「メディア挿入」から呼ぶ)。
// ファイルは大きいので、サイトのサーバーを通さず、ブラウザから Supabase Storage へ直接送る(Vercel の送信サイズの上限を避ける)。
// URL は service_role で発行するため、Storage にアップロード用のポリシーは不要。発行の前にファイル名・種類・大きさを確かめる
// (動画は50MB・写真は10MBまで。バケット側でも受け付ける種類と50MBまでに制限している)。
// /admin 配下のため、管理画面のBasic認証の内側でだけ呼べる。
async function issueUploadUrl(path: string): Promise<VideoUploadTicket> {
  const { data, error } = await createAdminSupabaseClient().storage.from(NEWS_MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    return { ok: false, message: `アップロードの準備に失敗しました（${error?.message ?? "原因不明"}）。時間をおいてもう一度お試しください。` };
  }
  return { ok: true, signedUrl: data.signedUrl, publicUrl: newsMediaPublicUrl(path) };
}

export async function createVideoUploadUrlAction(file: { name: string; type: string; size: number }): Promise<VideoUploadTicket> {
  const problem = videoFileProblem(file);
  if (problem) return { ok: false, message: problem };
  return issueUploadUrl(newVideoPath());
}

export async function createImageUploadUrlAction(file: { name: string; type: string; size: number }): Promise<VideoUploadTicket> {
  const problem = imageFileProblem(file);
  const path = newImagePath(file.name);
  if (problem || !path) return { ok: false, message: problem ?? "写真の形式を確認できませんでした。" };
  return issueUploadUrl(path);
}
