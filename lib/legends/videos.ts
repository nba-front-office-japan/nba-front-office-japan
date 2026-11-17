// レジェンド(/legends/[slug] が本体の選手)の動画。選手ページの videos と同じく1本1行で書く(形は lib/videos.ts の VideoEntry)。
// 登録した選手の Profile に「動画・コラム」の欄を出し、動画まとめページ(/videos)にも自動で並ぶ。キーは /legends/ の slug。
import type { VideoColumn, VideoInput } from "@/lib/videos";

export const LEGEND_VIDEOS: Record<string, { videos: VideoInput[]; columns?: VideoColumn[] }> = {
  "michael-jordan": {
    videos: [
      // タイトルは公開後に YouTube の表示と照合する(登録時点では非公開で確認できなかった)
      { url: "https://www.youtube.com/shorts/IUrnSlKwA9w", title: "Failure", date: "2026-11-17" },
      { url: "https://www.youtube.com/watch?v=Xc6055uBwaA", title: "「Jam」撮影の舞台裏", date: "2026-11-17" },
    ],
  },
};
