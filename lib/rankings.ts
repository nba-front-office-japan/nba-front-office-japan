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
  {
    slug: "owner-net-worth",
    title: "NBAオーナー資産ランキング",
    description: "各チームの代表オーナー1名の推定純資産を比較",
    badge: "推定値",
  },
  {
    slug: "arena-prices",
    title: "アリーナ別 価格比較",
    description: "全30チームのホームアリーナで、チケットと飲食の価格を比較。最安席や家族4人の観戦費用がわかります。",
    badge: "目安",
  },
  {
    slug: "ejections",
    // 狭い画面では「（」の前と「・」の後ろでだけ折り返す(カードと Index のリンクは word-break: keep-all)。
    // 「1997-98」はハイフンの前後にワードジョイナー(U+2060)を入れて途中で折り返さない
    title: "NBA 退場回数ランキング​（1997⁠-⁠98以降・​ESPN集計）",
    description: "1997-98シーズン以降のESPN集計で、通算の退場回数（レギュラーシーズン＋プレーオフ）が多い選手を、通算と現役の2つのタブで紹介。",
    badge: "通算",
  },
];

export function rankingHref(slug: string): string {
  return `/rankings/${slug}`;
}
