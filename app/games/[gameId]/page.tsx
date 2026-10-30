import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { PageShell } from "@/components/page-shell";
import { GameDetailView } from "@/components/games/game-detail-view";
import { NewspaperMasthead } from "@/components/games/newspaper-masthead";
import { NEWSPAPER_FONT_CLASS } from "@/components/games/newspaper-fonts";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchGameDetail } from "@/lib/games/data";
import { formatJstDateLabel, formatJstDateLong, isValidDateString } from "@/lib/games/date";
import type { GameDetail, GameTeamLine } from "@/lib/games/types";
import { teamShortNameJa } from "@/lib/team-names-ja";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 試合の詳細。タイトル(generateMetadata)と本文で同じ取得結果を使う
const loadGameDetail = cache(async (gameId: string): Promise<GameDetail | null> => {
  if (!UUID_RE.test(gameId)) return null;
  try {
    const result = await fetchGameDetail(createServerSupabaseClient(), gameId);
    return result.status === "ok" ? result.detail : null;
  } catch {
    return null;
  }
});

function shortName(team: GameTeamLine): string {
  return teamShortNameJa(team.abbreviation, team.name);
}

/** 例: 10月29日 */
function monthDay(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}月${d}日`;
}

// タイトル・説明文には対戦カードと日付だけを入れ、得点・勝敗は入れない(検索結果やSNSの共有でネタバレしないため)
// 毎日の試合データの自動取り込み(/api/cron/games-sync)で増えた試合も、手作業なしでこのタイトルになる
export async function generateMetadata({ params }: PageProps<"/games/[gameId]">): Promise<Metadata> {
  const { gameId } = await params;
  const detail = await loadGameDetail(gameId);
  if (!detail) {
    return {
      title: "試合詳細・ボックススコア（ネタバレ防止） | NBA Front Office Japan",
      description: "NBAの試合のスコアとボックススコア（選手別スタッツ）。ネタバレ防止のため、結果は操作したときだけ表示します。",
    };
  }
  const { game } = detail;
  const away = shortName(game.away);
  const home = shortName(game.home);
  const date = game.jstDate;
  return {
    title: `${away} vs ${home} ボックススコア・試合結果${date ? `｜${monthDay(date)}（日本時間）` : ""}`,
    description: `${date ? `${formatJstDateLong(date)}（日本時間）の` : ""}${away}対${home}のボックススコア。両チーム全選手の得点・リバウンド・アシスト・出場時間を掲載。ネタバレ防止で、スコアはボタンを押すまで表示しません。`,
    alternates: { canonical: `/games/${gameId}` },
  };
}

// 画面ではボタンを押すまで結果を表示しない。検索エンジン向けにボックススコアをHTMLに含める(非表示・検索結果の説明文には使わせない)。
export default async function GameDetailPage({ params, searchParams }: PageProps<"/games/[gameId]">) {
  const { gameId } = await params;
  const { date: dateParam, view: viewParam } = await searchParams;
  const detail = await loadGameDetail(gameId);
  const date = typeof dateParam === "string" && isValidDateString(dateParam) ? dateParam : (detail?.game.jstDate ?? null);
  const individualView = viewParam === "individual";
  const backHref = date ? `/games?date=${date}${individualView ? "&view=individual" : ""}` : "/games";
  const backLabel = date ? `${formatJstDateLabel(date)}の試合一覧に戻る` : "試合結果＆ボックススコアに戻る";
  const matchup = detail ? `${shortName(detail.game.away)} vs ${shortName(detail.game.home)}` : null;

  // 対戦カードと日付だけの構造化データ(得点・勝敗は入れない)
  const jsonLd = detail
    ? {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: `${detail.game.away.nameJa ?? detail.game.away.name} vs ${detail.game.home.nameJa ?? detail.game.home.name}`,
        sport: "Basketball",
        ...(detail.game.tipoffAt ? { startDate: detail.game.tipoffAt } : detail.game.jstDate ? { startDate: detail.game.jstDate } : {}),
        awayTeam: { "@type": "SportsTeam", name: detail.game.away.nameJa ?? detail.game.away.name },
        homeTeam: { "@type": "SportsTeam", name: detail.game.home.nameJa ?? detail.game.home.name },
      }
    : null;

  return (
    <PageShell newspaper={NEWSPAPER_FONT_CLASS}>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <nav aria-label="パンくずリスト" className="mb-2 text-xs text-muted">
        <Link href={backHref} className="font-semibold text-blue hover:underline">
          試合結果＆ボックススコア
        </Link>
        <span aria-hidden className="mx-1.5">›</span>
        <span aria-current="page">{matchup ?? "試合詳細"}</span>
      </nav>
      <NewspaperMasthead
        kicker="The Box Score"
        title={matchup ?? "試合詳細"}
        edition="日本時間・ネタバレ防止版"
        dateline={<>NBA Front Office Japan{date ? `　｜　${formatJstDateLabel(date)}の試合` : ""}</>}
      />
      {detail && (
        <p className="np-serif mb-3 text-[13px] leading-6 text-muted">
          {date ? `${formatJstDateLong(date)}（日本時間）の` : ""}
          {detail.game.away.nameJa ?? detail.game.away.name}対{detail.game.home.nameJa ?? detail.game.home.name}
          のボックススコアです。両チーム全選手の得点・リバウンド・アシストを掲載しています。ネタバレ防止のため、スコアはボタンを押すまで表示しません。
        </p>
      )}

      <GameDetailView gameId={gameId} initialDetail={detail} />

      <Link href={backHref} className="mt-5 inline-block text-sm font-extrabold text-blue">
        ← {backLabel}
      </Link>
    </PageShell>
  );
}
