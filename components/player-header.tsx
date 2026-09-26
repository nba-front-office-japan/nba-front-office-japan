import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
import { formatDraftInfo } from "@/lib/draft-format";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

function formatDraft(player: Player): string {
  return formatDraftInfo(player, "-") ?? "-";
}

export function PlayerHeader({
  player,
  currentTeam,
  currentTeamPending,
}: {
  player: Player;
  currentTeam: Team | null;
  currentTeamPending: boolean;
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
