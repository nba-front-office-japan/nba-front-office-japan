// NBA 30チームのカタカナの正式チーム名(チーム略称 → 日本語名)。teams テーブルには英語名(teams.name)だけがあるため、
// 試合結果・ボックススコアの表示用にここで持つ。英語名は teams.name をそのまま使う(例: LA Clippers → LAクリッパーズ)。
// 表に無い略称は null を返し、画面では英語名を表示する。

export const TEAM_NAME_JA: Record<string, string> = {
  ATL: "アトランタ・ホークス",
  BKN: "ブルックリン・ネッツ",
  BOS: "ボストン・セルティックス",
  CHA: "シャーロット・ホーネッツ",
  CHI: "シカゴ・ブルズ",
  CLE: "クリーブランド・キャバリアーズ",
  DAL: "ダラス・マーベリックス",
  DEN: "デンバー・ナゲッツ",
  DET: "デトロイト・ピストンズ",
  GSW: "ゴールデンステイト・ウォリアーズ",
  HOU: "ヒューストン・ロケッツ",
  IND: "インディアナ・ペイサーズ",
  LAC: "LAクリッパーズ",
  LAL: "ロサンゼルス・レイカーズ",
  MEM: "メンフィス・グリズリーズ",
  MIA: "マイアミ・ヒート",
  MIL: "ミルウォーキー・バックス",
  MIN: "ミネソタ・ティンバーウルブズ",
  NOP: "ニューオーリンズ・ペリカンズ",
  NYK: "ニューヨーク・ニックス",
  OKC: "オクラホマシティ・サンダー",
  ORL: "オーランド・マジック",
  PHI: "フィラデルフィア・セブンティシクサーズ",
  PHX: "フェニックス・サンズ",
  POR: "ポートランド・トレイルブレイザーズ",
  SAC: "サクラメント・キングス",
  SAS: "サンアントニオ・スパーズ",
  TOR: "トロント・ラプターズ",
  UTA: "ユタ・ジャズ",
  WAS: "ワシントン・ウィザーズ",
};

export function teamNameJa(abbreviation: string | null | undefined): string | null {
  return abbreviation ? (TEAM_NAME_JA[abbreviation] ?? null) : null;
}

/** タイトルなどに使うチームの短い呼び名(例: サンダー)。表に無い略称は英語名(fallback)を返す */
export function teamShortNameJa(abbreviation: string | null | undefined, fallback: string): string {
  if (abbreviation === "LAC") return "クリッパーズ";
  if (abbreviation === "PHI") return "76ers";
  const full = teamNameJa(abbreviation);
  return full ? full.slice(full.lastIndexOf("・") + 1) : fallback;
}
