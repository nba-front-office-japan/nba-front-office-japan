import Link from "next/link";
import { formatMinutes, type BoxScoreRow, type GameTeamLine } from "@/lib/games/types";

// 1チーム分のボックススコア。列: 選手・MIN・PTS・REB・AST・STL・BLK・FGM/FGA・3PM/3PA・FTM/FTA・+/-
// スマホでは表だけを横スクロールにし(選手名の列は固定)、ページ全体は横にはみ出さない。
const HEADERS = ["MIN", "PTS", "REB", "AST", "STL", "BLK", "FGM/FGA", "3PM/3PA", "FTM/FTA", "+/-"] as const;

function plusMinus(v: number | null): string {
  if (v === null) return "–";
  return v > 0 ? `+${v}` : String(v);
}

export function BoxScoreTable({ side, team, rows }: { side: "アウェー" | "ホーム"; team: GameTeamLine; rows: BoxScoreRow[] }) {
  return (
    <section>
      <h3 className="mb-2 text-base font-bold">
        <span className="mr-2 text-xs font-bold text-muted">{side}</span>
        {team.name}
      </h3>
      {rows.length === 0 ? (
        <p className="border border-line bg-surface px-4 py-3 text-sm text-muted">ボックススコアは準備中です。</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-foreground text-[11px] font-extrabold text-muted">
                <th scope="col" className="sticky left-0 bg-surface px-3 py-2 text-left">
                  選手
                </th>
                {HEADERS.map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-2 py-2 text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.playerName} className="border-b border-line last:border-b-0">
                  <th scope="row" className="sticky left-0 whitespace-nowrap bg-surface px-3 py-2 text-left font-bold">
                    {r.playerId ? (
                      <Link href={`/players/${r.playerId}`} className="hover:underline">
                        {r.playerName}
                      </Link>
                    ) : (
                      r.playerName
                    )}
                  </th>
                  <td className="px-2 py-2 text-right tabular-nums">{formatMinutes(r.secondsPlayed)}</td>
                  <td className="px-2 py-2 text-right font-bold tabular-nums">{r.pts}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{r.reb}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{r.ast}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{r.stl}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{r.blk}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                    {r.fgm}/{r.fga}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                    {r.fg3m}/{r.fg3a}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                    {r.ftm}/{r.fta}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{plusMinus(r.plusMinus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
