import type { RelatedMedia } from "@/lib/news/related-media";
import { XWidgetsLoader } from "./x-widgets-loader";
import { InstagramEmbedLoader } from "./instagram-embed-loader";

// ニュース記事の本文の後に表示する関連メディア(Xポスト・YouTube動画・Instagram投稿/リール・TikTok動画)。
// どれも各サービス公式の公開埋め込みだけを使い、画像・動画をサイト側に保存しない。
// 表示するのは lib/news/related-media.ts で検証済みの URL だけで、HTML は保存・描画しない。
// ・Xポスト: まず通常のリンク(blockquote)を表示し、X公式の widgets.js が読み込めたときだけ埋め込みに置き換わる。
//   削除・非公開・読み込み失敗のときは、置き換わらずリンクのまま残る
// ・YouTube: プライバシー強化モード(youtube-nocookie.com)で埋め込み、自動再生しない。
//   埋め込み不可・年齢制限・削除済みは埋め込み側から判別できないため、下に通常のリンクを常に表示する
// ・Instagram: 公式の embed.js で埋め込む(読み込めない場合は blockquote のリンクのまま)。
//   削除済み・非公開は埋め込み側から判別できないため、下に通常のリンクを常に表示する
// ・TikTok: 公式の埋め込みプレーヤー(www.tiktok.com/player/v1)で埋め込み、自動再生しない。下に通常のリンクを常に表示する
// 関連メディアがない記事では何も表示せず、どのサービスも読み込まない。

/** 埋め込みの下に常に表示する、元の投稿へのリンク(削除・非公開・読み込み失敗のとき用) */
function FallbackLink({ href, label, center = false }: { href: string; label: string; center?: boolean }) {
  return (
    <p className={`mt-2 text-xs text-muted ${center ? "text-center" : ""}`}>
      表示されない場合は
      <a href={href} target="_blank" rel="noreferrer noopener" className="mx-1 font-bold text-blue underline underline-offset-4 hover:no-underline">
        {label} →
      </a>
    </p>
  );
}

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

function InstagramPost({ media }: { media: Extract<RelatedMedia, { kind: "instagram" }> }) {
  return (
    // embed.js が作る iframe は最小幅が 326px で、読み込み中・読み込めない投稿は position: absolute になるため、
    // この枠を基準(relative)にして最大幅 540px・枠の幅に収める(スマホで本文の枠からはみ出さないように)
    <div className="relative min-w-0 overflow-hidden [&_iframe]:!mx-auto [&_iframe]:!w-full [&_iframe]:!min-w-0 [&_iframe]:!max-w-[540px]">
      <blockquote
        className="instagram-media mx-auto w-full max-w-[540px] border border-line bg-surface p-4"
        data-instgrm-permalink={media.url}
        data-instgrm-version="14"
      >
        <p className="mb-2 text-xs font-bold text-muted">{media.postType === "reel" ? "Instagramのリール" : "Instagramの投稿"}</p>
        <a href={media.url} target="_blank" rel="noreferrer noopener" className="break-all text-sm font-bold text-blue underline underline-offset-4 hover:no-underline">
          Instagramで見る →
        </a>
      </blockquote>
      <FallbackLink href={media.url} label="Instagramで見る" center />
    </div>
  );
}

function TikTokVideo({ media }: { media: Extract<RelatedMedia, { kind: "tiktok" }> }) {
  return (
    <div className="min-w-0">
      <div className="mx-auto w-full max-w-[325px]">
        <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
          <iframe
            src={`https://www.tiktok.com/player/v1/${media.videoId}?autoplay=0&rel=0&music_info=1&description=1`}
            title={`TikTokの動画（@${media.user}）`}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
      <FallbackLink href={media.url} label="TikTokで見る" center />
    </div>
  );
}

/** メディア1件の埋め込み(本文中のメディアと本文末の関連メディアで共通) */
export function MediaEmbed({ media }: { media: RelatedMedia }) {
  if (media.kind === "x") return <XPost media={media} />;
  if (media.kind === "youtube") return <YouTubeVideo media={media} />;
  if (media.kind === "instagram") return <InstagramPost media={media} />;
  return <TikTokVideo media={media} />;
}

/** 公式スクリプトが必要なメディア(X・Instagram)の読み込み。表示中の URL が変わったときは変換し直す */
export function MediaScriptLoaders({ media }: { media: RelatedMedia[] }) {
  const x = media.filter((m) => m.kind === "x").map((m) => m.url).join(" ");
  const ig = media.filter((m) => m.kind === "instagram").map((m) => m.url).join(" ");
  return (
    <>
      {x && <XWidgetsLoader watch={x} />}
      {ig && <InstagramEmbedLoader watch={ig} />}
    </>
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
        {media.map((m) => (
          <MediaEmbed key={m.url} media={m} />
        ))}
      </div>
      <MediaScriptLoaders media={media} />
    </section>
  );
}
