import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { PageShell } from "@/components/page-shell";
import { SeasonSelect } from "@/components/season-select";
import { parseSeasonParam, seasonLabel, seasonOptionLinks } from "@/lib/seasons";
import {
  PlayerTeamDirectory,
  type TeamListItem,
} from "@/components/player-team-directory";

// 選手名鑑の一覧。?season= でシーズンを切り替える(初期表示は 2026-27。?season=2025 で 2025-26)。
export default async function PlayersPage({ searchParams }: PageProps<"/players">) {
  const { season: seasonParam } = await searchParams;
  const season = parseSeasonParam(seasonParam);
  const label = seasonLabel(season);

  const supabase = createServerSupabaseClient();

  const { data: teams, error } = await fetchAllRows((from, to) =>
    supabase.from("teams").select("*").order("name").range(from, to)
  );

  if (error) {
    return (
      <PageShell>
        <h1 className="mb-6 text-2xl font-semibold">選手名鑑 {label}</h1>
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
        Player Database · {label} Season
      </p>
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">
        選手名鑑 {label}
      </h1>
      <p className="mb-5 text-sm text-muted">
        30チーム・6ディビジョン別の一覧です。チーム名から選手名鑑のProfileへ、その下のリンクからStats・Team Profileへ進めます。
      </p>
      <SeasonSelect season={season} options={seasonOptionLinks("/players")} />
      <PlayerTeamDirectory teams={teamList} season={season} />
    </PageShell>
  );
}
