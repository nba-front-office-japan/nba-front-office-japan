import type { GameTeamLine, PreseasonBoxRow, PreseasonBoxTotals } from "@/lib/games/types";

// プレシーズンの個人成績(1チーム分)。管理画面で取り込んだ Excel の内容をそのまま表示する。
// 列: ポジション｜選手名｜分｜点｜FG｜3P｜FT｜リバウンド｜アシスト｜スティール｜ブロック｜TO｜反則
// 選手名は出典の表記のまま表示し、選手ページへのリンクは付けない(選手データとは照合していない)。
// スマホでは表だけを横スクロールにし(ポジション・選手名の列は固定)、ページ全体は横にはみ出さない。
// レギュラーシーズンの表(box-score-table.tsx)とは別の部品で、そちらの表示は変えない。

const STAT_HEADERS = ["分", "点", "FG", "3P", "FT", "リバウンド", "アシスト", "スティール", "ブロック", "TO", "反則"] as const;

function pair(made: number | null, att: number | null): string {
  return made === null || att === null ? "–" : `${made}-${att}`;
}

function num(v: number | null): string {
  return v === null ? "–" : String(v);
}

const POS = "sticky left-0 z-10 w-[4.5rem] min-w-[4.5rem] whitespace-nowrap bg-surface px-2 text-left";
const NAME = "sticky left-[4.5rem] z-10 whitespace-nowrap bg-surface px-3 text-left";
const CELL = "whitespace-nowrap px-2 py-2 text-right tabular-nums";

export function PreseasonBoxScoreTable({
  side,
  team,
  rows,
  totals,
}: {
  side: "アウェー" | "ホーム";
  team: GameTeamLine;
  rows: PreseasonBoxRow[];
  totals: PreseasonBoxTotals | null;
}) {
  return (
    <section>
      <h3 className="mb-2 text-base font-bold">
        <span className="mr-2 text-xs font-bold text-muted">{side}</span>
        {team.name}
      </h3>
      {rows.length === 0 ? (
        <p className="border border-line bg-surface px-4 py-3 text-sm text-muted">個人成績は準備中です。</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-foreground text-[11px] font-extrabold text-muted">
                <th scope="col" className={`${POS} py-2`}>
                  ポジション
                </th>
                <th scope="col" className={`${NAME} py-2`}>
                  選手名
                </th>
                {STAT_HEADERS.map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-2 py-2 text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.playerName}-${i}`} className="border-b border-line last:border-b-0">
                  <td className={`${POS} py-2 text-xs font-bold text-muted`}>{r.position ?? ""}</td>
                  <th scope="row" className={`${NAME} py-2 font-bold`}>
                    {r.playerName}
                  </th>
                  {r.played ? (
                    <>
                      <td className={CELL}>{num(r.minutes)}</td>
                      <td className={`${CELL} font-bold`}>{num(r.pts)}</td>
                      <td className={CELL}>{pair(r.fgm, r.fga)}</td>
                      <td className={CELL}>{pair(r.fg3m, r.fg3a)}</td>
                      <td className={CELL}>{pair(r.ftm, r.fta)}</td>
                      <td className={CELL}>{num(r.reb)}</td>
                      <td className={CELL}>{num(r.ast)}</td>
                      <td className={CELL}>{num(r.stl)}</td>
                      <td className={CELL}>{num(r.blk)}</td>
                      <td className={CELL}>{num(r.tov)}</td>
                      <td className={CELL}>{num(r.pf)}</td>
                    </>
                  ) : (
                    <td colSpan={STAT_HEADERS.length} className="px-2 py-2 text-left text-xs text-muted">
                      出場なし
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {totals && (
              <tfoot>
                <tr className="border-t-2 border-foreground font-bold">
                  <td className={`${POS} py-2`} />
                  <th scope="row" className={`${NAME} py-2`}>
                    チーム合計
                  </th>
                  <td className={CELL} />
                  <td className={CELL}>{num(totals.pts)}</td>
                  <td className={CELL}>{pair(totals.fgm, totals.fga)}</td>
                  <td className={CELL}>{pair(totals.fg3m, totals.fg3a)}</td>
                  <td className={CELL}>{pair(totals.ftm, totals.fta)}</td>
                  <td className={CELL}>{num(totals.reb)}</td>
                  <td className={CELL}>{num(totals.ast)}</td>
                  <td className={CELL}>{num(totals.stl)}</td>
                  <td className={CELL}>{num(totals.blk)}</td>
                  <td className={CELL}>{num(totals.tov)}</td>
                  <td className={CELL}>{num(totals.pf)}</td>
                </tr>
                {(totals.fgPct || totals.fg3Pct || totals.ftPct) && (
                  <tr className="text-xs text-muted">
                    <td className={`${POS} py-1.5`} />
                    <th scope="row" className={`${NAME} py-1.5 font-normal`}>
                      成功率
                    </th>
                    <td className={CELL} />
                    <td className={CELL} />
                    <td className={CELL}>{totals.fgPct ?? "–"}</td>
                    <td className={CELL}>{totals.fg3Pct ?? "–"}</td>
                    <td className={CELL}>{totals.ftPct ?? "–"}</td>
                    <td colSpan={6} />
                  </tr>
                )}
              </tfoot>
            )}
          </table>
        </div>
      )}
    </section>
  );
}
