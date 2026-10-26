import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchGamesForJstDate } from "@/lib/games/data";
import { isValidDateString } from "@/lib/games/date";
import type { GameSummary } from "@/lib/games/types";

// 試合センターの試合一覧(スコアを含む)。
// ネタバレ防止のため、/games のHTMLには結果を含めず、利用者が「結果を表示する」を押したときだけ
// ブラウザからこのAPIを呼んで取得する。結果がキャッシュ経由で漏れないよう、キャッシュしない。
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const view = request.nextUrl.searchParams.get("view");
  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "date は YYYY-MM-DD 形式で指定してください" }, { status: 400 });
  }

  try {
    const result = await fetchGamesForJstDate(createServerSupabaseClient(), date);
    // 個別表示では対戦カードだけを返す。得点・クオーター・延長の値は
    // ブラウザへ一切送らず、利用者がその試合を選んだ時だけ詳細APIで取得する。
    const response =
      view === "matchups" && result.status === "ok"
        ? {
            ...result,
            games: result.games.map(hideScores),
          }
        : result;
    return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

function hideScores(game: GameSummary): GameSummary {
  const hide = (team: GameSummary["home"]): GameSummary["home"] => ({
    ...team,
    score: null,
    quarters: team.quarters.map(() => null),
    overtimes: [],
  });
  return { ...game, away: hide(game.away), home: hide(game.home) };
}
