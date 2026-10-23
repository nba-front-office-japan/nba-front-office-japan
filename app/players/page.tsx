import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { PageShell } from "@/components/page-shell";
import { ROSTER_SEASON, STATS_SEASON, seasonLabel } from "@/lib/seasons";
import Link from "next/link";
import { ALL_FEATURED_PLAYERS, featuredPlayerFor } from "@/lib/featured-players";
import {
  PlayerTeamDirectory,
  type TeamListItem,
} from "@/components/player-team-directory";

const ROSTER_LABEL = seasonLabel(ROSTER_SEASON);
const STATS_LABEL = seasonLabel(STATS_SEASON);

// 選手名鑑の一覧。対象は 2026-27 開幕時点の固定ロスターだけ(25-26 の選手名鑑は作らない)。
// 以前の ?season= 付きの URL は、シーズン指定なしの URL へ移す。
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

  // 人気選手(lib/featured-players.ts)へのリンク。DBの英語名はアクセント記号の有無が揺れるので、両方の表記で探す
  const featuredNames = ALL_FEATURED_PLAYERS.flatMap((p) =>
    [p.name, ...(p.aliases ?? [])].flatMap((n) => [n, n.normalize("NFD").replace(/[\u0300-\u036f]/g, "")]),
  );
  const { data: featuredRows } = await supabase
    .from("players")
    .select("id, full_name, is_active")
    .in("full_name", [...new Set(featuredNames)]);
  const featuredLinks = ALL_FEATURED_PLAYERS.flatMap((fp) => {
    const rows = (featuredRows ?? []).filter((r) => featuredPlayerFor(r.full_name) === fp);
    const row = rows.find((r) => r.is_active) ?? rows[0];
    return row ? [{ id: row.id, nameJa: fp.nameJa }] : [];
  });

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
        Player Database · {ROSTER_LABEL} Season
      </p>
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">
        選手名鑑 {ROSTER_LABEL}
      </h1>
      <p className="mb-7 text-sm text-muted">
        {ROSTER_LABEL}開幕時点のロスター（固定）と、各選手の{STATS_LABEL}最終成績です。シーズン途中の移籍・解雇は反映しません（現在のロスター・今季の成績は Teams）。チーム名から選手名鑑のProfileへ、その下のリンクからStats・Team Profileへ進めます。
      </p>
      {featuredLinks.length > 0 && (
        <section aria-labelledby="featured-players" className="mb-8 border border-line bg-surface p-5">
          <h2 id="featured-players" className="mb-3 text-base font-semibold">
            人気選手のプロフィール
          </h2>
          <ul className="flex flex-wrap gap-2">
            {featuredLinks.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/players/${p.id}`}
                  className="inline-block border border-line px-3 py-1.5 text-sm font-bold hover:text-blue"
                >
                  {p.nameJa}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <PlayerTeamDirectory teams={teamList} />
    </PageShell>
  );
}
