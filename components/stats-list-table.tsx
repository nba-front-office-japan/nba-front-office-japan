import type { ReactNode } from "react";
import Link from "next/link";
import { formatPct, formatStat } from "@/lib/stats";
import { STATS_PAGE_SIZE, statsQueryToSearch, type StatsListRow, type StatsPage, type StatsQuery, type StatsSortKey } from "@/lib/stats-list";

// 選手スタッツ一覧の表(100人分)とページ切り替え。並べ替えは見出しのリンクで URL を変えて、DBで並べ替え直す。
// 列: 順位・選手名・チーム・POS・G・MP・PTS・ORB・DRB・TRB・AST・STL・BLK・FG%・3P%・FT%・TS%・TOV・PF

const COLUMNS: { key: StatsSortKey; label: string; render: (r: StatsListRow) => ReactNode; className?: string }[] = [
  {
    key: "playerName",
    label: "選手名",
    render: (r) => (
      <Link href={`/players/${r.player_id}`} title={r.player_name} className="block truncate hover:text-blue hover:underline">
        {r.player_name}
      </Link>
    ),
    className: "font-medium max-w-[140px]",
  },
  { key: "teamLabel", label: "チーム", render: (r) => r.team_label, className: "text-muted" },
  { key: "position", label: "POS", render: (r) => r.position ?? "—" },
  { key: "gamesPlayed", label: "G", render: (r) => r.games_played },
  { key: "mpg", label: "MP", render: (r) => formatStat(r.mpg) },
  { key: "ppg", label: "PTS", render: (r) => formatStat(r.ppg) },
  { key: "orbPg", label: "ORB", render: (r) => formatStat(r.orb_pg) },
  { key: "drbPg", label: "DRB", render: (r) => formatStat(r.drb_pg) },
  { key: "rpg", label: "TRB", render: (r) => formatStat(r.rpg) },
  { key: "apg", label: "AST", render: (r) => formatStat(r.apg) },
  { key: "stlPg", label: "STL", render: (r) => formatStat(r.stl_pg) },
  { key: "blkPg", label: "BLK", render: (r) => formatStat(r.blk_pg) },
  { key: "fgPct", label: "FG%", render: (r) => formatPct(r.fg_pct) },
  { key: "threePct", label: "3P%", render: (r) => formatPct(r.three_pct) },
  { key: "ftPct", label: "FT%", render: (r) => formatPct(r.ft_pct) },
  { key: "tsPct", label: "TS%", render: (r) => formatPct(r.ts_pct) },
  { key: "tovPg", label: "TOV", render: (r) => formatStat(r.tov_pg) },
  { key: "pfPg", label: "PF", render: (r) => formatStat(r.pf_pg) },
];

function rangeLabel(page: number, total: number): string {
  const from = (page - 1) * STATS_PAGE_SIZE + 1;
  const to = Math.min(page * STATS_PAGE_SIZE, total);
  return `${from}〜${to}位`;
}

function Pagination({ query, latestSeason, result }: { query: StatsQuery; latestSeason: number | null; result: StatsPage }) {
  const { page, lastPage, total } = result;
  if (total === 0) return null;
  const href = (p: number) => `/stats${statsQueryToSearch(query, latestSeason, { page: p })}`;
  // 表示する範囲のリンク: 最初・最後と、今のページの前後2ページ
  const pages = [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, lastPage])].filter((p) => p >= 1 && p <= lastPage).sort((a, b) => a - b);
  const linkClass = "border border-line bg-surface px-3 py-2 text-sm font-bold tabular-nums hover:border-blue";
  return (
    <nav aria-label="ページ切り替え" className="mt-4 flex flex-wrap items-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkClass}>
          ← 前へ
        </Link>
      ) : (
        <span className={`${linkClass} cursor-not-allowed opacity-40`}>← 前へ</span>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - pages[i - 1] > 1 && <span className="text-muted">…</span>}
          {p === page ? (
            <span aria-current="page" className="border border-blue bg-blue px-3 py-2 text-sm font-bold tabular-nums text-white">
              {rangeLabel(p, total)}
            </span>
          ) : (
            <Link href={href(p)} className={linkClass}>
              {rangeLabel(p, total)}
            </Link>
          )}
        </span>
      ))}
      {page < lastPage ? (
        <Link href={href(page + 1)} className={linkClass}>
          次へ →
        </Link>
      ) : (
        <span className={`${linkClass} cursor-not-allowed opacity-40`}>次へ →</span>
      )}
    </nav>
  );
}

export function StatsListTable({ query, latestSeason, result }: { query: StatsQuery; latestSeason: number | null; result: StatsPage }) {
  const sortHref = (key: StatsSortKey) => {
    // 同じ列なら昇順・降順を入れ替え、別の列なら数値は降順・文字は昇順から。並べ替えを変えたら1ページ目に戻る
    const textKey = ["playerName", "teamLabel", "position"].includes(key);
    const dir = key === query.sort ? (query.dir === "asc" ? "desc" : "asc") : textKey ? "asc" : "desc";
    return `/stats${statsQueryToSearch(query, latestSeason, { sort: key, dir, page: 1 })}`;
  };
  const { rows, total, page, from } = result;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <p className="text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">1試合平均</p>
        <p className="text-sm" role="status">
          {total > 0 ? (
            <>
              <b className="tabular-nums">{rangeLabel(page, total)}</b>
              <span className="text-muted">を表示（全{total}人）</span>
            </>
          ) : (
            <span className="text-muted">該当する選手がいません</span>
          )}
        </p>
      </div>
      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>

      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[940px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="whitespace-nowrap px-1.5 py-2.5 text-right text-[11px] font-bold text-muted">
                順位
              </th>
              {COLUMNS.map((col) => (
                <th key={col.key} scope="col" aria-sort={query.sort === col.key ? (query.dir === "asc" ? "ascending" : "descending") : undefined} className="whitespace-nowrap p-0 text-left text-[11px] font-bold text-muted">
                  <Link href={sortHref(col.key)} scroll={false} className={`block px-1.5 py-2.5 hover:text-foreground ${query.sort === col.key ? "text-foreground" : ""}`}>
                    {col.label}
                    {query.sort === col.key ? (query.dir === "asc" ? " ▲" : " ▼") : ""}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-3 py-6 text-center text-sm text-muted">
                  データがありません。
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className="border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
                  <td className="whitespace-nowrap px-1.5 py-3 text-right font-semibold tabular-nums text-muted">{from + i + 1}</td>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className={`whitespace-nowrap px-1.5 py-3 font-semibold ${col.className ?? ""}`}>
                      {col.render(r)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination query={query} latestSeason={latestSeason} result={result} />
    </div>
  );
}
