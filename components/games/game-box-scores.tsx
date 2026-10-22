import type { GameDetail } from "@/lib/games/types";
import { BoxScoreTable } from "./box-score-table";
import { FullBoxScoreTable } from "./full-box-score-table";
import { PreseasonBoxScoreTable } from "./preseason-box-score-table";

/** 出典 URL の表示名(NBA公式・Basketball-Reference。それ以外はホスト名) */
function sourceLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "nba.com") return "NBA.com";
    if (host === "basketball-reference.com") return "Basketball-Reference";
    return host;
  } catch {
    return url;
  }
}

// 両チームのボックススコア(試合詳細ページと、試合センターの一覧の「ボックススコアを表示」で共通)。
// 新書式Excel(full) → プレシーズン(preseason) → CSV(homePlayers / awayPlayers) の順に、登録されているものを表示する。
export function GameBoxScores({ detail }: { detail: GameDetail }) {
  const { game, homePlayers, awayPlayers, preseason, full } = detail;

  if (full) {
    return (
      <div className="space-y-5">
        {/* 個人成績が取得元データで不足している試合だけ、個人成績表の上に注記を出す(完全な試合には出さない) */}
        {full.playersIncomplete && (
          <p role="note" className="border-l-4 border-gold bg-[#fff1d6] px-4 py-3 text-sm font-bold leading-6 text-[#5f3c00] dark:bg-[#3a2f12] dark:text-[#ffe2a8]">
            個人成績の一部が取得元データで不足しているため、チーム合計と一致しない場合があります。
          </p>
        )}
        <FullBoxScoreTable side="アウェー" team={game.away} rows={full.away} totals={full.awayTotals} />
        <FullBoxScoreTable side="ホーム" team={game.home} rows={full.home} totals={full.homeTotals} />
        {full.sourceUrl && (
          <p className="break-all text-xs leading-6 text-muted">
            出典：
            <a href={full.sourceUrl} target="_blank" rel="noreferrer noopener" className="text-blue underline underline-offset-2 hover:no-underline">
              {sourceLabel(full.sourceUrl)}
            </a>
          </p>
        )}
      </div>
    );
  }
  if (preseason) {
    // プレシーズン(Excelから取り込み)。選手名は出典の表記のまま、選手ページへのリンクなし
    return (
      <div className="space-y-5">
        <PreseasonBoxScoreTable side="アウェー" team={game.away} rows={preseason.away} totals={preseason.awayTotals} />
        <PreseasonBoxScoreTable side="ホーム" team={game.home} rows={preseason.home} totals={preseason.homeTotals} />
        <p className="text-xs leading-6 text-muted">プレシーズンの選手名は出典の表記のまま表示しています（選手ページへのリンクはありません）。</p>
      </div>
    );
  }
  if (homePlayers.length === 0 && awayPlayers.length === 0) {
    return <p className="border border-line bg-surface px-5 py-6 text-center text-sm text-muted">ボックススコアは準備中です。</p>;
  }
  return (
    <div className="space-y-5">
      <BoxScoreTable side="アウェー" team={game.away} rows={awayPlayers} />
      <BoxScoreTable side="ホーム" team={game.home} rows={homePlayers} />
    </div>
  );
}
