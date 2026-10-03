import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchGameDetail } from "@/lib/games/data";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 試合の詳細(スコアと両チームのボックススコア)。
// 一覧と同じく、利用者が結果の表示を選んだあとにブラウザから呼ぶ。キャッシュしない。
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/games/[gameId]">) {
  const { gameId } = await ctx.params;
  if (!UUID_RE.test(gameId)) {
    return NextResponse.json({ status: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const result = await fetchGameDetail(createServerSupabaseClient(), gameId);
    return NextResponse.json(result, {
      status: result.status === "not_found" ? 404 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
