// NBAガイドの詳細ページで共通に使う、公式資料にもとづく数値と出典。
// 数値は NBA 公式発表(2026年6月30日)の値だけを使う。発表文の数値をそのまま転記し、推測で補わない。
// 解説文は CBA と NBA作成の「CBA 101」をもとにした独自の要約で、条文の転載・全文翻訳ではない。

export interface SystemLevel {
  key: "minimum" | "cap" | "tax" | "apron1" | "apron2";
  label: string;
  note: string;
  usd: string;
  ja: string;
}

// 2026-27シーズンの基準額(NBA Communications, 2026年6月30日公開)
export const SYSTEM_LEVELS_2026_27: SystemLevel[] = [
  {
    key: "minimum",
    label: "最低総年俸（Minimum Team Salary）",
    note: "チームが最低限払わなければならない年俸総額",
    usd: "$148.465M",
    ja: "1億4,846万5,000ドル",
  },
  {
    key: "cap",
    label: "サラリーキャップ（Salary Cap）",
    note: "キャップスペースの計算に使う基準額",
    usd: "$164.961M",
    ja: "1億6,496万1,000ドル",
  },
  {
    key: "tax",
    label: "タックスライン（Tax Level）",
    note: "超えるとラグジュアリータックスの対象",
    usd: "$200.428M",
    ja: "2億42万8,000ドル",
  },
  {
    key: "apron1",
    label: "1st Apron（First Apron Level）",
    note: "超えると一部の補強手段が使えない",
    usd: "$209.015M",
    ja: "2億901万5,000ドル",
  },
  {
    key: "apron2",
    label: "2nd Apron（Second Apron Level）",
    note: "さらに厳しい制限とドラフト指名権のペナルティ",
    usd: "$221.686M",
    ja: "2億2,168万6,000ドル",
  },
];

export const SYSTEM_LEVELS_SOURCE_NOTE =
  "出典：NBA Communications「NBA sets Salary Cap for 2026-27 season at $164.961 million」（2026年6月30日公開）。" +
  "2026年7月1日 午前0時1分（米東部時間）から適用。$1M＝100万ドル。当サイトでの確認日：2026年10月2日。";

export interface OfficialSource {
  title: string;
  publisher: string;
  date: string;
  href: string;
  note: string;
}

export const OFFICIAL_SOURCES: OfficialSource[] = [
  {
    title: "NBA sets Salary Cap for 2026-27 season at $164.961 million",
    publisher: "NBA Communications（pr.nba.com）",
    date: "2026年6月30日公開",
    href: "https://pr.nba.com/2026-27-salary-cap/",
    note: "このページの2026-27シーズンの数値の出典",
  },
  {
    title: "NBA sets salary cap for 2026-27 season at $164.961 million",
    publisher: "NBA.com",
    date: "2026年6月30日公開",
    href: "https://www.nba.com/news/nba-salary-cap-2026-27-season",
    note: "同じ発表のNBA.com掲載記事",
  },
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "NBAとNBPA（選手会）の労使協定の原文",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "NBAによる労使協定の要点まとめ。このページの仕組みの解説の根拠",
  },
];

// 作成済みの詳細ガイド。未作成のページへはリンクしないため、ここに無い項目はリンクにしない。
export const GUIDE_PAGES: Record<string, string> = {
  // GUIDEの導入ページ(「はじめに」)
  NBAを試合結果だけで終わらせない: "/guide/introduction",
  サラリーキャップ: "/guide/salary-cap",
  ラグジュアリータックス: "/guide/luxury-tax",
  "1st Apron / 2nd Apron": "/guide/aprons",
  "Revenue Sharing": "/guide/revenue-sharing",
  MAX契約: "/guide/max-contract",
  ミニマム契約: "/guide/minimum-contract",
  "Bird Rights": "/guide/bird-rights",
  // 「契約」の「RFA / UFA」と、「NBA用語」の「RFA」「UFA」は同じ詳細ページへリンクする
  "RFA / UFA": "/guide/rfa-ufa",
  RFA: "/guide/rfa-ufa",
  UFA: "/guide/rfa-ufa",
  // 「契約」と「NBA用語」の「MLE」は同じ詳細ページへリンクする
  MLE: "/guide/mle",
  // 「契約」の「ロスター契約・短期契約」と、「NBA用語」の「2-way」は同じ詳細ページへリンクする
  "ロスター契約・短期契約": "/guide/roster-contracts",
  "2-way": "/guide/roster-contracts",
  トレードの基本: "/guide/trade-basics",
  サラリーマッチング: "/guide/salary-matching",
  Buyout: "/guide/buyout",
  Waive: "/guide/waive",
  放映権: "/guide/media-rights",
  NBAオーナー: "/guide/owners",
  チーム資産価値: "/guide/team-value",
  "ジョー・スミス事件": "/guide/joe-smith-case",
  タンパリング: "/guide/tampering-cases",
  サラリーキャップ迂回に関する処分: "/guide/salary-cap-circumvention",
  // 「NBA用語」の「NBA用語集」は用語集ページへリンクする
  NBA用語集: "/guide/glossary",
  ドラフト指名権: "/guide/draft-picks",
  ロッタリー: "/guide/draft-lottery",
  指名権の価値: "/guide/draft-pick-value",
};
