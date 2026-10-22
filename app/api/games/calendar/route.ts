import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchGameCountsForMonth } from "@/lib/games/data";
import { isValidMonthString } from "@/lib/games/date";

// 試合カレンダーの月ごとの試合数(日本時間の日付ごと)。試合の結果・対戦カードは含まない。
// 新しい試合を取り込んだらすぐ反映されるよう、キャッシュしない。
export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month") ?? "";
  if (!isValidMonthString(month)) {
    return NextResponse.json({ error: "month は YYYY-MM 形式で指定してください" }, { status: 400 });
  }

  try {
    const result = await fetchGameCountsForMonth(createServerSupabaseClient(), month);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
