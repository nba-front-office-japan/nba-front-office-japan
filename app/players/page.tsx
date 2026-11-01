import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { BriefSheet, BriefSide } from "@/components/brief-sheet";
import { PageShell } from "@/components/page-shell";
import { ROSTER_SEASON, STATS_SEASON, seasonLabel } from "@/lib/seasons";
import Link from "next/link";
import {
  PlayerTeamDirectory,
  type TeamListItem,
} from "@/components/player-team-directory";

const ROSTER_LABEL = seasonLabel(ROSTER_SEASON);
const STATS_LABEL = seasonLabel(STATS_SEASON);

// 選手名鑑の一覧。対象は 2026-27 開幕時点の固定ロスターだけ(25-26 の選手名鑑は作らない)。
// 以前の ?season= 付きの URL は、シーズン指定なしの URL へ移す。
export const metadata: Metadata = {
  title: `NBA選手名鑑 ${ROSTER_LABEL} | NBA Front Office Japan`,
  description: `NBA全30チームの${ROSTER_LABEL}ロスター。全選手のポジション・身長・年齢・成績をチーム別に日本語でまとめています。`,
  alternates: { canonical: "/players" },
};

export default async function PlayersPage({ searchParams }: PageProps<"/players">) {
  const { season } = await searchParams;
  if (season !== undefined) redirect("/players");

  const supabase = createServerSupabaseClient();

  const { data: teams, error } = await fetchAllRows((from, to) =>
    supabase.from("teams").select("*").order("name").range(from, to)
  );

  if (error) {
    return (
      <PageShell>
        <h1 className="mb-6 text-2xl font-semibold">選手名鑑 {ROSTER_LABEL}</h1>
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
      <BriefSheet
        file="05"
        mark={["PLAYER", "GUIDE"]}
        edition={`${ROSTER_LABEL} SEASON`}
        report="OPENING NIGHT ROSTERS"
        kicker={`Player Database · ${ROSTER_LABEL} Season`}
        title={`選手名鑑 ${ROSTER_LABEL}`}
        lead="全30チームの開幕ロスター。チームを選ぶと、所属選手のプロフィールと成績を見られます。"
        side={
          <>
            <BriefSide label="Roster basis">
              <p>ロスター：{ROSTER_LABEL}開幕時点（途中の移籍は反映しません）</p>
              <p>成績：{STATS_LABEL}最終</p>
            </BriefSide>
            <BriefSide label="Related files">
              <p>
                <Link href="/players/featured" className="inline-flex min-h-7 items-center font-bold text-blue hover:underline">
                  人気選手ガイド ›
                </Link>
              </p>
              <p>
                <Link href="/teams" className="inline-flex min-h-7 items-center font-bold text-blue hover:underline">
                  今季のロスター・成績は Teams ›
                </Link>
              </p>
            </BriefSide>
          </>
        }
      >
        <PlayerTeamDirectory teams={teamList} />
      </BriefSheet>
    </PageShell>
  );
}
