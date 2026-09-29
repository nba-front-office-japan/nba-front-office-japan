// NBAオーナー資産ランキング(owner_net_worth_editions / team_owner_net_worths)の取得と表示用の整形。
// 値は Forbes 等による個人の推定純資産で、本人・チームの公式発表ではない。画面では必ず「推定値」と出典・基準日を併記する。
import type { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type OwnerNetWorthEdition = Database["public"]["Tables"]["owner_net_worth_editions"]["Row"];
export type TeamOwnerNetWorth = Database["public"]["Tables"]["team_owner_net_worths"]["Row"];
export type OwnerRole = TeamOwnerNetWorth["owner_role"];

type ServerClient = ReturnType<typeof createServerSupabaseClient>;

// 基準日が最も新しい年版を1件返す。無ければ null。
export function fetchLatestOwnerNetWorthEdition(supabase: ServerClient) {
  return supabase
    .from("owner_net_worth_editions")
    .select("*")
    .order("as_of_date", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export const OWNER_ROLE_LABEL: Record<OwnerRole, string> = {
  principal_owner: "筆頭オーナー",
  governor: "Governor",
  family: "一族",
  corporate: "法人",
};

// 画面の1行分。rank は推定値があり順位対象の行だけに付く(同額は同順位)。
export interface OwnerNetWorthRow {
  teamId: string;
  teamName: string;
  teamAbbr: string;
  ownerName: string;
  ownerRole: OwnerRole;
  isFamilyEstimate: boolean;
  netWorthUsd: number | null;
  profileUrl: string | null;
  exclusionReason: string | null;
  rank: number | null;
  // ranked: 順位あり / no_value: 推定値なし(順位対象だが出典に推定値が無い) / excluded: 順位対象外
  group: "ranked" | "no_value" | "excluded";
}

// 推定値の多い順に並べ、同額は同順位(1, 2, 2, 4 …)にする。推定値なし・順位対象外は順位を付けず後ろへ。
export function buildOwnerNetWorthRows(
  records: TeamOwnerNetWorth[],
  teams: { id: string; name: string; abbreviation: string }[]
): OwnerNetWorthRow[] {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const rows: OwnerNetWorthRow[] = records.flatMap((r) => {
    const team = teamById.get(r.team_id);
    if (!team) return [];
    const group: OwnerNetWorthRow["group"] = !r.is_rank_eligible
      ? "excluded"
      : r.net_worth_usd === null
        ? "no_value"
        : "ranked";
    return [
      {
        teamId: team.id,
        teamName: team.name,
        teamAbbr: team.abbreviation,
        ownerName: r.owner_name,
        ownerRole: r.owner_role,
        isFamilyEstimate: r.is_family_estimate,
        netWorthUsd: r.net_worth_usd,
        profileUrl: r.profile_url,
        exclusionReason: r.exclusion_reason,
        rank: null,
        group,
      },
    ];
  });

  const ranked = rows
    .filter((r) => r.group === "ranked")
    .sort((a, b) => (b.netWorthUsd ?? 0) - (a.netWorthUsd ?? 0) || a.teamName.localeCompare(b.teamName));
  ranked.forEach((row, i) => {
    const prev = ranked[i - 1];
    row.rank = prev && prev.netWorthUsd === row.netWorthUsd ? prev.rank : i + 1;
  });

  const byTeam = (a: OwnerNetWorthRow, b: OwnerNetWorthRow) => a.teamName.localeCompare(b.teamName);
  return [
    ...ranked,
    ...rows.filter((r) => r.group === "no_value").sort(byTeam),
    ...rows.filter((r) => r.group === "excluded").sort(byTeam),
  ];
}

// 中央値(偶数個なら中央2つの平均)
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Forbes と同じ表記(例: 158500000000 → 「$158.5B」)
export function formatUsdBillions(usd: number): string {
  return `$${(usd / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}B`;
}
