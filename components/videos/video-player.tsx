"use client";

import { useState } from "react";
import { MediaEmbed } from "@/components/news/related-media";
import type { YouTubeMedia } from "@/lib/videos";

// 動画まとめページのカードの再生部分。最初はサムネイルだけを出し(一覧に埋め込みを並べると重いため)、
// 押したときに選手ページと同じ埋め込み部品(youtube-nocookie・「YouTubeで見る」リンク付き)に切り替える。
export function VideoPlayer({ media, title, thumbnail }: { media: YouTubeMedia; title: string; thumbnail: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) return <MediaEmbed media={media} />;
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`「${title}」を再生する`}
      className="group relative block aspect-video w-full overflow-hidden bg-black"
    >
      {/* YouTube のサムネイル画像(外部の画像なので next/image の最適化は使わない) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition-opacity group-hover:opacity-85" />
      <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/70 transition-transform group-hover:scale-110">
          <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
