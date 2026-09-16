import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getLatestSeason } from "@/lib/supabase/current-season";
import { fetchPublishedArticles } from "@/lib/news/public-articles";
import { PageShell } from "@/components/page-shell";

const MARQUEE_ABBREVIATIONS = ["GSW", "LAL", "BOS", "OKC"];

const STATS_PICKS = [
  { label: "得点ランキング", sort: "ppg" },
  { label: "3Pランキング", sort: "threePct" },
  { label: "TS%", sort: "tsPct" },
  { label: "アシスト", sort: "apg" },
];

export default async function Home() {
  const supabase = createServerSupabaseClient();

  const [{ count: playerCount }, { data: teams }, latestSeason, articles] =
    await Promise.all([
      supabase.from("players").select("*", { count: "exact", head: true }),
      supabase.from("teams").select("*").order("name"),
      getLatestSeason(supabase),
      fetchPublishedArticles(createAdminSupabaseClient()),
    ]);

  const marqueeTeams = MARQUEE_ABBREVIATIONS.map((abbr) =>
    (teams ?? []).find((t) => t.abbreviation === abbr)
  ).filter((t): t is NonNullable<typeof t> => Boolean(t));

  const featured = articles[0] ?? null;

  return (
    <PageShell>
      <div className="grid grid-cols-1 gap-4.5 gap-y-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="relative min-h-[280px] overflow-hidden bg-navy p-6 text-white sm:p-8">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-[#84b0ff]">
            {latestSeason ?? "2026"} Season Database
          </p>
          <h1 className="max-w-[500px] text-[28px] font-semibold leading-tight tracking-tight sm:text-[36px]">
            勝敗の裏側にある、フロントオフィスの意思決定を読む。
          </h1>
          <p className="mt-3 max-w-[510px] text-sm leading-7 text-slate-300">
            契約、トレード、ロスター構築を、ニュースだけで終わらせない。NBAをGMの視点から深掘りするデータベース。
          </p>
          <Link
            href="/stats"
            className="mt-5 inline-block bg-gold px-4 py-3 text-sm font-extrabold text-[#182238]"
          >
            Stats Lab を試す →
          </Link>
          <div className="mt-6 border-l-4 border-gold pl-4">
            <p className="text-xs text-slate-400">DATA UPDATE</p>
            <b className="mt-1.5 block text-lg">
              {latestSeason ?? "最新"}シーズンのロスターと基本スタッツを収録
            </b>
            <p className="mt-1.5 text-[13px] text-[#b9c6d8]">
              {playerCount ?? "-"}選手のロスター、得点、リバウンド、アシスト、シュート指標を検索できます。
            </p>
          </div>
        </div>

        <div className="border border-line bg-surface p-6">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
            Featured Analysis
          </p>
          <h2 className="mb-4 text-xl font-semibold">今日の分析</h2>
          {featured ? (
            <>
              <h3 className="text-base font-bold">
                <Link href={`/news/${featured.id}`} className="hover:underline">
                  {featured.headlineJa}
                </Link>
              </h3>
              {featured.dekJa && (
                <p className="mt-1.5 text-xs leading-6 text-muted">{featured.dekJa}</p>
              )}
              <Link href="/news" className="mt-3 inline-block text-sm font-extrabold text-blue">
                News一覧を見る →
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">まだ公開されている記事がありません。</p>
              <Link href="/teams" className="mt-3 inline-block text-sm font-extrabold text-blue">
                チームDBを見る →
              </Link>
            </>
          )}
          <div className="mt-6 border-t border-line pt-4">
            <span className="mr-1.5 inline-block bg-[#eaf1ff] px-1.5 py-1 text-[11px] font-extrabold text-[#2457b7]">
              DATA
            </span>
            <h3 className="mt-2 text-base font-bold">
              {latestSeason ?? "最新"}シーズンの基本スタッツを更新
            </h3>
            <p className="mt-1.5 text-xs text-muted">Player database · 最新</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4.5 lg:grid-cols-[1.55fr_1fr]">
        <div className="border border-line bg-surface p-6">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
            Team Database
          </p>
          <h2 className="mb-4 text-xl font-semibold">注目チーム</h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {marqueeTeams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="border-l-[3px] border-blue bg-[#f3f6fb] p-3.5 text-sm font-extrabold dark:bg-white/[.04]"
              >
                {team.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="border border-line bg-surface p-6">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
            Stats Lab
          </p>
          <h2 className="mb-4 text-xl font-semibold">人気検索</h2>
          <div className="flex flex-wrap gap-2">
            {STATS_PICKS.map((pick) => (
              <Link
                key={pick.sort}
                href={`/stats?sort=${pick.sort}`}
                className="border border-line bg-surface px-3 py-2 text-[13px] font-bold"
              >
                {pick.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
