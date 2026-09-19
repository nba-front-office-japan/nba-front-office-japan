import Link from "next/link";
import { formatStat, formatPct, type DerivedStats } from "@/lib/stats";

export interface TeamStatsRow {
  id: string;
  name: string;
  teamAbbr: string;
  position: string | null;
  gamesPlayed: number | null;
  stats: DerivedStats | null;
}

const COLUMNS: { key: keyof DerivedStats; label: string }[] = [
  { key: "mpg", label: "MPG" },
  { key: "ppg", label: "PTS" },
  { key: "orbPg", label: "ORB" },
  { key: "drbPg", label: "DRB" },
  { key: "rpg", label: "TRB" },
  { key: "apg", label: "AST" },
  { key: "stlPg", label: "STL" },
  { key: "blkPg", label: "BLK" },
];

const PCT_COLUMNS: { key: "fgPct" | "threePct" | "ftPct"; label: string }[] = [
  { key: "fgPct", label: "FG%" },
  { key: "threePct", label: "3P%" },
  { key: "ftPct", label: "FT%" },
];

const TAIL_COLUMNS: { key: "tovPg" | "pfPg"; label: string }[] = [
  { key: "tovPg", label: "TOV" },
  { key: "pfPg", label: "PF" },
];

export function TeamRosterStatsTable({ rows }: { rows: TeamStatsRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">ロスターデータがありません。</p>;
  }

  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full min-w-[900px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line">
            <th className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted">
              選手名
            </th>
            <th className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted">
              チーム
            </th>
            <th className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted">
              POS
            </th>
            <th className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted">
              G
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted"
              >
                {col.label}
              </th>
            ))}
            {PCT_COLUMNS.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted"
              >
                {col.label}
              </th>
            ))}
            {TAIL_COLUMNS.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
              <td className="whitespace-nowrap px-2 py-3 font-semibold">
                <Link href={`/players/${row.id}`} className="hover:text-blue">
                  {row.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-2 py-3 text-muted">{row.teamAbbr}</td>
              <td className="whitespace-nowrap px-2 py-3">{row.position ?? "—"}</td>
              <td className="whitespace-nowrap px-2 py-3">{row.gamesPlayed ?? "—"}</td>
              {COLUMNS.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-2 py-3">
                  {row.stats ? formatStat(row.stats[col.key]) : "—"}
                </td>
              ))}
              {PCT_COLUMNS.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-2 py-3">
                  {row.stats ? formatPct(row.stats[col.key]) : "—"}
                </td>
              ))}
              {TAIL_COLUMNS.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-2 py-3">
                  {row.stats ? formatStat(row.stats[col.key]) : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
