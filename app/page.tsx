import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getLatestSeason } from "@/lib/supabase/current-season";
import { fetchPublishedArticles } from "@/lib/news/public-articles";
import { SiteHeader } from "@/components/site-header";
import { HomeStage } from "@/components/home-stage";
import { announcementExcerpt, fetchPublishedAnnouncements, formatAnnouncementDate } from "@/lib/announcements";

// トップページに出すお知らせの件数(公開中のものを新しい順に)
const HOME_ANNOUNCEMENT_LIMIT = 3;

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
  // TS%は試投数の少ない選手が上位に来やすいが、今季の一覧は規定試合数に達した選手だけが初期表示のため絞り込みは付けない
  { label: "TS%", sort: "tsPct" },
  { label: "アシスト", sort: "apg" },
];

export const metadata: Metadata = {
  title: "NBA Front Office Japan｜NBAの試合結果・スタッツ・年俸・移籍ニュース",
  description:
    "NBAの試合結果・ボックススコア、選手スタッツ、年俸、トレード・移籍ニュースを日本語で。勝敗の裏側にあるフロントオフィスの意思決定を読むNBAファンサイトです。",
  alternates: { canonical: "/" },
};

// トップページ。NBAの歴史ページ(/history)と同じ、暗いグレー・金・明朝系の見出しでまとめる(app/globals.css の .home-cinema)。
// 上部は開場演出の映像を中央の横長ステージとして見せ、その上にコピーを薄く重ねる(components/home-stage.tsx)。
export default async function Home() {
  const supabase = createServerSupabaseClient();

  const [{ count: playerCount }, latestSeason, articles, announcements] =
    await Promise.all([
      supabase.from("players").select("*", { count: "exact", head: true }),
      getLatestSeason(supabase),
      fetchPublishedArticles(createAdminSupabaseClient()),
      fetchPublishedAnnouncements(supabase, HOME_ANNOUNCEMENT_LIMIT),
    ]);

  const featured = articles[0] ?? null;

  return (
    <div className="home-cinema flex min-h-screen w-full flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-6 sm:px-7 sm:pt-10">
        <HomeStage>
          <div className="max-w-2xl px-5 pb-16 pt-24 sm:px-10 sm:pb-12 lg:px-12 lg:pb-14">
            <p className="home-cinema__label">{latestSeason ?? "2026"} Season Database</p>
            <h1 className="home-cinema__serif mt-4 text-[clamp(1.9rem,4.4vw,3.6rem)] font-bold leading-[1.22] tracking-tight text-[#fff8eb]">
              勝敗の裏側にある、
              <br />
              フロントオフィスの意思決定を読む。
            </h1>
            <div className="mt-5 h-px w-20 bg-[#e1bb71]" />
            <p className="mt-5 max-w-xl text-[14px] leading-7 text-[#f5efe1]/90 sm:text-[15px] sm:leading-8">
              契約、トレード、ロスター構築を、ニュースだけで終わらせない。NBAをGMの視点から深掘りするデータベース。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/stats" className="home-cinema__cta home-cinema__cta--gold">
                {HOME_COPY.statsCta}
              </Link>
              <Link href="/news" className="home-cinema__cta">
                NEWSを読む →
              </Link>
            </div>
            <p className="mt-5 text-[12px] leading-6 text-[#eee3d0]/80">
              DATA UPDATE ― {latestSeason ?? "最新"}シーズンのロスターと基本スタッツを収録（{playerCount ?? "-"}選手）
            </p>
          </div>
        </HomeStage>

        <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-2">
          <section aria-labelledby="home-featured" className="home-cinema__panel">
            <p className="home-cinema__label">{HOME_COPY.featuredKicker}</p>
            <h2 id="home-featured" className="home-cinema__serif mt-2 text-2xl font-bold text-[#fff8eb]">
              {HOME_COPY.featuredTitle}
            </h2>
            {featured ? (
              <>
                <h3 className="mt-4 text-[17px] font-bold leading-7">
                  <Link href={`/news/${featured.id}`} className="home-cinema__link">
                    {featured.headlineJa}
                  </Link>
                </h3>
                {featured.dekJa && <p className="mt-2 text-[13px] leading-7 text-[#eee3d0]/80">{featured.dekJa}</p>}
                <Link href="/news" className="home-cinema__more mt-4">
                  News一覧を見る →
                </Link>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm text-[#eee3d0]/80">まだ公開されている記事がありません。</p>
                <Link href="/teams" className="home-cinema__more mt-4">
                  チームDBを見る →
                </Link>
              </>
            )}
          </section>

          {/* お知らせ(管理画面で公開したものを新しい順に最大3件)。0件のときは「現在お知らせはありません」と表示する */}
          <section aria-labelledby="home-announcements" className="home-cinema__panel">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="home-cinema__label">Notice</p>
                <h2 id="home-announcements" className="home-cinema__serif mt-2 text-2xl font-bold text-[#fff8eb]">
                  お知らせ
                </h2>
              </div>
              {announcements.length > 0 && (
                <Link href="/announcements" className="home-cinema__more">
                  お知らせ一覧 →
                </Link>
              )}
            </div>
            {announcements.length === 0 ? (
              <p className="mt-4 text-sm text-[#eee3d0]/80">現在、お知らせはありません。</p>
            ) : (
              <ul className="mt-4 divide-y divide-[#e1bb71]/25">
                {announcements.map((a) => (
                  <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-xs tabular-nums text-[#e1bb71]">{formatAnnouncementDate(a.posted_on)}</p>
                    <h3 className="mt-0.5 break-words text-[15px] font-bold">
                      <Link href={`/announcements/${a.id}`} className="home-cinema__link">
                        {a.title}
                      </Link>
                    </h3>
                    <p className="mt-1 break-words text-xs leading-6 text-[#eee3d0]/75">{announcementExcerpt(a.body)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* 試合結果＆ボックススコア(/games)への入口。ネタバレ防止のため、ホームには試合の勝敗・点数・チーム名を一切表示しない */}
        <Link href="/games" className="home-cinema__strip mt-10">
          <div>
            <p className="home-cinema__label">Games</p>
            <p className="mt-1 text-sm text-[#eee3d0]/85">試合結果は、ネタバレ防止のため「試合結果＆ボックススコア」のページでだけ表示します。</p>
          </div>
          <span className="home-cinema__cta home-cinema__cta--gold">試合結果＆ボックススコアへ →</span>
        </Link>

        <section aria-labelledby="home-picks" className="home-cinema__panel mt-10">
          <p className="home-cinema__label">{HOME_COPY.statsKicker}</p>
          <h2 id="home-picks" className="home-cinema__serif mt-2 text-2xl font-bold text-[#fff8eb]">
            人気検索
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {STATS_PICKS.map((pick) => (
              <Link key={pick.sort} href={`/stats?sort=${pick.sort}`} className="home-cinema__chip">
                {pick.label}
              </Link>
            ))}
          </div>
        </section>

        {/* GUIDE「はじめに」への短い導入。文は元の文書「はじめに」から抜粋し、全文はGUIDEに載せる */}
        <section aria-labelledby="home-intro" className="home-cinema__intro mt-12">
          <p className="home-cinema__label">Introduction</p>
          <h2
            id="home-intro"
            className="home-cinema__serif mt-3 text-[clamp(1.5rem,3vw,2.4rem)] font-bold leading-snug tracking-tight text-[#fff8eb] text-balance [word-break:auto-phrase]"
          >
            NBAは、試合だけ見ていては半分しか分からない。
          </h2>
          <div className="home-cinema__prose mt-5 max-w-3xl space-y-3">
            <p>世界約4.5億人以上がプレーするバスケットボール。その最高峰、NBAの標準契約枠はわずか約450人。</p>
            <p>
              しかしNBAの本当の面白さは、コートの中だけではありません。なぜ大富豪のオーナーでも、好きなだけスター選手を集められないのか。なぜドラフト1巡目指名権一つが、スター選手とのトレードを左右するのか。
            </p>
            <p>サラリーキャップ。MAX契約。ドラフト。トレード。オーナー。放映権。そして戦力均衡。</p>
            <p>NBA Front Office Japanでは、「誰が勝ったか」だけではなく、「なぜ、そうなったのか」まで掘り下げます。</p>
          </div>
          <Link href="/guide/introduction" className="home-cinema__cta mt-6">
            GUIDEで読む →
          </Link>
        </section>
      </main>
    </div>
  );
}
