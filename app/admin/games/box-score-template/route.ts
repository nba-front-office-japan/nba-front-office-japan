import { BOX_SCORE_HEADER } from "@/lib/games/box-score-csv";

// 試合ボックススコアCSVのテンプレート(列見出しのみ)。/admin 配下のため管理者認証の対象。
// Excelで開いたときに文字化けしないよう、先頭にBOMを付けたUTF-8で返す。
export function GET() {
  return new Response(`﻿${BOX_SCORE_HEADER}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="box-score-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
