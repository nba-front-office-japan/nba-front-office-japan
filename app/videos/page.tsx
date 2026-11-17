import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { VideoPlayer } from "@/components/videos/video-player";
import { fetchFeaturedPlayerLinks } from "@/lib/featured-player-links";
import { allSiteVideos, formatVideoDate, videoThumbnail, type SiteVideo } from "@/lib/videos";

// 選手ページのIDはDBから引くので、人気選手ガイドと同じくリクエストごとに表示する
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "動画一覧｜NBA Front Office Japan 公式YouTube",
  description:
    "NBA Front Office Japan 公式YouTubeの動画を新しい順にまとめています。名シーンの裏側や選手の解説を、ShortsとLong(長尺)で。選手ページ・関連コラムへのリンク付き。",
  alternates: { canonical: "/videos" },
};

// 動画まとめページ。選手ページ(lib/featured-players*.ts の videos)とレジェンド(lib/legends/videos.ts)に
// 1本1行で登録した動画を自動で集め(lib/videos.ts)、新しい順に並べる。?type=shorts|long で絞り込む。
type Filter = "all" | "shorts" | "long";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "shorts", label: "Shorts" },
  { key: "long", label: "長尺" },
];
const parseFilter = (v: string | string[] | undefined): Filter => (v === "shorts" || v === "long" ? v : "all");

function playerHref(v: SiteVideo, featuredIds: Map<string, string>): string | null {
  if (v.player.kind === "legend") return `/legends/${v.player.slug}`;
  const id = featuredIds.get(v.player.featured.name);
  return id ? `/players/${id}` : null;
}

export default async function VideosPage({ searchParams }: PageProps<"/videos">) {
  const { type } = await searchParams;
  const filter = parseFilter(type);
  const all = allSiteVideos();
  const videos = all.filter((v) => (filter === "shorts" ? v.media.shorts : filter === "long" ? !v.media.shorts : true));
  const links = await fetchFeaturedPlayerLinks(createServerSupabaseClient()).catch(() => []);
  const featuredIds = new Map(links.map((l) => [l.featured.name, l.id]));

  return (
    <PageShell>
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Videos</p>
      <h1 className="text-[32px] font-semibold tracking-tight sm:text-[36px]">動画一覧</h1>
      <p className="mb-6 mt-2 max-w-3xl text-sm leading-7 text-muted">
        NBA Front Office Japan 公式YouTubeの動画を新しい順にまとめています。動画はこのページで再生でき、選手ページや関連コラムにも移れます。
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/videos" : `/videos?type=${f.key}`}
            aria-current={filter === f.key ? "page" : undefined}
            className={`selection-button selection-blue rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 ${
              filter === f.key ? "bg-blue text-white" : "border border-line text-muted hover:text-foreground"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {videos.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-muted">この種類の動画はまだありません。</p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => {
            const href = playerHref(v, featuredIds);
            return (
              <li key={v.media.url} id={`video-${v.media.videoId}`} className="flex min-w-0 flex-col border border-line bg-surface">
                <VideoPlayer media={v.media} title={v.title} thumbnail={videoThumbnail(v.media)} />
                <div className="flex flex-1 flex-col p-4">
                  <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold">
                    <span className={`border px-1.5 ${v.media.shorts ? "border-gold text-gold" : "border-blue text-blue"}`}>
                      {v.media.shorts ? "Shorts" : "長尺"}
                    </span>
                    {v.lang === "en" && <span className="border border-line px-1.5 text-muted">English</span>}
                    <time dateTime={v.date} className="ml-1 font-semibold tabular-nums text-muted">
                      {formatVideoDate(v.date)}
                    </time>
                  </p>
                  <h2 className="mt-2 text-[15px] font-bold leading-6" lang={v.lang === "en" ? "en" : undefined}>
                    {v.title}
                  </h2>
                  <div className="mt-auto space-y-1 pt-3 text-sm">
                    {href && (
                      <p>
                        <span className="mr-2 text-xs font-bold text-muted">選手</span>
                        <Link href={href} className="font-semibold text-blue hover:underline">
                          {v.player.nameJa}
                        </Link>
                      </p>
                    )}
                    {v.columns.map((c) => (
                      <p key={c.href}>
                        <span className="mr-2 text-xs font-bold text-muted">コラム</span>
                        <Link href={c.href} className="font-semibold hover:text-blue hover:underline">
                          {c.title}
                        </Link>
                      </p>
                    ))}
                    <p>
                      <a href={v.media.url} target="_blank" rel="noreferrer noopener" className="text-xs font-bold text-blue underline underline-offset-4 hover:no-underline">
                        YouTubeで見る →
                      </a>
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
