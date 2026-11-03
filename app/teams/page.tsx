import Link from "next/link";
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BriefSheet, BriefSide } from "@/components/brief-sheet";
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
      <BriefSheet
        file="02"
        mark={["TEAM", "DIRECTORY"]}
        edition={`${label} SEASON`}
        report="30 FRANCHISE FILES"
        kicker={`Team Database · ${label} Season`}
        title="チーム一覧"
        lead={
          season === ROSTER_SEASON
            ? `チーム名から${label}のチームページ（${label}ロスター）へ、その下のリンクから Profile・Stats・Team Profile へ直接進めます。`
            : `チーム名から${label}チーム記録へ、その下のリンクから Profile・Stats・Team Profile へ直接進めます。`
        }
        side={
          <>
            <BriefSide label="Season file">
              <SeasonSelect season={season} options={seasonOptionLinks("/teams")} />
            </BriefSide>
            <BriefSide label="Related files">
              <p>
                <Link href="/players/featured" className="inline-flex min-h-7 items-center font-bold text-blue hover:underline">
                  人気選手ガイド ›
                </Link>
              </p>
            </BriefSide>
          </>
        }
      >
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            チームデータの取得に失敗しました: {error.message}
          </p>
        ) : (
          <div className="border border-line bg-surface p-4 sm:p-6">
            <TeamDirectory teams={teams ?? []} season={season} />
          </div>
        )}
      </BriefSheet>
    </PageShell>
  );
}
