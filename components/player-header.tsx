import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
import { formatStat } from "@/lib/stats";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

export interface PlayerSnapshot {
  ppg: number | null;
  rpg: number | null;
  apg: number | null;
  tsPct: number | null;
  threePct: number | null;
  mpg: number | null;
}

function formatDraft(player: Player): string {
  if (!player.draft_year) return "-";
  const round = player.draft_round ?? "-";
  const pick = player.draft_pick ?? "-";
  return `${player.draft_year}年 ${round}巡目 ${pick}位`;
}

export function PlayerHeader({
  player,
  currentTeam,
  snapshot,
}: {
  player: Player;
  currentTeam: Team | null;
  snapshot: PlayerSnapshot | null;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Player Database · 2026 Season
      </p>
      <h1 className="text-[32px] font-semibold tracking-tight sm:text-[36px]">
        {player.full_name}
      </h1>
      <p className="mb-6 text-sm text-muted">
        {currentTeam ? (
          <>
            <Link href={`/teams/${currentTeam.id}`} className="text-blue underline">
              {currentTeam.name}
            </Link>
            {" ・ "}
          </>
        ) : (
          "所属チームなし ・ "
        )}
        {player.position ?? "-"}
      </p>

      {snapshot && (
        <div className="mb-6 grid grid-cols-2 gap-px bg-line sm:grid-cols-3 md:grid-cols-6">
          {[
            ["PPG", formatStat(snapshot.ppg)],
            ["RPG", formatStat(snapshot.rpg)],
            ["APG", formatStat(snapshot.apg)],
            ["TS%", snapshot.tsPct === null ? "-" : `${snapshot.tsPct.toFixed(1)}%`],
            [
              "3P%",
              snapshot.threePct === null ? "-" : `${snapshot.threePct.toFixed(1)}%`,
            ],
            ["MPG", formatStat(snapshot.mpg)],
          ].map(([label, value]) => (
            <div key={label} className="bg-surface p-4">
              <span className="mb-1.5 block text-[11px] text-muted">{label}</span>
              <b className="text-[15px]">{value}</b>
            </div>
          ))}
        </div>
      )}

      <div className="border border-line bg-surface p-6">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
          Roster Profile
        </p>
        <h2 className="mb-4 text-lg font-semibold">Player Details</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">身長</dt>
            <dd className="font-semibold">
              {player.height_cm ? `${player.height_cm} cm` : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">体重</dt>
            <dd className="font-semibold">
              {player.weight_kg ? `${player.weight_kg} kg` : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">生年月日</dt>
            <dd className="font-semibold">{player.birth_date ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-muted">国籍</dt>
            <dd className="font-semibold">{player.nationality ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-muted">ドラフト</dt>
            <dd className="font-semibold">{formatDraft(player)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
