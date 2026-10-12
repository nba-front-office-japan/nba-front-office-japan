import type { RelatedMedia } from "@/lib/news/related-media";
import { XWidgetsLoader } from "./x-widgets-loader";

// ニュース記事の本文の後に表示する関連メディア(Xポスト・YouTube動画)。
// 表示するのは lib/news/related-media.ts で検証済みの URL だけで、HTML は保存・描画しない。
// ・Xポスト: まず通常のリンク(blockquote)を表示し、X公式の widgets.js が読み込めたときだけ埋め込みに置き換わる。
//   削除・非公開・読み込み失敗のときは、置き換わらずリンクのまま残る
// ・YouTube: プライバシー強化モード(youtube-nocookie.com)で埋め込み、自動再生しない。
//   埋め込み不可・年齢制限・削除済みは埋め込み側から判別できないため、下に通常のリンクを常に表示する
// 関連メディアがない記事では何も表示せず、X・YouTube のどちらも読み込まない。

function XPost({ media }: { media: Extract<RelatedMedia, { kind: "x" }> }) {
  return (
    // 埋め込み後は widgets.js が blockquote を .twitter-tweet-rendered(最大幅550px)に置き換えるため、中央に寄せる
    <div className="min-w-0 [&_.twitter-tweet-rendered]:mx-auto">
      <blockquote
        className="twitter-tweet mx-auto w-full max-w-[550px] border border-line bg-surface p-4"
        data-dnt="true"
        data-lang="ja"
        data-conversation="none"
      >
        <p className="mb-2 text-xs font-bold text-muted">Xのポスト（@{media.user}）</p>
        <a
          href={media.url}
          target="_blank"
          rel="noreferrer noopener"
          className="break-all text-sm font-bold text-blue underline underline-offset-4 hover:no-underline"
        >
          Xでポストを見る →
        </a>
      </blockquote>
    </div>
  );
}

function YouTubeVideo({ media }: { media: Extract<RelatedMedia, { kind: "youtube" }> }) {
  return (
    <div className="min-w-0">
      <div className={media.shorts ? "mx-auto w-full max-w-[315px]" : "w-full"}>
        <div className={`relative w-full overflow-hidden bg-black ${media.shorts ? "aspect-[9/16]" : "aspect-video"}`}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${media.videoId}?rel=0`}
            title={media.shorts ? "YouTube Shorts の動画" : "YouTube の動画"}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
      <p className={`mt-2 text-xs text-muted ${media.shorts ? "text-center" : ""}`}>
        再生できない場合は
        <a href={media.url} target="_blank" rel="noreferrer noopener" className="mx-1 font-bold text-blue underline underline-offset-4 hover:no-underline">
          YouTubeで見る →
        </a>
      </p>
    </div>
  );
}

export function RelatedMediaSection({ media }: { media: RelatedMedia[] }) {
  if (media.length === 0) return null;
  return (
    <section aria-labelledby="related-media-heading" className="mb-6 min-w-0 border-t border-line pt-5">
      <h2 id="related-media-heading" className="mb-3 text-sm font-bold text-muted">
        関連メディア
      </h2>
      <div className="space-y-6">
        {media.map((m) => (m.kind === "x" ? <XPost key={m.url} media={m} /> : <YouTubeVideo key={m.url} media={m} />))}
      </div>
      {media.some((m) => m.kind === "x") && <XWidgetsLoader />}
    </section>
  );
}
