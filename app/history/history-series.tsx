import Link from "next/link";

type HistoryStory = { number: string; title: string; period?: string; description?: string; href?: string };

// 新しい回を公開するときは、href(必要なら period と description も)を足すとリンクになる
const HISTORY_STORIES: HistoryStory[] = [
  { number: "01", period: "1950s — 1960s", title: "NBAはなぜルールを変え始めたのか", description: "24秒、制限区域、チェンバレン対策まで。", href: "/history" },
  { number: "02", period: "1979 — 2020s", title: "3ポイントはNBAをどう変えたのか", description: "誰も使わなかった一本の線が、競技そのものを変えるまで。", href: "/history/three-point" },
  { number: "03", title: "現代NBAはどう作られたのか" },
];

function StoryCardBody({ story, status }: { story: HistoryStory; status: string }) {
  return (
    <>
      <span className="history-series__number" aria-hidden>{story.number}</span>
      <span className="history-series__copy">
        {story.period && <span className="history-series__period">{story.period}</span>}
        <span className="history-series__title">{story.title}</span>
        {story.description && <span className="history-series__description">{story.description}</span>}
        <span className="history-series__status">{status}</span>
      </span>
    </>
  );
}

// 記事の上部から好きな回を直接選ぶための導線。記事を読み終えた人を送る NEXT STORY とは役割が別
export function HistorySeries({ current }: { current: string }) {
  return (
    <nav className="history-series" aria-labelledby="history-series-heading">
      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-10 sm:py-9">
        <div className="history-series__head"><h2 id="history-series-heading">HISTORY SERIES</h2><p>NBAを変えたルールと戦術の歴史</p></div>
        <ol className="history-series__list">
          {HISTORY_STORIES.map((story) => (
            <li key={story.number}>
              {!story.href ? (
                <div className="history-series__card history-series__card--upcoming"><StoryCardBody story={story} status="COMING NEXT" /></div>
              ) : story.href === current ? (
                <div aria-current="page" className="history-series__card history-series__card--current"><StoryCardBody story={story} status="CURRENT STORY" /></div>
              ) : (
                <Link href={story.href} className="history-series__card"><StoryCardBody story={story} status="READ STORY →" /></Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
