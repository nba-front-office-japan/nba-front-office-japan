import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
import { formatStat, formatPct } from "@/lib/stats";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

export interface PlayerSnapshot {
  gamesPlayed: number;
  mpg: number | null;
  ppg: number | null;
  orbPg: number | null;
  drbPg: number | null;
  rpg: number | null;
  apg: number | null;
  stlPg: number | null;
  blkPg: number | null;
  tovPg: number | null;
  pfPg: number | null;
  fgPct: number | null;
  threePct: number | null;
  ftPct: number | null;
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
  currentTeamPending,
  snapshot,
}: {
  player: Player;
  currentTeam: Team | null;
  currentTeamPending: boolean;
  snapshot: PlayerSnapshot | null;
}) {
  const displayName = player.full_name_ja ?? player.full_name;
  const showEnglishSubtitle = Boolean(player.full_name_ja);

  return (
    <div>
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Player Database
      </p>
      <h1 className="text-[32px] font-semibold tracking-tight sm:text-[36px]">
        {displayName}
      </h1>
      {showEnglishSubtitle && (
        <p className="mt-0.5 text-sm text-muted">{player.full_name}</p>
      )}
      <p className="mb-6 mt-1 text-sm text-muted">
        {currentTeamPending ? (
          "ロスター準備中（2026-27）"
        ) : currentTeam ? (
          <>
            <Link href={`/teams/${currentTeam.id}`} className="text-blue underline">
              {currentTeam.name}
            </Link>
            {" ・ 2026-27現在所属 ・ "}
          </>
        ) : (
          "所属チームなし（2026-27） ・ "
        )}
        {player.position ?? "-"}
      </p>

      <div className="mb-4">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
          2025-26 レギュラーシーズン成績
        </p>
        {snapshot ? (
          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 md:grid-cols-5">
            {[
              ["POS", player.position ?? "-"],
              ["G", String(snapshot.gamesPlayed)],
              ["MPG", formatStat(snapshot.mpg)],
              ["PTS/G", formatStat(snapshot.ppg)],
              ["ORB/G", formatStat(snapshot.orbPg)],
              ["DRB/G", formatStat(snapshot.drbPg)],
              ["TRB/G", formatStat(snapshot.rpg)],
              ["AST/G", formatStat(snapshot.apg)],
              ["STL/G", formatStat(snapshot.stlPg)],
              ["BLK/G", formatStat(snapshot.blkPg)],
              ["FG%", formatPct(snapshot.fgPct)],
              ["3P%", formatPct(snapshot.threePct)],
              ["FT%", formatPct(snapshot.ftPct)],
              ["TOV/G", formatStat(snapshot.tovPg)],
              ["PF/G", formatStat(snapshot.pfPg)],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface p-4">
                <span className="mb-1.5 block text-[11px] text-muted">{label}</span>
                <b className="text-[15px]">{value}</b>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-line bg-surface p-6 text-sm text-muted">
            2025-26レギュラーシーズンの成績データがありません。
          </div>
        )}
      </div>

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
