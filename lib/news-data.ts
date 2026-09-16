// News機能のデザイン検証用サンプル記事。
// 実際の選手・球団の契約状況やトレード情報を報じるものではなく、
// 記事一覧・詳細ページのレイアウトを確認するためのダミーコンテンツ。
// 本格的な記事運用（CMS化・実データ投入）は別タスクとして扱う。

export interface NewsSection {
  heading: string;
  paragraphs: string[];
}

export interface NewsArticle {
  slug: string;
  tag: string;
  title: string;
  summary: string;
  source: string;
  updatedLabel: string;
  sections: NewsSection[];
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: "cap-sheet-101",
    tag: "ANALYSIS",
    title: "サラリーキャップシートの読み方 入門",
    summary:
      "契約金額の大小だけでなく、キャップヒットとラグジュアリータックスの関係を整理して読み解く。",
    source: "編集部",
    updatedLabel: "サンプル記事",
    sections: [
      {
        heading: "キャップヒットとは",
        paragraphs: [
          "契約総額ではなく、そのシーズンにチームのサラリーキャップへ計上される金額を指す。複数年契約は年度ごとに金額が異なることが多く、単年の年俸だけを見ても編成の実態はわからない。",
          "トレードの可否やウェイバー後の処理も、このキャップヒットを基準に判断されることが多い。",
        ],
      },
      {
        heading: "ラグジュアリータックスとセカンドエプロン",
        paragraphs: [
          "サラリー総額がキャップラインを超えると、超過分に応じた税（ラグジュアリータックス）が発生する。さらに一定水準（エプロン）を超えると、トレードの自由度や例外契約の利用に追加の制約がかかる。",
          "近年は「勝つための補強」と「制約を避ける編成」のバランスが各球団のフロントオフィスの腕の見せ所になっている。",
        ],
      },
      {
        heading: "編集部メモ",
        paragraphs: [
          "本記事はサイトのデザイン検証用のサンプルです。実際の球団・選手の契約状況を示すものではありません。",
        ],
      },
    ],
  },
  {
    slug: "trade-mechanics-basics",
    tag: "ANALYSIS",
    title: "トレードが成立する仕組みを整理する",
    summary:
      "「給与のマッチング」や「トレード例外（TPE）」など、トレードニュースの裏側にあるルールをまとめる。",
    source: "編集部",
    updatedLabel: "サンプル記事",
    sections: [
      {
        heading: "給与のマッチングルール",
        paragraphs: [
          "NBAのトレードでは、キャップに達しているチーム同士の場合、送り出す選手と受け取る選手の年俸を一定の範囲内に収める必要がある。これが「マッチング」と呼ばれる制約。",
        ],
      },
      {
        heading: "トレード例外（TPE）の使い道",
        paragraphs: [
          "トレードで選手を放出し、見返りに同等の選手を受け取らなかった場合、その差額分を一定期間内であれば別のトレードで使える「トレード例外」として保持できる。",
        ],
      },
      {
        heading: "編集部メモ",
        paragraphs: [
          "本記事はサイトのデザイン検証用のサンプルです。実際のトレード事例を報じるものではありません。",
        ],
      },
    ],
  },
  {
    slug: "draft-rights-explainer",
    tag: "EXPLAINER",
    title: "「ドラフト権保有」とはどういう状態か",
    summary:
      "指名はしたがすぐにチームに合流しない、いわゆる“保留（ストラッシュ）”状態の選手について解説する。",
    source: "編集部",
    updatedLabel: "サンプル記事",
    sections: [
      {
        heading: "指名後にすぐ加入しないケース",
        paragraphs: [
          "海外でプレーを続ける選手など、ドラフトで指名された後もすぐにNBAへ来ない選手がいる。その間、指名したチームは当該選手の権利を保有し続けることができる。",
        ],
      },
      {
        heading: "編成上の意味",
        paragraphs: [
          "権利を保有している選手は、将来コストの低い戦力として編成に組み込める一方、いつ合流するか不透明なため中長期プランの中でどう扱うかがフロントオフィスの判断材料になる。",
        ],
      },
      {
        heading: "編集部メモ",
        paragraphs: [
          "本記事はサイトのデザイン検証用のサンプルです。実在の選手の状況を示すものではありません。",
        ],
      },
    ],
  },
];

export function getNewsArticle(slug: string): NewsArticle | undefined {
  return NEWS_ARTICLES.find((a) => a.slug === slug);
}
