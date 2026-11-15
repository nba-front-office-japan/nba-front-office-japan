import type { FeaturedCollegeStats } from "@/lib/featured-players";
import { StickyTableFrame } from "@/components/sticky-table-frame";
import { formatPct, formatStat } from "@/lib/stats";

// 選手ページの Stats に出す大学成績(lib/featured-players の college がある選手だけ)。
// NBAの成績(DBの自動取り込み)とは別の表で、手で入れた1試合平均を出す。

const COLUMNS = ["シーズン", "学校", "G", "GS", "MPG", "PTS/G", "TRB/G", "AST/G", "BLK/G", "FG%", "FT%"];

const pct = (value: number | null) => formatPct(value === null ? null : value * 100);

export function FeaturedCollegeStatsSection({ college }: { college: FeaturedCollegeStats }) {
  return (
    <section aria-labelledby="featured-college-stats" className="mt-8 border border-line bg-surface p-4 sm:p-6">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">College Stats</p>
      <h2 id="featured-college-stats" className="mb-4 text-lg font-semibold">
        大学成績（NCAA）
      </h2>
      <StickyTableFrame className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[720px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line">
              {COLUMNS.map((c) => (
                <th key={c} className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {college.seasons.map((s) => (
              <tr key={`${s.season}-${s.school}`} className="border-b border-line last:border-b-0">
                <td className="whitespace-nowrap px-2 py-2 font-bold tabular-nums">{s.season}</td>
                <td className="whitespace-nowrap px-2 py-2">{s.school}</td>
                <td className="px-2 py-2 tabular-nums">{s.games}</td>
                <td className="px-2 py-2 tabular-nums">{s.starts}</td>
                <td className="px-2 py-2 tabular-nums">{formatStat(s.mpg)}</td>
                <td className="px-2 py-2 tabular-nums">{formatStat(s.ppg)}</td>
                <td className="px-2 py-2 tabular-nums">{formatStat(s.rpg)}</td>
                <td className="px-2 py-2 tabular-nums">{formatStat(s.apg)}</td>
                <td className="px-2 py-2 tabular-nums">{formatStat(s.bpg)}</td>
                <td className="px-2 py-2 tabular-nums">{pct(s.fgPct)}</td>
                <td className="px-2 py-2 tabular-nums">{pct(s.ftPct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </StickyTableFrame>
      <p className="mt-2 text-xs leading-6 text-muted">
        NCAAディビジョン1のシーズン成績（1試合平均）です。NBAの成績とは別に掲載しています。出典：{college.source}
      </p>
    </section>
  );
}
