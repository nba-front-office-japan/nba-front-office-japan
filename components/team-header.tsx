import type { Database } from "@/lib/supabase/types";
import { formatStat } from "@/lib/stats";

type Team = Database["public"]["Tables"]["teams"]["Row"];

export function TeamHeader({
  team,
  playerCount,
  teamPpg,
  team3pPct,
  seasonLabel = "2025-26",
}: {
  team: Team;
  playerCount: number;
  teamPpg: number | null;
  team3pPct: number | null;
  seasonLabel?: string;
}) {
  return (
    // チームカラー背景(.team-theme)の上に載るため、文字・罫線は配色トークン(白系)で指定する
    <div className="py-2 text-foreground sm:py-3">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-muted">
        Team Record · {seasonLabel} Season
      </p>
      <h1 className="text-[28px] font-semibold tracking-tight sm:text-[36px]">
        {team.name}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {team.abbreviation} ・ {team.conference} / {team.division}
      </p>
      <div className="mt-6 flex gap-7">
        <div className="border-l border-line pl-3.5">
          <b className="block text-[22px] font-bold">{playerCount}</b>
          <span className="text-[11px] text-muted">PLAYERS</span>
        </div>
        <div className="border-l border-line pl-3.5">
          <b className="block text-[22px] font-bold">{formatStat(teamPpg)}</b>
          <span className="text-[11px] text-muted">TEAM PPG</span>
        </div>
        <div className="border-l border-line pl-3.5">
          <b className="block text-[22px] font-bold">
            {team3pPct === null ? "-" : `${team3pPct.toFixed(1)}%`}
          </b>
          <span className="text-[11px] text-muted">TEAM 3P%</span>
        </div>
      </div>
    </div>
  );
}
