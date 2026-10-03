import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { GameDetailView } from "@/components/games/game-detail-view";

// タイトル・説明文にも試合結果やチーム名を含めない(リンクの共有や検索結果でネタバレしないため)
export const metadata: Metadata = {
  title: "試合詳細 | 試合センター | NBA Front Office Japan",
  description: "NBAの試合のスコアとボックススコア。ネタバレ防止のため、結果は操作したときだけ表示します。",
};

// このページのHTMLには試合結果を含めない。結果は GameDetailView がブラウザで取得して表示する。
export default async function GameDetailPage({ params }: PageProps<"/games/[gameId]">) {
  const { gameId } = await params;

  return (
    <PageShell>
      <nav aria-label="パンくずリスト" className="mb-4 text-xs text-muted">
        <Link href="/games" className="font-semibold text-blue hover:underline">
          試合センター
        </Link>
        <span aria-hidden className="mx-1.5">›</span>
        <span aria-current="page">試合詳細</span>
      </nav>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Box score</p>
      <h1 className="mb-5 text-[28px] font-semibold tracking-tight sm:text-[36px]">試合詳細</h1>

      <GameDetailView gameId={gameId} />

      <Link href="/games" className="mt-8 inline-block text-sm font-extrabold text-blue">
        ← 試合センターに戻る
      </Link>
    </PageShell>
  );
}
