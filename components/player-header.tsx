import Link from "next/link";
import type { Database } from "@/lib/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

function formatDraft(player: Player): string {
  if (!player.draft_year) return "-";
  const round = player.draft_round ?? "-";
  const pick = player.draft_pick ?? "-";
  return `${player.draft_year}年 ${round}巡目 ${pick}位`;
}

export function PlayerHeader({
  player,
  currentTeam,
}: {
  player: Player;
  currentTeam: Team | null;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold">{player.full_name}</h1>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        {player.position ?? "-"}
        {currentTeam ? (
          <>
            {" ・ "}
            <Link
              href={`/teams/${currentTeam.id}`}
              className="text-accent underline"
            >
              {currentTeam.name}
            </Link>
          </>
        ) : (
          " ・ 所属チームなし"
        )}
      </p>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">身長</dt>
          <dd>{player.height_cm ? `${player.height_cm} cm` : "-"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">体重</dt>
          <dd>{player.weight_kg ? `${player.weight_kg} kg` : "-"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">生年月日</dt>
          <dd>{player.birth_date ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">国籍</dt>
          <dd>{player.nationality ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">ドラフト</dt>
          <dd>{formatDraft(player)}</dd>
        </div>
      </dl>
    </div>
  );
}
