import Link from "next/link";
import { formatStat } from "@/lib/stats";

export interface RosterRow {
  id: string;
  fullName: string;
  position: string | null;
  age: number | null;
  ppg: number | null;
  rpg: number | null;
  apg: number | null;
}

export function TeamRoster({ rows }: { rows: RosterRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">在籍選手データがありません。</p>;
  }

  const sorted = [...rows].sort((a, b) => (b.ppg ?? -1) - (a.ppg ?? -1));

  return (
    <div>
      {sorted.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-[1.8fr_repeat(3,1fr)] items-center gap-2.5 border-t border-line py-3.5 text-[13px] first:border-t-0 sm:grid-cols-[1.8fr_repeat(4,1fr)]"
        >
          <div>
            <Link href={`/players/${row.id}`} className="block font-bold hover:text-blue">
              {row.fullName}
            </Link>
            <span className="text-[11px] text-muted">
              {row.position ?? "-"} ・ Age {row.age ?? "-"}
            </span>
          </div>
          <div>{formatStat(row.ppg)} PPG</div>
          <div>{formatStat(row.rpg)} RPG</div>
          <div className="hidden sm:block">{formatStat(row.apg)} APG</div>
        </div>
      ))}
    </div>
  );
}
