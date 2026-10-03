import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchGamesForJstDate } from "@/lib/games/data";
import { isValidDateString } from "@/lib/games/date";

// 試合センターの試合一覧(スコアを含む)。
// ネタバレ防止のため、/games のHTMLには結果を含めず、利用者が「結果を表示する」を押したときだけ
// ブラウザからこのAPIを呼んで取得する。結果がキャッシュ経由で漏れないよう、キャッシュしない。
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "date は YYYY-MM-DD 形式で指定してください" }, { status: 400 });
  }

  try {
    const result = await fetchGamesForJstDate(createServerSupabaseClient(), date);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
