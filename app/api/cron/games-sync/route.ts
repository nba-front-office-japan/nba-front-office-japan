import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { defaultSyncDates, syncGamesFromBalldontlie } from "@/lib/games/balldontlie-sync";

export const dynamic = "force-dynamic";

// 試合日程・試合状況・クオータースコア・合計得点を balldontlie(無料プラン、/v1/games のみ)から取り込む。
// 選手別のボックススコアは取得しない(管理画面のCSV取込で登録する)。
// 日本時間の前日〜翌日の試合を含む米国の日付(4日分)を、1回のリクエストで取得する。
// vercel.json の crons で毎日 UTC 7:05(日本時間16:05ごろ)に実行する("5 7 * * *")。
// Hobbyプランでは実行時刻に最大59分のずれがあり、日本時間16:05〜17:04の間に実行される。
// 米国の前日夜の試合は日本時間の昼までに終わるため、この時刻なら前日分の最終結果を取り込める。
// 認証は news-collect と同じく、CRON_SECRET が設定されていれば Authorization: Bearer を検証する。
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await syncGamesFromBalldontlie(createAdminSupabaseClient(), defaultSyncDates());
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
