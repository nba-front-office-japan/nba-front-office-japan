// 2025-26 NBA Awards の公式発表データ(NBA.com / NBA Communications の発表内容そのまま)。
// 所属チームは「受賞・選出時点」のもの。推測や未確認情報は含めない。
//
// 出典:
//  - 主要賞         : https://www.nba.com/news/2025-2026-regular-season-awards (2026-05-28更新)
//  - All-NBA        : https://www.nba.com/news/2025-26-all-nba-teams-announced (2026-05-27更新)
//  - All-Defensive  : https://www.nba.com/news/2025-26-all-defensive-teams-announced (2026-05-24更新)
//  - All-Rookie     : https://www.nba.com/news/2025-26-all-rookie-teams-announced (2026-05-21更新)
//  - 投票結果(各選手の所属チーム): https://pr.nba.com/voting-results-2025-26-nba-regular-season-awards/

export const AWARD_SOURCES = {
  major: {
    label: "2025-26 NBA Awards: Complete list of winners",
    url: "https://www.nba.com/news/2025-2026-regular-season-awards",
  },
  allNba: {
    label: "2025-26 Kia All-NBA Team",
    url: "https://www.nba.com/news/2025-26-all-nba-teams-announced",
  },
  allDefensive: {
    label: "2025-26 Kia NBA All-Defensive Team",
    url: "https://www.nba.com/news/2025-26-all-defensive-teams-announced",
  },
  allRookie: {
    label: "2025-26 Kia NBA All-Rookie Team",
    url: "https://www.nba.com/news/2025-26-all-rookie-teams-announced",
  },
  votingResults: {
    label: "Voting results: 2025-26 NBA regular-season awards",
    url: "https://pr.nba.com/voting-results-2025-26-nba-regular-season-awards/",
  },
} as const;

export type AwardPersonKind = "player" | "coach" | "executive";

export interface AwardWinner {
  // NBA公式表記の英語名
  name: string;
  // 受賞・選出時点の所属チーム(NBA公式表記)
  team: string;
  kind: AwardPersonKind;
  // DBのplayers.full_nameが公式表記と異なる場合だけ指定する(選手名鑑との照合用)
  dbName?: string;
}

export interface OfficialAward {
  key: string;
  ja: string;
  en: string;
  winners: AwardWinner[];
}

const player = (name: string, team: string, dbName?: string): AwardWinner => ({
  name,
  team,
  kind: "player",
  ...(dbName ? { dbName } : {}),
});

export const MAJOR_AWARDS: OfficialAward[] = [
  {
    key: "mvp",
    ja: "最優秀選手賞(MVP)",
    en: "Kia NBA Most Valuable Player",
    winners: [player("Shai Gilgeous-Alexander", "Oklahoma City Thunder")],
  },
  {
    key: "roy",
    ja: "新人王",
    en: "Kia NBA Rookie of the Year",
    winners: [player("Cooper Flagg", "Dallas Mavericks")],
  },
  {
    key: "dpoy",
    ja: "最優秀守備選手賞",
    en: "Kia NBA Defensive Player of the Year",
    winners: [player("Victor Wembanyama", "San Antonio Spurs")],
  },
  {
    key: "mip",
    ja: "最優秀成長選手賞",
    en: "Kia NBA Most Improved Player",
    winners: [player("Nickeil Alexander-Walker", "Atlanta Hawks")],
  },
  {
    key: "sixth-man",
    ja: "シックスマン賞",
    en: "Kia NBA Sixth Man of the Year",
    winners: [player("Keldon Johnson", "San Antonio Spurs")],
  },
  {
    key: "clutch",
    ja: "クラッチ・プレーヤー賞",
    en: "Kia NBA Clutch Player of the Year",
    winners: [player("Shai Gilgeous-Alexander", "Oklahoma City Thunder")],
  },
  {
    key: "hustle",
    ja: "ハッスル賞",
    en: "Kia NBA Hustle Award",
    winners: [player("Moussa Diabaté", "Charlotte Hornets")],
  },
  {
    key: "coach",
    ja: "最優秀コーチ賞",
    en: "NBA Coach of the Year",
    winners: [{ name: "Joe Mazzulla", team: "Boston Celtics", kind: "coach" }],
  },
  {
    key: "executive",
    ja: "最優秀エグゼクティブ賞",
    en: "NBA Basketball Executive of the Year",
    winners: [{ name: "Brad Stevens", team: "Boston Celtics", kind: "executive" }],
  },
  {
    key: "teammate",
    ja: "ティームメイト・オブ・ザ・イヤー",
    en: "NBA Twyman-Stokes Teammate of the Year",
    winners: [player("DeAndre Jordan", "New Orleans Pelicans")],
  },
  {
    key: "sportsmanship",
    ja: "スポーツマンシップ賞",
    en: "NBA Sportsmanship Award",
    winners: [player("Derrick White", "Boston Celtics")],
  },
  {
    key: "social-justice",
    ja: "ソーシャル・ジャスティス・チャンピオン賞",
    en: "NBA Social Justice Champion Award",
    winners: [player("Bam Adebayo", "Miami Heat")],
  },
];

