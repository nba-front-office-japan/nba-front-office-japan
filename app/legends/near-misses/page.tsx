import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { LegendsTabs } from "@/components/legends/legends-tabs";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchFeaturedPlayerLinks } from "@/lib/featured-player-links";
import { FEATURED_PLAYERS_RETIRED } from "@/lib/featured-players-retired";
import { leagueTitleSummary, leagueTitlesFor } from "@/lib/legends/titles";

// 「惜しくも75選外」: NBA75周年記念チーム(76人の一覧)には入っていない引退した名選手。
// 載せるのは解説を公開した選手(lib/featured-players-retired.ts)だけで、選手ページ(/players/{id})へ案内する。
// 選手ページのIDはDBから引くので、レジェンド一覧と同じくリクエストごとに表示する
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "惜しくも75選外の名選手｜NBA75周年記念チームに入らなかった殿堂入り選手など | NBA Front Office Japan",
  description:
    "NBA75周年記念チーム(76人)には選ばれなかったものの、殿堂入りや得点王などで歴史に名を残した引退選手を、経歴・プレースタイル・通算成績つきで紹介します。",
  alternates: { canonical: "/legends/near-misses" },
};

export default async function NearMissesPage() {
  const links = await fetchFeaturedPlayerLinks(createServerSupabaseClient());
  const players = FEATURED_PLAYERS_RETIRED.flatMap((fp) => {
    const link = links.find((l) => l.featured === fp);
    return link ? [{ id: link.id, fp }] : [];
  });

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-[#a87a1e]">Legends</p>
      <h1 className="mb-2 text-[28px] font-semibold leading-tight tracking-tight sm:text-[36px]">惜しくも75選外</h1>
      <p className="mb-6 max-w-3xl text-[15px] leading-7">
        2021年の<strong>NBA75周年記念チーム（75th Anniversary Team）</strong>
        には選ばれなかったものの、殿堂入りやタイトル獲得で歴史に名を残した引退選手たち。経歴・プレースタイル・通算成績（レギュラーシーズン・プレーオフ）を各選手のページで紹介しています。
      </p>

      <LegendsTabs current="near" />

      <p className="mb-3 text-xs text-muted">{players.length}人を掲載（順次追加します）</p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {players.map(({ id, fp }) => {
          const titles = leagueTitlesFor(fp.brefId);
          return (
            <li key={fp.name}>
              <Link
                href={`/players/${id}`}
                className="selection-card flex h-full flex-col border border-line border-t-2 border-t-gold bg-surface p-4"
              >
                {fp.titleSuffix && (
                  <span className="self-start border border-gold px-1.5 text-[10px] font-extrabold tracking-wide text-[#a87a1e]">
                    {fp.titleSuffix}
                  </span>
                )}
                <span className="mt-2 text-[15px] font-bold">{fp.nameJa}</span>
                <span className="mt-0.5 text-[11px] font-bold tracking-wide text-muted">{fp.name}</span>
                {fp.retired && <span className="mt-2 text-[13px] text-muted">{fp.retired}</span>}
                {titles.length > 0 && <span className="mt-1 text-[13px] font-bold">{leagueTitleSummary(titles)}</span>}
                <span className="mt-2 text-[13px] leading-6">{fp.catchphrase}</span>
                <span className="mt-auto pt-3 text-xs font-bold text-[#a87a1e]">選手ページを見る ›</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-xs text-muted">
        ・75周年記念チームの76人は
        <Link href="/legends" className="mx-1 font-semibold text-blue underline-offset-2 hover:underline">
          レジェンド一覧
        </Link>
        で紹介しています。
      </p>
    </PageShell>
  );
}
