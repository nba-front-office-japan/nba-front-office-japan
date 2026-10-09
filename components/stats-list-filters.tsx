"use client";

import { useRouter } from "next/navigation";
import { STATS_MIN_GAMES, STATS_POSITIONS, statsQueryToSearch, type StatsQuery } from "@/lib/stats-list";

// 選手スタッツ一覧の絞り込み。条件を変えると URL を書き換えて1ページ目に戻す(並べ替えはそのまま)。
export function StatsListFilters({
  query,
  latestSeason,
  seasons,
  teams,
}: {
  query: StatsQuery;
  latestSeason: number | null;
  seasons: number[];
  teams: { abbreviation: string; name: string }[];
}) {
  const router = useRouter();
  const go = (patch: Partial<StatsQuery>) => router.push(`/stats${statsQueryToSearch(query, latestSeason, { ...patch, page: 1 })}`, { scroll: false });
  const selectClass = "min-w-[100px] border border-line bg-surface px-2.5 py-2 text-sm text-foreground";

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 border border-line bg-surface p-4">
      <div className="flex gap-2">
        {(["regular_season", "playoffs"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => go({ seasonType: type })}
            aria-pressed={query.seasonType === type}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${query.seasonType === type ? "bg-blue text-white" : "border border-line text-muted"}`}
          >
            {type === "regular_season" ? "Regular Season" : "Playoffs"}
          </button>
        ))}
      </div>

      <label className="grid gap-1.5 text-[11px] font-bold text-muted">
        SEASON
        <select value={query.season ?? "all"} onChange={(e) => go({ season: e.target.value === "all" ? null : Number(e.target.value) })} className={selectClass}>
          <option value="all">All</option>
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-[11px] font-bold text-muted">
        TEAM
        <select value={query.team ?? "all"} onChange={(e) => go({ team: e.target.value === "all" ? null : e.target.value })} className={selectClass}>
          <option value="all">All</option>
          {teams.map((t) => (
            <option key={t.abbreviation} value={t.abbreviation}>
              {t.abbreviation}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-[11px] font-bold text-muted">
        POSITION
        <select value={query.position ?? "all"} onChange={(e) => go({ position: e.target.value === "all" ? null : e.target.value })} className={selectClass}>
          <option value="all">All</option>
          {STATS_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-[11px] font-bold text-muted">
        MINIMUM GAMES
        <select value={query.minGames} onChange={(e) => go({ minGames: Number(e.target.value) })} className={selectClass}>
          {STATS_MIN_GAMES.map((g) => (
            <option key={g} value={g}>
              {g === 0 ? "All" : g}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
