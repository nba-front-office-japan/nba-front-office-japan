import { formatMinutes, type FullBoxRow, type FullBoxTotals, type GameTeamLine } from "@/lib/games/types";
import { PlayerName, TeamName } from "./names";

// ボックススコア(新書式Excelから取り込み)の1チーム分。先発・控え・出場なし(DNP)に分けて表示する。
// 列: 選手｜分｜点｜FG｜3P｜FT｜リバウンド(O-D-合計)｜アシスト｜スティール｜ブロック｜TO｜反則｜+/-
// 選手データと照合できた選手は選手ページへリンクする。DNP は理由(出典の表記のまま)を表示する。
// スマホでは表だけを横スクロールにし(選手名の列は固定)、ページ全体は横にはみ出さない。

const STAT_HEADERS = ["分", "点", "FG", "3P", "FT", "リバウンド", "アシスト", "スティール", "ブロック", "TO", "反則", "+/-"] as const;

function pair(made: number | null, att: number | null): string {
  return made === null || att === null ? "–" : `${made}-${att}`;
}

function rebounds(o: number | null, d: number | null, total: number | null): string {
  if (o !== null && d !== null && total !== null) return `${o}-${d}-${total}`;
  return total === null ? "–" : String(total);
}

function num(v: number | null): string {
  return v === null ? "–" : String(v);
}

function plusMinus(v: number | null): string {
  if (v === null) return "–";
  return v > 0 ? `+${v}` : String(v);
}

function pct(made: number | null, att: number | null): string {
  if (made === null || att === null || att === 0) return "–";
  return `${((made / att) * 100).toFixed(1)}%`;
}

const NAME = "sticky left-0 z-10 min-w-[9.5rem] whitespace-nowrap bg-surface px-3 text-left";
const CELL = "whitespace-nowrap px-2 py-2 text-right tabular-nums";

const GROUPS: { role: FullBoxRow["role"]; label: string }[] = [
  { role: "starter", label: "先発" },
  { role: "bench", label: "控え" },
  { role: "dnp", label: "出場なし（DNP）" },
];


export function FullBoxScoreTable({
  side,
  team,
  rows,
  totals,
}: {
  side: "アウェー" | "ホーム";
  team: GameTeamLine;
  rows: FullBoxRow[];
  totals: FullBoxTotals | null;
}) {
  return (
    <section>
      <h3 className="mb-2 text-base font-bold">
        <span className="mb-0.5 block text-xs font-bold text-muted">{side}</span>
        <TeamName team={team} />
      </h3>
      {rows.length === 0 ? (
        <p className="border border-line bg-surface px-4 py-3 text-sm text-muted">個人成績は準備中です。</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-foreground text-[11px] font-extrabold text-muted">
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
            {GROUPS.map(({ role, label }) => {
              const list = rows.filter((r) => r.role === role);
              if (list.length === 0) return null;
              return (
                <tbody key={role}>
                  <tr className="border-b border-line bg-background/60">
                    <th scope="colgroup" colSpan={STAT_HEADERS.length + 1} className="sticky left-0 px-3 py-1.5 text-left text-[11px] font-extrabold text-muted">
                      {label}
                    </th>
                  </tr>
                  {list.map((r, i) => (
                    <tr key={`${r.playerName}-${i}`} className="border-b border-line last:border-b-0">
                      <th scope="row" className={`${NAME} py-2 font-bold`}>
                        <PlayerName name={r.playerName} nameJa={r.playerNameJa} playerId={r.playerId} />
                      </th>
                      {role === "dnp" ? (
                        <td colSpan={STAT_HEADERS.length} className="px-2 py-2 text-left text-xs text-muted">
                          {r.dnpReason ?? "出場なし"}
                        </td>
                      ) : (
                        <>
                          <td className={CELL}>{r.secondsPlayed === null ? "–" : formatMinutes(r.secondsPlayed)}</td>
                          <td className={`${CELL} font-bold`}>{num(r.pts)}</td>
                          <td className={CELL}>{pair(r.fgm, r.fga)}</td>
                          <td className={CELL}>{pair(r.fg3m, r.fg3a)}</td>
                          <td className={CELL}>{pair(r.ftm, r.fta)}</td>
                          <td className={CELL}>{rebounds(r.oreb, r.dreb, r.reb)}</td>
                          <td className={CELL}>{num(r.ast)}</td>
                          <td className={CELL}>{num(r.stl)}</td>
                          <td className={CELL}>{num(r.blk)}</td>
                          <td className={CELL}>{num(r.tov)}</td>
                          <td className={CELL}>{num(r.pf)}</td>
                          <td className={CELL}>{plusMinus(r.plusMinus)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              );
            })}
            {totals && (
              <tfoot>
                <tr className="border-t-2 border-foreground font-bold">
                  <th scope="row" className={`${NAME} py-2`}>
                    チーム合計
                  </th>
                  <td className={CELL} />
                  <td className={CELL}>{num(totals.pts)}</td>
                  <td className={CELL}>{pair(totals.fgm, totals.fga)}</td>
                  <td className={CELL}>{pair(totals.fg3m, totals.fg3a)}</td>
                  <td className={CELL}>{pair(totals.ftm, totals.fta)}</td>
                  <td className={CELL}>{rebounds(totals.oreb, totals.dreb, totals.reb)}</td>
                  <td className={CELL}>{num(totals.ast)}</td>
                  <td className={CELL}>{num(totals.stl)}</td>
                  <td className={CELL}>{num(totals.blk)}</td>
                  <td className={CELL}>{num(totals.tov)}</td>
                  <td className={CELL}>{num(totals.pf)}</td>
                  <td className={CELL} />
                </tr>
                <tr className="text-xs text-muted">
                  <th scope="row" className={`${NAME} py-1.5 font-normal`}>
                    成功率
                  </th>
                  <td className={CELL} />
                  <td className={CELL} />
                  <td className={CELL}>{pct(totals.fgm, totals.fga)}</td>
                  <td className={CELL}>{pct(totals.fg3m, totals.fg3a)}</td>
                  <td className={CELL}>{pct(totals.ftm, totals.fta)}</td>
                  <td colSpan={7} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </section>
  );
}
