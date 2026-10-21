import type { Database } from "@/lib/supabase/types";
import { formatStat } from "@/lib/stats";

type Team = Database["public"]["Tables"]["teams"]["Row"];

export interface TeamHeaderMetric {
  label: string;
  value: string;
}

// metrics を渡さない場合は、成績から計算した PLAYERS / TEAM PPG / TEAM 3P% を出す
export function TeamHeader({
  team,
  playerCount = 0,
  teamPpg = null,
  team3pPct = null,
  seasonLabel,
  kicker = "Team Record",
  metrics,
}: {
  team: Team;
  playerCount?: number;
  teamPpg?: number | null;
  team3pPct?: number | null;
  seasonLabel: string;
  kicker?: string;
  metrics?: TeamHeaderMetric[];
}) {
  const shown: TeamHeaderMetric[] = metrics ?? [
    { label: "PLAYERS", value: String(playerCount) },
    { label: "TEAM PPG", value: formatStat(teamPpg) },
    { label: "TEAM 3P%", value: team3pPct === null ? "-" : `${team3pPct.toFixed(1)}%` },
  ];
  return (
    // チームカラー背景(.team-theme)の上に載るため、文字・罫線は配色トークン(白系)で指定する
    <div className="py-2 text-foreground sm:py-3">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-muted">
        {kicker} · {seasonLabel} Season
      </p>
      <h1 className="text-[28px] font-semibold tracking-tight sm:text-[36px]">
        {team.name}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {team.abbreviation} ・ {team.conference} / {team.division}
      </p>
      <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
        {shown.map((m) => (
          <div key={m.label} className="border-l border-line pl-3.5">
            <b className="block text-[22px] font-bold">{m.value}</b>
            <span className="text-[11px] text-muted">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
