// 「ランキング」コーナー(/rankings)に掲載するランキングの一覧。
// トップページのカードはこの一覧から作る。ランキングを増やすときはここに1件追加し、
// app/rankings/<slug>/page.tsx を作る。

export interface RankingEntry {
  slug: string;
  title: string;
  description: string;
  // 「推計値」など、カードに出すラベル(無ければ undefined)
  badge?: string;
}

export const RANKINGS: RankingEntry[] = [
  {
    slug: "team-valuations",
    title: "チーム資産価値ランキング",
    description: "NBA全30チームの資産価値を順位で比較",
    badge: "推計値",
  },
];

export function rankingHref(slug: string): string {
  return `/rankings/${slug}`;
}
