import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { collectAllActiveRssSources } from "@/lib/news/collect";

export const dynamic = "force-dynamic";

// Vercel CronがこのURLをGETで叩く。CRON_SECRETが設定されている場合、Vercelは
// Authorization: Bearer <CRON_SECRET> ヘッダを自動付与するため、それを検証する。
// ブラウザから直接叩かれても収集できてしまわないようにするための最低限のガード。
//
// Vercel Hobbyプランはcronの実行頻度が1日1回までのため、vercel.jsonのスケジュールも
// 1日1回にしている（詳細は仕様書の「30分ごと」から変更）。管理画面の「今すぐRSSを
// 収集」ボタンで随時の手動収集も可能。
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminSupabaseClient();

  try {
    const results = await collectAllActiveRssSources(supabase);
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