// 選出者は公式の投票結果ページの掲載順(アルファベット順)。
export const TEAM_AWARDS: (OfficialAward & { source: keyof typeof AWARD_SOURCES })[] = [
  {
    key: "all-nba-1",
    ja: "オールNBA ファーストチーム",
    en: "Kia All-NBA First Team",
    source: "allNba",
    winners: [
      player("Cade Cunningham", "Detroit Pistons"),
      player("Luka Dončić", "Los Angeles Lakers"),
      player("Shai Gilgeous-Alexander", "Oklahoma City Thunder"),
      player("Nikola Jokić", "Denver Nuggets", "Nikola Jokic"),
      player("Victor Wembanyama", "San Antonio Spurs"),
    ],
  },
  {
    key: "all-nba-2",
    ja: "オールNBA セカンドチーム",
    en: "Kia All-NBA Second Team",
    source: "allNba",
    winners: [
      player("Jaylen Brown", "Boston Celtics"),
      player("Jalen Brunson", "New York Knicks"),
      player("Kevin Durant", "Houston Rockets"),
      player("Kawhi Leonard", "LA Clippers"),
      player("Donovan Mitchell", "Cleveland Cavaliers"),
    ],
  },
  {
    key: "all-nba-3",
    ja: "オールNBA サードチーム",
    en: "Kia All-NBA Third Team",
    source: "allNba",
    winners: [
      player("Jalen Duren", "Detroit Pistons"),
      player("Chet Holmgren", "Oklahoma City Thunder"),
      player("Jalen Johnson", "Atlanta Hawks"),
      player("Tyrese Maxey", "Philadelphia 76ers"),
      player("Jamal Murray", "Denver Nuggets"),
    ],
  },
  {
    key: "all-defensive-1",
    ja: "オールディフェンシブ ファーストチーム",
    en: "Kia NBA All-Defensive First Team",
    source: "allDefensive",
    winners: [
      player("Rudy Gobert", "Minnesota Timberwolves"),
      player("Chet Holmgren", "Oklahoma City Thunder"),
      player("Ausar Thompson", "Detroit Pistons"),
      player("Victor Wembanyama", "San Antonio Spurs"),
      player("Derrick White", "Boston Celtics"),
    ],
  },
  {
    key: "all-defensive-2",
    ja: "オールディフェンシブ セカンドチーム",
    en: "Kia NBA All-Defensive Second Team",
    source: "allDefensive",
    winners: [
      player("Bam Adebayo", "Miami Heat"),
      player("OG Anunoby", "New York Knicks"),
      player("Scottie Barnes", "Toronto Raptors"),
      player("Dyson Daniels", "Atlanta Hawks"),
      player("Cason Wallace", "Oklahoma City Thunder"),
    ],
  },
  {
    key: "all-rookie-1",
    ja: "オールルーキー ファーストチーム",
    en: "Kia NBA All-Rookie First Team",
    source: "allRookie",
    winners: [
      player("Cedric Coward", "Memphis Grizzlies"),
      player("VJ Edgecombe", "Philadelphia 76ers"),
      player("Cooper Flagg", "Dallas Mavericks"),
      player("Dylan Harper", "San Antonio Spurs"),
      player("Kon Knueppel", "Charlotte Hornets"),
    ],
  },
  {
    key: "all-rookie-2",
    ja: "オールルーキー セカンドチーム",
    en: "Kia NBA All-Rookie Second Team",
    source: "allRookie",
    winners: [
      player("Ace Bailey", "Utah Jazz"),
      player("Jeremiah Fears", "New Orleans Pelicans"),
      player("Collin Murray-Boyles", "Toronto Raptors"),
      player("Derik Queen", "New Orleans Pelicans"),
      player("Maxime Raynaud", "Sacramento Kings"),
    ],
  },
];
