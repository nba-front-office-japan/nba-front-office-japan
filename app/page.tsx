import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getLatestSeason } from "@/lib/supabase/current-season";
import { fetchPublishedArticles } from "@/lib/news/public-articles";
import { PageShell } from "@/components/page-shell";

const MARQUEE_ABBREVIATIONS = ["GSW", "LAL", "BOS", "OKC"];

// ホームの見出し・ボタンの文言。現在は選手スタッツとニュースの掲載なので「Lab」「分析」は使わない。
// 比較・絞り込み・独自指標などの分析機能を追加したら、ここを
// 「Stats Lab を試す →」「Stats Lab」「Featured Analysis」「今日の分析」などに差し替える。
const HOME_COPY = {
  statsCta: "選手スタッツを見る →",
  statsKicker: "Player Stats",
  featuredKicker: "Featured News",
  featuredTitle: "注目ニュース",
};

const STATS_PICKS = [
  { label: "得点ランキング", sort: "ppg" },
  { label: "3Pランキング", sort: "threePct" },
  // TS%は試投数の少ない選手が上位に来やすいため、20試合以上に絞る
  { label: "TS%", sort: "tsPct", minGames: 20 },
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
            {HOME_COPY.statsCta}
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
            {HOME_COPY.featuredKicker}
          </p>
          <h2 className="mb-4 text-xl font-semibold">{HOME_COPY.featuredTitle}</h2>
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

      {/* 試合センターへの入口。ネタバレ防止のため、ホームには試合の勝敗・点数・チーム名を一切表示しない */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-line bg-surface px-6 py-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Games</p>
          <p className="text-sm text-muted">試合結果は、ネタバレ防止のため試合センターでだけ表示します。</p>
        </div>
        <Link href="/games" className="bg-navy px-4 py-2.5 text-sm font-extrabold text-white">
          試合センターへ →
        </Link>
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
            {HOME_COPY.statsKicker}
          </p>
          <h2 className="mb-4 text-xl font-semibold">人気検索</h2>
          <div className="flex flex-wrap gap-2">
            {STATS_PICKS.map((pick) => (
              <Link
                key={pick.sort}
                href={`/stats?sort=${pick.sort}${"minGames" in pick ? `&minGames=${pick.minGames}` : ""}`}
                className="border border-line bg-surface px-3 py-2 text-[13px] font-bold"
              >
                {pick.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* GUIDE「はじめに」への短い導入。文は元の文書「はじめに」から抜粋し、全文はGUIDEに載せる */}
      <section className="mt-5 border-l-4 border-gold bg-surface p-6 sm:p-8">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Introduction</p>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-balance [word-break:auto-phrase] sm:text-2xl">
          NBAは、試合だけ見ていては半分しか分からない。
        </h2>
        <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted sm:text-[15px] sm:leading-8">
          <p>世界約4.5億人以上がプレーするバスケットボール。その最高峰、NBAの標準契約枠はわずか約450人。</p>
          <p>
            しかしNBAの本当の面白さは、コートの中だけではありません。なぜ大富豪のオーナーでも、好きなだけスター選手を集められないのか。なぜドラフト1巡目指名権一つが、スター選手とのトレードを左右するのか。
          </p>
          <p>サラリーキャップ。MAX契約。ドラフト。トレード。オーナー。放映権。そして戦力均衡。</p>
          <p>NBA Front Office Japanでは、「誰が勝ったか」だけではなく、「なぜ、そうなったのか」まで掘り下げます。</p>
        </div>
        <Link href="/guide/introduction" className="mt-5 inline-block bg-navy px-4 py-3 text-sm font-extrabold text-white">
          GUIDEで読む →
        </Link>
      </section>
    </PageShell>
  );
}
