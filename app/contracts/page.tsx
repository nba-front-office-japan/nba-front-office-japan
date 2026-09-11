import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { SiteHeader } from "@/components/site-header";
import { ContractsTable, type ContractRow } from "@/components/contracts-table";

export default async function ContractsPage() {
  const supabase = createServerSupabaseClient();

  const { data: contracts, error } = await fetchAllRows((from, to) =>
    supabase.from("contracts").select("*").range(from, to)
  );

  if (error) {
    return (
      <div className="flex flex-1 flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
          <h1 className="mb-6 text-2xl font-semibold">Contracts</h1>
          <p className="text-sm text-red-600 dark:text-red-400">
            契約データの取得に失敗しました: {error.message}
          </p>
        </main>
      </div>
    );
  }

  const playerIds = [...new Set(contracts.map((c) => c.player_id))];
  const teamIds = [...new Set(contracts.map((c) => c.team_id))];

  const [{ data: players }, { data: teams }] = await Promise.all([
    playerIds.length > 0
      ? supabase.from("players").select("id, full_name").in("id", playerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    teamIds.length > 0
      ? supabase.from("teams").select("id, abbreviation").in("id", teamIds)
      : Promise.resolve({ data: [] as { id: string; abbreviation: string }[] }),
  ]);

  const playerNameById = new Map(
    (players ?? []).map((p) => [p.id, p.full_name])
  );
  const teamAbbrById = new Map(
    (teams ?? []).map((t) => [t.id, t.abbreviation])
  );

  const rows: ContractRow[] = contracts.map((c) => ({
    id: c.id,
    playerName: playerNameById.get(c.player_id) ?? "不明な選手",
    teamLabel: teamAbbrById.get(c.team_id) ?? "-",
    season: c.season,
    salary: c.salary,
    contractType: c.contract_type,
    isPlayerOption: c.is_player_option,
    isTeamOption: c.is_team_option,
    isGuaranteed: c.is_guaranteed,
  }));

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Contracts</h1>
        <ContractsTable rows={rows} />
      </main>
    </div>
  );
}
