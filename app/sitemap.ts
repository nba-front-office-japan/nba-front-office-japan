import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchPublishedArticles } from "@/lib/news/public-articles";
import { salaryTeams } from "@/lib/salary/data";
import { teamSlug } from "@/lib/salary/types";

// 新しいニュース記事を1時間以内にsitemapへ反映する
export const revalidate = 3600;

// 公開ページの一覧。新しい固定ページを追加したらここにも足す。
const STATIC_PATHS = [
  "", "/news", "/players", "/teams", "/stats", "/games", "/awards", "/draft",
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
