import type { Database } from "@/lib/supabase/types";
import { formatStat } from "@/lib/stats";

type Team = Database["public"]["Tables"]["teams"]["Row"];

export function TeamHeader({
  team,
  playerCount,
  teamPpg,
  team3pPct,
}: {
  team: Team;
  playerCount: number;
  teamPpg: number | null;
  team3pPct: number | null;
}) {
  return (
    <div className="-mx-4 bg-navy px-4 py-8 text-white sm:-mx-7 sm:px-7 sm:py-[29px]">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-[#84b0ff]">
        Team Database · 2026 Season
      </p>
      <h1 className="text-[28px] font-semibold tracking-tight sm:text-[36px]">
        {team.name}
      </h1>
      <p className="mt-1 text-sm text-slate-300">
        {team.abbreviation} ・ {team.conference} / {team.division}
      </p>
      <div className="mt-6 flex gap-7">
        <div className="border-l border-[#43536b] pl-3.5">
          <b className="block text-[22px] font-bold">{playerCount}</b>
          <span className="text-[11px] text-[#afbdd0]">PLAYERS</span>
        </div>
        <div className="border-l border-[#43536b] pl-3.5">
          <b className="block text-[22px] font-bold">{formatStat(teamPpg)}</b>
          <span className="text-[11px] text-[#afbdd0]">TEAM PPG</span>
        </div>
        <div className="border-l border-[#43536b] pl-3.5">
          <b className="block text-[22px] font-bold">
            {team3pPct === null ? "-" : `${team3pPct.toFixed(1)}%`}
          </b>
          <span className="text-[11px] text-[#afbdd0]">TEAM 3P%</span>
        </div>
      </div>
    </div>
  );
}
