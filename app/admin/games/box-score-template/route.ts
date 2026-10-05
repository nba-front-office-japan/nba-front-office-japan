import type { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { BOX_SCORE_HEADER } from "@/lib/games/box-score-csv";
import { isTeamSide, loadTarget } from "@/lib/games/box-score-import";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 試合ボックススコアCSVの雛形(1行目の列名のみ。1試合・1チーム分)。/admin 配下のため管理者認証の対象。
// ?game=<試合ID>&side=home|away を付けると、ファイル名に試合日・対戦・チームを入れる(中身は同じ)。
// Excelで開いたときに文字化けしないよう、先頭にBOMを付けたUTF-8で返す。
export async function GET(request: NextRequest) {
  const game = request.nextUrl.searchParams.get("game");
  const side = request.nextUrl.searchParams.get("side");

  let fileName = "box-score-template.csv";
  if (game && UUID_RE.test(game) && isTeamSide(side)) {
    try {
      const target = await loadTarget(createAdminSupabaseClient(), game, side);
      if (target) {
        const away = side === "away" ? target.teamAbbr : target.opponentAbbr;
        const home = side === "home" ? target.teamAbbr : target.opponentAbbr;
        fileName = `box-score_${target.gameDate}_${away}-at-${home}_${target.teamAbbr}.csv`.replace(/[^\w.-]/g, "");
      }
    } catch {
      // ファイル名を付けられなくても、雛形はそのまま返す
    }
  }

  return new Response(`﻿${BOX_SCORE_HEADER}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
