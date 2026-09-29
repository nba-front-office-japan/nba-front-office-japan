// Team Profile(基本情報・ホームアリーナ・フロント・コーチ陣・確認情報)の表示に必要なデータをまとめて取得する。
// 選手名鑑 2026 の Team Profile タブ(/players/guide/[teamId]?view=team-profile)で使う。
// team_profiles / team_arenas が行なしの場合は null を返し、TeamProfileView 側で「情報準備中」と表示する。
import type { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TeamValuationSummary } from "@/components/team-profile-view";
import { fetchLatestValuationEdition } from "@/lib/valuations";

type ServerClient = ReturnType<typeof createServerSupabaseClient>;

export async function fetchTeamProfileData(supabase: ServerClient, teamId: string) {
  const [{ data: profile }, { data: staff }, { data: arena }, { data: valuationEdition }] =
    await Promise.all([
      supabase.from("team_profiles").select("*").eq("team_id", teamId).maybeSingle(),
      supabase.from("team_staff_members").select("*").eq("team_id", teamId).order("display_order"),
      supabase.from("team_arenas").select("*").eq("team_id", teamId).maybeSingle(),
      // 資産価値(推計値)は公開日が最も新しい年版だけを出す
      fetchLatestValuationEdition(supabase),
    ]);

  let valuation: TeamValuationSummary | null = null;
  if (valuationEdition) {
    const [{ data: row }, { count }] = await Promise.all([
      supabase
        .from("team_valuations")
        .select("*")
        .eq("edition_id", valuationEdition.id)
        .eq("team_id", teamId)
        .maybeSingle(),
      supabase
        .from("team_valuations")
        .select("id", { count: "exact", head: true })
        .eq("edition_id", valuationEdition.id),
    ]);
    valuation = { edition: valuationEdition, row: row ?? null, teamCount: count ?? null };
  }

  return {
    profile: profile ?? null,
    staff: staff ?? [],
    arena: arena ?? null,
    valuation,
  };
}
