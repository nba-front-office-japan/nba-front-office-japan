import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { TeamDirectory } from "@/components/team-directory";
import { SeasonSelect } from "@/components/season-select";
import { ROSTER_SEASON, parseSeasonParam, seasonLabel, seasonOptionLinks } from "@/lib/seasons";

// Teams 一覧。?season= でシーズンを切り替える(初期表示は 2026-27。?season=2025 で 2025-26)。
export const metadata: Metadata = {
  title: "NBA全30チーム一覧 | NBA Front Office Japan",
  description: "NBA全30チームの一覧。各チームのロスター・成績・チーム情報を日本語で確認できます。",
  alternates: { canonical: "/teams" },
};

export default async function TeamsPage({ searchParams }: PageProps<"/teams">) {
  const { season: seasonParam } = await searchParams;
  const season = parseSeasonParam(seasonParam);
  const label = seasonLabel(season);

  const supabase = createServerSupabaseClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .order("name");

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Team Database · {label} Season
      </p>
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">チーム一覧</h1>
      <p className="mb-5 text-sm text-muted">
        {season === ROSTER_SEASON
          ? `チーム名から${label}のチームページ（${label}ロスター）へ、その下のリンクから Profile・Stats・Team Profile へ直接進めます。`
          : `チーム名から${label}チーム記録へ、その下のリンクから Profile・Stats・Team Profile へ直接進めます。`}
      </p>
      <SeasonSelect season={season} options={seasonOptionLinks("/teams")} />
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          チームデータの取得に失敗しました: {error.message}
        </p>
      ) : (
        <div className="border border-line bg-surface p-6">
          <TeamDirectory teams={teams ?? []} season={season} />
        </div>
      )}
    </PageShell>
  );
}
