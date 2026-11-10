"use client";

// 選手ページの Game Log(?view=gamelog): 今季の出場試合ごとの成績。
// 日付の範囲(開始日〜終了日、米国の試合日)で絞り込み、表の一番下に絞り込んだ試合の平均を出す(未指定なら全試合の平均)。
// 平均は合計を試合数で割り、成功率(FG%など)は合計の成功数÷試投数で出す(シーズン別成績と同じ考え方)。
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PlayerGameLogRow } from "@/lib/player-box-score-stats";
import { teamNameJa } from "@/lib/team-names-ja";
import { StickyTableFrame } from "@/components/sticky-table-frame";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** 「11/3(月)」(米国の試合日) */
function shortDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}/${d}(${weekday})`;
}

/** 「2026/11/3」 */
function fullDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${y}/${m}/${d}`;
}

function minutesLabel(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function pct(made: number, attempted: number): string {
  return attempted === 0 ? "-" : `${((made / attempted) * 100).toFixed(1)}%`;
}

function avg(value: number, games: number): string {
  return (value / games).toFixed(1);
}

function plusMinusLabel(value: number | null): string {
  if (value === null) return "-";
  return value > 0 ? `+${value}` : String(value);
}

const HEADERS = [
  "MIN",
  "PTS",
  "REB",
  "AST",
  "STL",
  "BLK",
  "FG",
  "FG%",
  "3P",
  "3P%",
  "FT",
  "FT%",
  "ORB",
  "DRB",
  "TOV",
  "PF",
  "+/-",
] as const;

const HEADER_TITLES: Partial<Record<(typeof HEADERS)[number], string>> = {
  MIN: "出場時間",
  PTS: "得点",
  REB: "リバウンド",
  AST: "アシスト",
  STL: "スティール",
  BLK: "ブロック",
  FG: "フィールドゴール 成功-試投",
  "3P": "3ポイント 成功-試投",
  FT: "フリースロー 成功-試投",
  ORB: "オフェンスリバウンド",
  DRB: "ディフェンスリバウンド",
  TOV: "ターンオーバー",
  PF: "ファウル",
  "+/-": "出場中の得失点差",
};

const PRESETS = [
  { label: "全試合", games: null },
  { label: "直近5試合", games: 5 },
  { label: "直近10試合", games: 10 },
] as const;

const STICKY_CELL = "sticky left-0 z-[1]";

export function PlayerGameLog({ rows, seasonLabel }: { rows: PlayerGameLogRow[]; seasonLabel: string }) {
  // rows は新しい試合が先
  const firstDate = rows.length > 0 ? rows[rows.length - 1].gameDate : "";
  const lastDate = rows.length > 0 ? rows[0].gameDate : "";
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  // 表の並び順(日付・対戦の見出しで切り替え)。desc=新しい試合が上、asc=古い試合が上
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const filtered = useMemo(
    () => rows.filter((r) => (from === "" || r.gameDate >= from) && (to === "" || r.gameDate <= to)),
    [rows, from, to],
  );

  const totals = useMemo(() => {
    const t = {
      seconds: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, fg3m: 0, fg3a: 0,
      ftm: 0, fta: 0, oreb: 0, dreb: 0, tov: 0, pf: 0, plusMinus: 0, plusMinusGames: 0, wins: 0,
    };
    for (const r of filtered) {
      t.seconds += r.seconds;
      t.pts += r.pts;
      t.reb += r.reb;
      t.ast += r.ast;
      t.stl += r.stl;
      t.blk += r.blk;
      t.fgm += r.fgm;
      t.fga += r.fga;
      t.fg3m += r.fg3m;
      t.fg3a += r.fg3a;
      t.ftm += r.ftm;
      t.fta += r.fta;
      t.oreb += r.oreb;
      t.dreb += r.dreb;
      t.tov += r.tov;
      t.pf += r.pf;
      if (r.plusMinus !== null) {
        t.plusMinus += r.plusMinus;
        t.plusMinusGames += 1;
      }
      if (r.teamScore > r.opponentScore) t.wins += 1;
    }
    return t;
  }, [filtered]);

  const filterActive = from !== "" || to !== "";
  const activePreset = PRESETS.find((p) =>
    p.games === null ? !filterActive : to === "" && rows.length > p.games && from === rows[p.games - 1].gameDate,
  );

  function applyPreset(games: number | null) {
    setTo("");
    setFrom(games === null || rows.length <= games ? "" : rows[games - 1].gameDate);
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted">{seasonLabel}レギュラーシーズンの出場試合はまだありません。</p>;
  }

  const n = filtered.length;
  const displayed = order === "desc" ? filtered : [...filtered].reverse();
  const cell = "whitespace-nowrap px-2 py-2.5 text-right tabular-nums";

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.games)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activePreset === p ? "bg-blue text-white" : "border border-line text-muted hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-x-3 gap-y-2 border border-line bg-background p-3 text-sm sm:p-4">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold text-muted">開始日</span>
          <input
            type="date"
            value={from}
            min={firstDate}
            max={to || lastDate}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-line bg-surface px-2 py-1.5 tabular-nums"
          />
        </label>
        <span className="pb-2 text-muted">〜</span>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold text-muted">終了日</span>
          <input
            type="date"
            value={to}
            min={from || firstDate}
            max={lastDate}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-line bg-surface px-2 py-1.5 tabular-nums"
          />
        </label>
        {filterActive && (
          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
            className="pb-2 text-sm font-semibold text-blue hover:underline"
          >
            クリア
          </button>
        )}
        <p className="w-full text-xs text-muted sm:ml-auto sm:w-auto sm:pb-2">
          {filterActive
            ? `${from ? fullDate(from) : fullDate(firstDate)}〜${to ? fullDate(to) : fullDate(lastDate)}：${n}試合（${totals.wins}勝${n - totals.wins}敗）`
            : `全${n}試合（${totals.wins}勝${n - totals.wins}敗）`}
        </p>
      </div>

      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>

      <StickyTableFrame className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[980px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line">
              <th
                aria-sort={order === "desc" ? "descending" : "ascending"}
                className={`${STICKY_CELL} bg-surface whitespace-nowrap p-0 text-left text-[11px] font-bold text-muted`}
              >
                <button
                  type="button"
                  onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
                  title="クリックで新しい順・古い順を切り替え"
                  className="block w-full px-2 py-2.5 text-left hover:text-foreground"
                >
                  日付・対戦
                  <span className="ml-1 text-blue">{order === "desc" ? "▼ 新しい順" : "▲ 古い順"}</span>
                </button>
              </th>
              <th className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted">結果</th>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  title={HEADER_TITLES[h]}
                  className="whitespace-nowrap px-2 py-2.5 text-right text-[11px] font-bold text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {n === 0 ? (
              <tr>
                <td colSpan={HEADERS.length + 2} className="px-2 py-6 text-center text-sm text-muted">
                  この期間の出場試合はありません。
                </td>
              </tr>
            ) : (
              displayed.map((r) => {
                const win = r.teamScore > r.opponentScore;
                const opponent = `${r.isHome ? "vs" : "@"} ${r.opponentAbbr}`;
                return (
                  <tr key={r.key} className="group border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
                    <td
                      className={`${STICKY_CELL} bg-surface whitespace-nowrap px-2 py-2.5 group-hover:bg-[#f6f9ff]`}
                    >
                      <span className="inline-block w-[4.6em] tabular-nums text-muted">{shortDate(r.gameDate)}</span>
                      <span className="font-bold" title={`${r.isHome ? "ホーム" : "アウェイ"}・${teamNameJa(r.opponentAbbr) ?? r.opponentAbbr}`}>
                        {opponent}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">
                      {r.scheduleGameId ? (
                        <Link href={`/games/${r.scheduleGameId}`} className="hover:underline">
                          <ResultLabel win={win} team={r.teamScore} opponent={r.opponentScore} />
                        </Link>
                      ) : (
                        <ResultLabel win={win} team={r.teamScore} opponent={r.opponentScore} />
                      )}
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
                    <td className={cell}>{plusMinusLabel(r.plusMinus)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {n > 0 && (
            <tfoot>
              <tr className="border-t-2 border-foreground/70 bg-background font-bold">
                <td className={`${STICKY_CELL} bg-background whitespace-nowrap px-2 py-3`}>
                  平均<span className="ml-1 text-xs font-semibold text-muted">（{n}試合）</span>
                </td>
                <td className="whitespace-nowrap px-2 py-3 text-xs font-semibold text-muted">
                  {totals.wins}勝{n - totals.wins}敗
                </td>
                <td className={cell}>{avg(totals.seconds / 60, n)}</td>
                <td className={cell}>{avg(totals.pts, n)}</td>
                <td className={cell}>{avg(totals.reb, n)}</td>
                <td className={cell}>{avg(totals.ast, n)}</td>
                <td className={cell}>{avg(totals.stl, n)}</td>
                <td className={cell}>{avg(totals.blk, n)}</td>
                <td className={cell}>{`${avg(totals.fgm, n)}-${avg(totals.fga, n)}`}</td>
                <td className={cell}>{pct(totals.fgm, totals.fga)}</td>
                <td className={cell}>{`${avg(totals.fg3m, n)}-${avg(totals.fg3a, n)}`}</td>
                <td className={cell}>{pct(totals.fg3m, totals.fg3a)}</td>
                <td className={cell}>{`${avg(totals.ftm, n)}-${avg(totals.fta, n)}`}</td>
                <td className={cell}>{pct(totals.ftm, totals.fta)}</td>
                <td className={cell}>{avg(totals.oreb, n)}</td>
                <td className={cell}>{avg(totals.dreb, n)}</td>
                <td className={cell}>{avg(totals.tov, n)}</td>
                <td className={cell}>{avg(totals.pf, n)}</td>
                <td className={cell}>
                  {totals.plusMinusGames === 0
                    ? "-"
                    : plusMinusLabel(Number(avg(totals.plusMinus, totals.plusMinusGames)))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </StickyTableFrame>

      <p className="mt-2 text-xs leading-6 text-muted">
        {seasonLabel}レギュラーシーズンの出場試合です（出場しなかった試合は含みません）。日付は現地（米国）の試合日です。
        平均は表示中の試合の合計を試合数で割った値で、FG%・3P%・FT%は合計の成功数÷試投数です。MIN の平均は分（小数）で表示しています。
      </p>
    </div>
  );
}

function ResultLabel({ win, team, opponent }: { win: boolean; team: number; opponent: number }) {
  return (
    <>
      <span className={`mr-1 font-bold ${win ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
        {win ? "W" : "L"}
      </span>
      {team}-{opponent}
    </>
  );
}
