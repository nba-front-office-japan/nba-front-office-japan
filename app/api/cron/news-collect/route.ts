import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { collectAllActiveRssSources } from "@/lib/news/collect";

export const dynamic = "force-dynamic";

// Vercel CronがこのURLをGETで叩く。CRON_SECRETが設定されている場合、Vercelは
// Authorization: Bearer <CRON_SECRET> ヘッダを自動付与するため、それを検証する。
// ブラウザから直接叩かれても収集できてしまわないようにするための最低限のガード。
//
// Vercel Hobbyプランは「1つのcronにつき1日1回まで」（cron自体は100個まで登録可）。
// そのためvercel.jsonに同じパスのcronを4つ登録し、日本時間 6時・12時・15時・18時台に
// 1日4回収集している（UTC指定: 21時・3時・6時・9時。Hobbyは時刻精度±59分）。
// 管理画面の「今すぐRSSを収集」ボタンで随時の手動収集も可能。
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
