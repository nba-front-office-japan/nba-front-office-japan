import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { PageShell } from "@/components/page-shell";
import {
  PlayerTeamDirectory,
  type TeamListItem,
} from "@/components/player-team-directory";

export default async function PlayersPage() {
  const supabase = createServerSupabaseClient();

  const { data: teams, error } = await fetchAllRows((from, to) =>
    supabase.from("teams").select("*").order("name").range(from, to)
  );

  if (error) {
    return (
      <PageShell>
        <h1 className="mb-6 text-2xl font-semibold">2026 選手名鑑</h1>
        <p className="text-sm text-red-600 dark:text-red-400">
          チームデータの取得に失敗しました: {error.message}
        </p>
      </PageShell>
    );
  }

  const teamList: TeamListItem[] = teams.map((team) => ({
    id: team.id,
    name: team.name,
    abbreviation: team.abbreviation,
    conference: team.conference,
    division: team.division,
  }));

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Player Database · 2026-27 Season
      </p>
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">
        2026 選手名鑑
      </h1>
      <p className="mb-7 text-sm text-muted">
        30チーム・6ディビジョン別の一覧です。チーム名から選手名鑑Profileへ進めます。
      </p>
      <PlayerTeamDirectory teams={teamList} />
    </PageShell>
  );
}
