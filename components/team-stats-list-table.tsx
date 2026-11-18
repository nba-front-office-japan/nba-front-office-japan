"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StickyTableFrame } from "@/components/sticky-table-frame";
import { teamThemeBackground } from "@/lib/team-colors";
import type { TeamStatTotals, TeamStatsListRow } from "@/lib/team-stats-data";

// チームスタッツ一覧の表(30チーム)。1試合平均で表示し、見出しを押すとその場で並べ替える(30行なので画面内で並べ替える)。
// 「チーム」はそのチームの成績、「相手チーム」はそのチームと対戦した相手の成績(失点・被FG% など、守備の目安)。
// 並べ替え中の数字の列は、選手スタッツ一覧と同じ濃い赤の太字にする。

type View = "own" | "opponent";
type Column = { key: string; label: string; title: string; value: (r: TeamStatsListRow) => number | null; digits: number; pct?: boolean; signed?: boolean };

const SORTED_COLUMN_CLASS = "font-extrabold text-[#b00020]";

const perGame = (total: number, games: number) => (games > 0 ? total / games : null);
const pct = (made: number, attempted: number) => (attempted > 0 ? (made / attempted) * 100 : null);

const ZERO: TeamStatTotals = { pts: 0, fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0 };

function statColumns(pick: (r: TeamStatsListRow) => TeamStatTotals | null, prefix: string): Column[] {
  // 相手チームの合計が無いシーズン(選手成績の合算)は、相手側の列を「-」にする
  const side = (r: TeamStatsListRow) => pick(r) ?? ZERO;
  const cols: Column[] = [
    { key: `${prefix}fgPct`, label: "FG%", title: "フィールドゴール成功率", value: (r) => pct(side(r).fgm, side(r).fga), digits: 1, pct: true },
    { key: `${prefix}fg3m`, label: "3PM", title: "3ポイント成功数", value: (r) => perGame(side(r).fg3m, r.games), digits: 1 },
    { key: `${prefix}threePct`, label: "3P%", title: "3ポイント成功率", value: (r) => pct(side(r).fg3m, side(r).fg3a), digits: 1, pct: true },
    { key: `${prefix}ftPct`, label: "FT%", title: "フリースロー成功率", value: (r) => pct(side(r).ftm, side(r).fta), digits: 1, pct: true },
    { key: `${prefix}oreb`, label: "ORB", title: "オフェンスリバウンド", value: (r) => perGame(side(r).oreb, r.games), digits: 1 },
    { key: `${prefix}dreb`, label: "DRB", title: "ディフェンスリバウンド", value: (r) => perGame(side(r).dreb, r.games), digits: 1 },
    { key: `${prefix}reb`, label: "TRB", title: "リバウンド", value: (r) => perGame(side(r).reb, r.games), digits: 1 },
    { key: `${prefix}ast`, label: "AST", title: "アシスト", value: (r) => perGame(side(r).ast, r.games), digits: 1 },
    { key: `${prefix}stl`, label: "STL", title: "スティール", value: (r) => perGame(side(r).stl, r.games), digits: 1 },
    { key: `${prefix}blk`, label: "BLK", title: "ブロック", value: (r) => perGame(side(r).blk, r.games), digits: 1 },
    { key: `${prefix}tov`, label: "TOV", title: "ターンオーバー", value: (r) => perGame(side(r).tov, r.games), digits: 1 },
    { key: `${prefix}pf`, label: "PF", title: "ファウル", value: (r) => perGame(side(r).pf, r.games), digits: 1 },
  ];
  return cols.map((c) => ({ ...c, value: (r: TeamStatsListRow) => (pick(r) ? c.value(r) : null) }));
}

const RECORD_COLUMNS: Column[] = [
  { key: "games", label: "G", title: "試合数", value: (r) => r.games, digits: 0 },
  { key: "wins", label: "W", title: "勝ち", value: (r) => r.wins, digits: 0 },
  { key: "losses", label: "L", title: "負け", value: (r) => r.losses, digits: 0 },
];

const COLUMNS: Record<View, Column[]> = {
  own: [
    ...RECORD_COLUMNS,
    { key: "pts", label: "PTS", title: "得点", value: (r) => perGame(r.own.pts, r.games), digits: 1 },
    { key: "oppPts", label: "OPP", title: "失点", value: (r) => (r.opponent ? perGame(r.opponent.pts, r.games) : null), digits: 1 },
    { key: "diff", label: "DIFF", title: "得失点差(得点 − 失点)", value: (r) => (r.opponent ? perGame(r.own.pts - r.opponent.pts, r.games) : null), digits: 1, signed: true },
    ...statColumns((r) => r.own, ""),
  ],
  opponent: [
    ...RECORD_COLUMNS,
    { key: "oppPts", label: "OPP PTS", title: "失点(相手の得点)", value: (r) => (r.opponent ? perGame(r.opponent.pts, r.games) : null), digits: 1 },
    ...statColumns((r) => r.opponent, "opp_"),
  ],
};

