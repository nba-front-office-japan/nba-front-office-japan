// 河村勇輝の Gリーグ・日本代表の試合別成績の表(選手ページの Game Log・Stats で使う)。
// 平均は合計÷試合数、FG%・3P%・FT%は合計の成功数÷試投数(NBAの Game Log と同じ考え方)。
// 出場時間が不明な試合があるときは、MIN の平均を時間の分かる試合だけで出す。
import type { GameStatLine } from "@/lib/kawamura";
import { StickyTableFrame } from "@/components/sticky-table-frame";

export type KawamuraGameRow = GameStatLine & {
  key: string;
  /** 「11/7(金)」など */
  dateLabel: string;
  opponentLabel: string;
  /** 区分(Tip-Off・順位決定戦など)。無ければ出さない */
  badge?: string;
  win: boolean | null;
  /** 「129-126」など。無ければ W/L だけ */
  scoreLabel?: string;
  plusMinus?: number | null;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** 「11/7(金)」。year: true なら「2023/8/25(金)」 */
export function gameDateLabel(date: string, year = false): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${year ? `${y}/` : ""}${m}/${d}(${weekday})`;
}

function minutesLabel(seconds: number | null): string {
  if (seconds === null) return "-";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function pct(made: number, attempted: number): string {
  return attempted === 0 ? "-" : `${((made / attempted) * 100).toFixed(1)}%`;
}

function plusMinusLabel(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return value > 0 ? `+${value}` : String(value);
}

const STICKY_CELL = "sticky left-0 z-[1]";

export function KawamuraGameTable({
  rows,
  showPlusMinus = false,
  emptyText,
}: {
  rows: KawamuraGameRow[];
  showPlusMinus?: boolean;
  emptyText: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted">{emptyText}</p>;

  const n = rows.length;
  const sum = (pick: (r: KawamuraGameRow) => number) => rows.reduce((acc, r) => acc + pick(r), 0);
  const avg = (pick: (r: KawamuraGameRow) => number) => (sum(pick) / n).toFixed(1);
  const timed = rows.filter((r) => r.seconds !== null);
  const pmRows = rows.filter((r) => r.plusMinus !== null && r.plusMinus !== undefined);
  const wins = rows.filter((r) => r.win === true).length;
  const losses = rows.filter((r) => r.win === false).length;
  const cell = "whitespace-nowrap px-2 py-2.5 text-right tabular-nums";
  const headers = ["MIN", "PTS", "REB", "AST", "STL", "BLK", "FG", "FG%", "3P", "3P%", "FT", "FT%", "ORB", "DRB", "TOV", "PF", ...(showPlusMinus ? ["+/-"] : [])];

  return (
    <div>
      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>
      <StickyTableFrame className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[980px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line">
              <th className={`${STICKY_CELL} bg-surface whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted`}>
                日付・対戦
              </th>
              <th className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted">結果</th>
              {headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-2 py-2.5 text-right text-[11px] font-bold text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="group border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
                <td className={`${STICKY_CELL} bg-surface whitespace-nowrap px-2 py-2.5 group-hover:bg-[#f6f9ff]`}>
                  <span className="mr-2 tabular-nums text-muted">{r.dateLabel}</span>
                  <span className="font-bold">{r.opponentLabel}</span>
                  {r.badge && (
                    <span className="ml-1.5 rounded border border-line px-1 py-px text-[10px] font-bold text-muted">{r.badge}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">
                  {r.win !== null && (
                    <span className={`mr-1 font-bold ${r.win ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {r.win ? "W" : "L"}
                    </span>
                  )}
                  {r.scoreLabel ?? (r.win === null ? "-" : "")}
                </td>
                <td className={cell}>{minutesLabel(r.seconds)}</td>
                <td className={`${cell} font-bold`}>{r.pts}</td>
                <td className={cell}>{r.reb}</td>
                <td className={cell}>{r.ast}</td>
                <td className={cell}>{r.stl}</td>
                <td className={cell}>{r.blk}</td>
                <td className={cell}>{`${r.fgm}-${r.fga}`}</td>
                <td className={`${cell} text-muted`}>{pct(r.fgm, r.fga)}</td>
                <td className={cell}>{`${r.fg3m}-${r.fg3a}`}</td>
                <td className={`${cell} text-muted`}>{pct(r.fg3m, r.fg3a)}</td>
                <td className={cell}>{`${r.ftm}-${r.fta}`}</td>
                <td className={`${cell} text-muted`}>{pct(r.ftm, r.fta)}</td>
                <td className={cell}>{r.oreb}</td>
                <td className={cell}>{r.dreb}</td>
                <td className={cell}>{r.tov}</td>
                <td className={cell}>{r.pf}</td>
                {showPlusMinus && <td className={cell}>{plusMinusLabel(r.plusMinus)}</td>}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-foreground/70 bg-background font-bold">
              <td className={`${STICKY_CELL} bg-background whitespace-nowrap px-2 py-3`}>
                平均<span className="ml-1 text-xs font-semibold text-muted">（{n}試合）</span>
              </td>
              <td className="whitespace-nowrap px-2 py-3 text-xs font-semibold text-muted">
                {wins + losses > 0 ? `${wins}勝${losses}敗` : ""}
              </td>
              <td className={cell}>
                {timed.length === 0 ? "-" : (timed.reduce((acc, r) => acc + (r.seconds ?? 0), 0) / 60 / timed.length).toFixed(1)}
              </td>
              <td className={cell}>{avg((r) => r.pts)}</td>
              <td className={cell}>{avg((r) => r.reb)}</td>
              <td className={cell}>{avg((r) => r.ast)}</td>
              <td className={cell}>{avg((r) => r.stl)}</td>
              <td className={cell}>{avg((r) => r.blk)}</td>
              <td className={cell}>{`${avg((r) => r.fgm)}-${avg((r) => r.fga)}`}</td>
              <td className={cell}>{pct(sum((r) => r.fgm), sum((r) => r.fga))}</td>
              <td className={cell}>{`${avg((r) => r.fg3m)}-${avg((r) => r.fg3a)}`}</td>
              <td className={cell}>{pct(sum((r) => r.fg3m), sum((r) => r.fg3a))}</td>
              <td className={cell}>{`${avg((r) => r.ftm)}-${avg((r) => r.fta)}`}</td>
              <td className={cell}>{pct(sum((r) => r.ftm), sum((r) => r.fta))}</td>
              <td className={cell}>{avg((r) => r.oreb)}</td>
              <td className={cell}>{avg((r) => r.dreb)}</td>
              <td className={cell}>{avg((r) => r.tov)}</td>
              <td className={cell}>{avg((r) => r.pf)}</td>
              {showPlusMinus && (
                <td className={cell}>
                  {pmRows.length === 0
                    ? "-"
                    : plusMinusLabel(Number((pmRows.reduce((acc, r) => acc + (r.plusMinus ?? 0), 0) / pmRows.length).toFixed(1)))}
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </StickyTableFrame>
    </div>
  );
}
