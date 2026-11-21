import Link from "next/link";
import { MediaEmbed } from "@/components/news/related-media";
import { playerVideoMedia, type VideoColumn, type VideoInput } from "@/lib/videos";
import { WATCH_READ_PATH, type PlayerWorkLink } from "@/lib/watch-read";

// 選手ページ(人気選手の解説)とレジェンドのページに出す「動画・コラム」の欄。動画もコラムも無い選手には出さない。
// 動画はニュースの関連メディアと同じ埋め込み部品(YouTube はプライバシー強化モード・自動再生なし)で出し、
// 下に動画まとめページ(/videos)への入口を付ける。
// works は「観る・読むNBA」(lib/watch-read.ts)でその選手が出演・関連する作品。コラムと同じ形で並べ、作品ページの該当箇所へリンクする。
export function PlayerMediaSection({
  videos,
  columns = [],
  works = [],
  className = "mt-8",
}: {
  videos: VideoInput[] | undefined;
  columns?: VideoColumn[];
  works?: PlayerWorkLink[];
  className?: string;
}) {
  const media = playerVideoMedia(videos);
  if (media.length === 0 && columns.length === 0 && works.length === 0) return null;
  return (
    <section aria-labelledby="featured-media" className={`${className} border border-line bg-surface p-5 sm:p-6`}>
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Video &amp; Column</p>
      <h2 id="featured-media" className="mb-4 text-lg font-semibold">
        動画・コラム
      </h2>
      {media.length > 0 && (
        <div className="space-y-6">
          {media.map((m) => (
            <MediaEmbed key={m.url} media={m} />
          ))}
        </div>
      )}
      {columns.length > 0 && (
        <ul className={`space-y-2 text-sm ${media.length > 0 ? "mt-6 border-t border-line pt-4" : ""}`}>
          {columns.map((c) => (
            <li key={c.href} className="border-l-[3px] border-blue pl-3">
              <span className="mr-2 text-xs font-bold text-muted">コラム</span>
              <Link href={c.href} className="font-semibold hover:text-blue hover:underline">
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {works.length > 0 && (
        <div className={media.length > 0 || columns.length > 0 ? "mt-6 border-t border-line pt-4" : ""}>
          <ul className="space-y-2 text-sm">
            {works.map((w) => (
              <li key={w.href} className="border-l-[3px] border-gold pl-3">
                <span className="mr-2 text-xs font-bold text-muted">{w.label}</span>
                <Link href={w.href} className="font-semibold hover:text-blue hover:underline">
                  {w.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <Link href={WATCH_READ_PATH} className="font-bold text-blue hover:underline">
              ほかの作品も見る(観る・読むNBA) →
            </Link>
          </p>
        </div>
      )}
      {media.length > 0 && (
        <p className="mt-6 border-t border-line pt-4 text-sm">
          <Link href="/videos" className="font-bold text-blue hover:underline">
            ほかの選手の動画も見る(動画一覧) →
          </Link>
        </p>
      )}
    </section>
  );
}