function formatValue(col: Column, value: number | null): string {
  if (value === null) return "-";
  const text = value.toFixed(col.digits);
  if (col.pct) return `${text}%`;
  if (col.signed && value > 0) return `+${text}`;
  return text;
}

export function TeamStatsListTable({ rows, hasOpponent = true }: { rows: TeamStatsListRow[]; hasOpponent?: boolean }) {
  const [view, setView] = useState<View>("own");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "pts", dir: "desc" });
  const columns = COLUMNS[view];
  const sortColumn = columns.find((c) => c.key === sort.key) ?? null;

  const sorted = useMemo(() => {
    if (sort.key === "team") {
      return [...rows].sort((a, b) => a.nameJa.localeCompare(b.nameJa, "ja") * (sort.dir === "asc" ? 1 : -1));
    }
    if (!sortColumn) return rows;
    return [...rows].sort((a, b) => {
      const av = sortColumn.value(a);
      const bv = sortColumn.value(b);
      // 試合がないチーム(値なし)は常に末尾
      if (av === null && bv === null) return a.nameJa.localeCompare(b.nameJa, "ja");
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av - bv) * (sort.dir === "asc" ? 1 : -1) || a.nameJa.localeCompare(b.nameJa, "ja");
    });
  }, [rows, sort, sortColumn]);

  const toggleSort = (key: string) =>
    setSort((current) => (current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "team" ? "asc" : "desc" }));

  const switchView = (next: View) => {
    setView(next);
    // 切り替え先にない列で並べ替えていたら、得点(相手チームは失点)の多い順に戻す
    if (!COLUMNS[next].some((c) => c.key === sort.key) && sort.key !== "team") setSort({ key: next === "own" ? "pts" : "oppPts", dir: "desc" });
  };

  const tabClass = (active: boolean) =>
    `selection-button selection-blue border px-3 py-2 text-sm font-bold ${active ? "border-blue bg-blue text-white" : "border-line bg-surface"}`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        {/* 相手チームの合計が無いシーズン(選手成績の合算)は切り替えを出さない */}
        <div className={`flex gap-2 ${hasOpponent ? "" : "hidden"}`} role="group" aria-label="表示する成績">
          <button type="button" aria-pressed={view === "own"} onClick={() => switchView("own")} className={tabClass(view === "own")}>
            チームの成績
          </button>
          <button type="button" aria-pressed={view === "opponent"} onClick={() => switchView("opponent")} className={tabClass(view === "opponent")}>
            相手チームの成績
          </button>
        </div>
        <p className="text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">1試合平均</p>
      </div>
      {view === "opponent" && <p className="mb-2 text-xs text-muted">そのチームと対戦した相手チームの成績です（失点・相手のFG%など、守備の目安）。</p>}
      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>

      <StickyTableFrame className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[980px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className={`whitespace-nowrap px-1.5 py-2.5 text-right text-[11px] font-bold text-muted`}>
                順位
              </th>
              <th scope="col" aria-sort={sort.key === "team" ? (sort.dir === "asc" ? "ascending" : "descending") : undefined} className={`whitespace-nowrap p-0 text-left text-[11px] font-bold text-muted`}>
                <button type="button" onClick={() => toggleSort("team")} className={`block w-full px-1.5 py-2.5 text-left hover:text-foreground ${sort.key === "team" ? "text-foreground" : ""}`}>
                  チーム{sort.key === "team" ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
                </button>
              </th>
              {columns.map((col) => {
                const active = sort.key === col.key;
                return (
                  <th key={col.key} scope="col" title={col.title} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined} className={`whitespace-nowrap p-0 text-right text-[11px] font-bold text-muted`}>
                    <button type="button" onClick={() => toggleSort(col.key)} className={`block w-full px-1.5 py-2.5 text-right ${active ? SORTED_COLUMN_CLASS : "hover:text-foreground"}`}>
                      {col.label}
                      {active ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.teamId} className="border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
                <td className="whitespace-nowrap px-1.5 py-2.5 text-right font-semibold tabular-nums text-muted">{i + 1}</td>
                <td className={`whitespace-nowrap px-1.5 py-2 font-medium`}>
                  {/* スマホでは数字の列を見やすくするため、チーム名を略称の丸だけにする(名前は title と読み上げで補う) */}
                  <Link href={`/teams/${r.teamId}`} title={r.nameJa} aria-label={r.nameJa} className="group flex items-center gap-2 hover:text-blue hover:underline">
                    <span
                      className="grid h-7 w-7 flex-none place-items-center rounded-full text-[9px] font-extrabold tracking-wide text-white"
                      style={{ backgroundColor: teamThemeBackground(r.abbreviation) ?? "#2457b7" }}
                    >
                      {r.abbreviation}
                    </span>
                    <span className="max-sm:hidden">{r.nameJa}</span>
                  </Link>
                </td>
                {columns.map((col) => (
                  <td key={col.key} className={`whitespace-nowrap px-1.5 py-2.5 text-right tabular-nums ${sort.key === col.key ? SORTED_COLUMN_CLASS : "font-semibold"}`}>
                    {formatValue(col, col.value(r))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </StickyTableFrame>
    </div>
  );
}
