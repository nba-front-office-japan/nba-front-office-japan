import type { GameDetail } from "@/lib/games/types";
import { BoxScoreTable } from "./box-score-table";
import { FullBoxScoreTable } from "./full-box-score-table";
import { PreseasonBoxScoreTable } from "./preseason-box-score-table";

// 両チームのボックススコア(試合詳細ページと、試合センターの一覧の「ボックススコアを表示」で共通)。
// 新書式Excel(full) → プレシーズン(preseason) → CSV(homePlayers / awayPlayers) の順に、登録されているものを表示する。
export function GameBoxScores({ detail }: { detail: GameDetail }) {
  const { game, homePlayers, awayPlayers, preseason, full } = detail;

  if (full) {
    return (
      <div className="space-y-5">
        <FullBoxScoreTable side="アウェー" team={game.away} rows={full.away} totals={full.awayTotals} />
        <FullBoxScoreTable side="ホーム" team={game.home} rows={full.home} totals={full.homeTotals} />
        {full.sourceUrl && (
          <p className="break-all text-xs leading-6 text-muted">
            出典：
            <a href={full.sourceUrl} target="_blank" rel="noreferrer noopener" className="text-blue underline underline-offset-2 hover:no-underline">
              Basketball-Reference
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
