import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { fetchPublishedArticles } from "@/lib/news/public-articles";
import { salaryTeams } from "@/lib/salary/data";
import { teamSlug } from "@/lib/salary/types";
import { fetchFinishedGamesForSitemap } from "@/lib/games/data";

// 新しいニュース記事を1時間以内にsitemapへ反映する
export const revalidate = 3600;

// 公開ページの一覧。新しい固定ページを追加したらここにも足す。
const STATIC_PATHS = [
  "", "/news", "/players", "/players/featured", "/teams", "/stats", "/games", "/awards", "/draft",
  "/history",
  "/salary", "/salary/players", "/salary/teams",
  "/rankings", "/rankings/owner-net-worth", "/rankings/team-valuations",
  "/premium",
  "/guide", "/guide/introduction", "/guide/glossary", "/guide/salary-cap",
  "/guide/luxury-tax", "/guide/aprons", "/guide/salary-matching",
  "/guide/salary-cap-circumvention", "/guide/bird-rights", "/guide/mle",
  "/guide/max-contract", "/guide/minimum-contract", "/guide/rfa-ufa",
  "/guide/contract-terms", "/guide/roster-contracts", "/guide/trade-basics",
  "/guide/buyout", "/guide/waive", "/guide/draft-picks", "/guide/draft-pick-value",
  "/guide/draft-lottery", "/guide/tampering-cases", "/guide/joe-smith-case",
  "/guide/media-rights", "/guide/revenue-sharing", "/guide/owners", "/guide/team-value",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
  for (const t of salaryTeams()) {
    entries.push({ url: `${SITE_URL}/salary/teams/${teamSlug(t.abbr)}` });
  }
  // DBの取得に失敗しても固定ページだけのsitemapは返す
  try {
    const { data: teams } = await createServerSupabaseClient().from("teams").select("id");
    for (const team of teams ?? []) {
      entries.push({ url: `${SITE_URL}/teams/${team.id}` });
    }
  } catch {}
  // 選手ページ(現役の選手。is_active = true)。1000件ずつ全件を取る
  try {
    const supabase = createServerSupabaseClient();
    const { data: players, error } = await fetchAllRows<{ id: string }>((from, to) =>
      supabase.from("players").select("id").eq("is_active", true).order("id").range(from, to)
    );
    if (!error) {
      for (const player of players) {
        entries.push({ url: `${SITE_URL}/players/${player.id}` });
      }
    }
  } catch {}
  // 終了した試合の詳細ページ(ボックススコア)。毎日の試合データの自動取り込みで増えた試合も、ここで自動的に追加される
  try {
    const games = await fetchFinishedGamesForSitemap(createServerSupabaseClient());
    for (const game of games) {
      entries.push({ url: `${SITE_URL}/games/${game.id}`, lastModified: game.tipoffAt ?? undefined });
    }
  } catch {}
  try {
    const articles = await fetchPublishedArticles(createAdminSupabaseClient());
    for (const article of articles) {
      entries.push({
        url: `${SITE_URL}/news/${article.id}`,
        lastModified: article.publishedAt ?? undefined,
      });
    }
  } catch {}
  return entries;
}
