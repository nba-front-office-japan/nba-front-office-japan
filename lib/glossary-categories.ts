// NBA用語辞典の分類・レベル・型(用語データを含まない軽いファイル)。
// 用語データ(lib/glossary-terms.ts)を読み込まずに、分類の名前・色・マークだけを使いたい画面(ブラウザ側の部品)のために分けている。
// 分類の key は、そのまま分類ページの URL(/guide/glossary/<key>)にも使う。
export type GlossaryLevel = "beginner" | "intermediate" | "advanced";
export type GlossaryCategory =
  | "rules"
  | "position"
  | "offense"
  | "defense"
  | "stats"
  | "season"
  | "team"
  | "injury"
  // ここから「スラング・ニックネーム」(lib/glossary-slang.ts)
  | "celebration"
  | "taunt"
  | "commentary"
  | "play-slang"
  | "momentum"
  | "player-type"
  | "team-era"
  | "nickname"
  | "trivia";
export type GlossaryCategoryGroup = "basic" | "slang";
export type GlossaryFigure =
  | "court-areas"
  | "positions"
  | "shot-clock"
  | "quarters"
  | "traveling"
  | "scoring"
  | "three-seconds"
  | "goaltending"
  | "bonus"
  | "backcourt"
  | "charge-block"
  | "pick-and-roll"
  | "pick-and-pop"
  | "fast-break"
  | "drive-kick"
  | "alley-oop"
  | "euro-step"
  | "step-back"
  | "screen"
  | "spacing"
  | "box-out"
  | "man-to-man"
  | "zone"
  | "switch"
  | "help-defense"
  | "double-team"
  | "drop"
  | "stat-line"
  | "play-in"
  | "playoffs"
  | "conferences"
  | "cap-levels"
  | "lottery-odds";

export type GlossaryTerm = {
  id: string;
  term: string;
  en: string;
  yomi?: string;
  level: GlossaryLevel;
  category: GlossaryCategory;
  short: string;
  detail?: string;
  points?: string[];
  watch?: string;
  example?: string;
  figure?: GlossaryFigure;
  related?: string[];
  href?: string;
  linkLabel?: string;
  // 同じ分類の中の小見出し(例: 選手のニックネームの「レジェンド」)
  group?: string;
  // 選手名鑑へのリンク。英語名(別表記を含む)とドラフト年・全体指名順位で名鑑と照合し、一致した選手だけリンクする
  players?: { ja: string; en: string[]; draft: [number, number] }[];
};

export const GLOSSARY_LEVELS: { key: GlossaryLevel; label: string; lead: string }[] = [
  { key: "beginner", label: "初心者向け", lead: "NBAを見始めた人向け。ルール・ポジション・基本のプレーとスタッツを、図と例で丁寧に。" },
  { key: "intermediate", label: "中級者向け", lead: "戦術や効率の指標、ロスターの動きがわかるようになる用語。" },
  { key: "advanced", label: "上級者向け", lead: "サラリーキャップや契約制度、上級指標まで。フロントの視点で読む用語。" },
];

// mark は分類を見分けるための1文字(色だけに頼らず、文字でも区別できるようにする)
// short はスマホの目次で使う短い名前
export const GLOSSARY_CATEGORY_GROUPS: { key: GlossaryCategoryGroup; label: string; short: string }[] = [
  { key: "basic", label: "基本の用語", short: "基本" },
  { key: "slang", label: "スラング・ニックネーム", short: "スラング" },
];

export const GLOSSARY_CATEGORIES: {
  key: GlossaryCategory;
  group: GlossaryCategoryGroup;
  label: string;
  mark: string;
  lead: string;
  color: string;
  tint: string;
}[] = [
  { key: "rules", group: "basic", label: "試合・ルール", mark: "規", lead: "試合時間、反則、得点の数え方など、コートの上の決まりごと。", color: "#c8323c", tint: "#fdecee" },
  { key: "position", group: "basic", label: "ポジション・役割", mark: "位", lead: "1番〜5番のポジションと、チームの中での役割。", color: "#d9620b", tint: "#fff1e6" },
  { key: "offense", group: "basic", label: "オフェンス（攻撃）", mark: "攻", lead: "シュートの種類や、点を取るためのプレー・戦術。", color: "#1f63e9", tint: "#eaf1ff" },
  { key: "defense", group: "basic", label: "ディフェンス（守備）", mark: "守", lead: "相手の得点を防ぐための守り方と戦術。", color: "#0f7d8c", tint: "#e4f5f7" },
  { key: "stats", group: "basic", label: "スタッツ・指標", mark: "数", lead: "ボックススコアの数字から、効率を測る上級指標まで。", color: "#13866f", tint: "#e6f5f1" },
  { key: "season", group: "basic", label: "シーズン・大会・アワード", mark: "賞", lead: "レギュラーシーズン、プレーオフ、個人賞など、1年の流れ。", color: "#7b3fb8", tint: "#f3ecfb" },
  { key: "team", group: "basic", label: "契約・チーム運営", mark: "契", lead: "トレード、ドラフト、契約、サラリーキャップなど、フロントの仕事。", color: "#a8641a", tint: "#fbf0e1" },
  { key: "injury", group: "basic", label: "怪我・欠場", mark: "傷", lead: "欠場情報や怪我のニュースで使われる言葉。", color: "#5b6779", tint: "#eef1f5" },
  // スラング・ニックネーム
  { key: "celebration", group: "slang", label: "決めポーズ（セレブレーション）", mark: "祝", lead: "いいプレーのあとに選手が見せる、おなじみのポーズ。", color: "#c2185b", tint: "#fce8f0" },
  { key: "taunt", group: "slang", label: "挑発・言い合い", mark: "挑", lead: "相手を揺さぶるしぐさや言葉。やりすぎるとテクニカルファウルに。", color: "#b23a12", tint: "#fbece6" },
  { key: "commentary", group: "slang", label: "実況フレーズ", mark: "実", lead: "名実況の決め台詞や、中継でよく聞く言い回し。", color: "#2e5aa8", tint: "#e9effa" },
  { key: "play-slang", group: "slang", label: "プレイの表現", mark: "技", lead: "シュートやダンク、パスを表すくだけた言い方。", color: "#00796b", tint: "#e3f3f1" },
  { key: "momentum", group: "slang", label: "勝負・状態の言葉", mark: "勝", lead: "絶好調・絶不調や、勝負強さを表す言葉。", color: "#6a4fb3", tint: "#efebfa" },
  { key: "player-type", group: "slang", label: "選手のタイプ・異名", mark: "型", lead: "選手の特徴や役割を表すスラング。", color: "#8a6d00", tint: "#f8f2dc" },
  { key: "team-era", group: "slang", label: "チーム・時代の愛称", mark: "団", lead: "一時代を築いたチームや、ブームになった出来事の呼び名。", color: "#37474f", tint: "#e9eef0" },
  { key: "nickname", group: "slang", label: "選手のニックネーム（由来）", mark: "名", lead: "レジェンドから現役スターまで、愛称とその由来。", color: "#ad1457", tint: "#fbe7ef" },
  { key: "trivia", group: "slang", label: "面白ネタ（フルネームなど）", mark: "雑", lead: "長いフルネームや改名など、話のタネになる小ネタ。", color: "#558b2f", tint: "#eef5e6" },
];

// ─── 表示の分類(9つ) ───
// 2026-11-13 のゼロベース再編で、表示の分類は次の9つにした(用語ごとの割り当ては lib/glossary-taxonomy.ts)。
// 上の GLOSSARY_CATEGORIES(用語データの category。17種)は、NBAカルチャーの中の小見出しと、互換用の振り替えにだけ使う。
// 難易度(level)は分類には使わず、難易度別リスト(GLOSSARY_LEVEL_PAGES)にだけ使う。
export type GlossarySectionKey =
  | "game-rules"
  | "plays-tactics"
  | "players-positions"
  | "stats-analytics"
  | "season-events"
  | "team-building"
  | "contracts-salary"
  | "health-injuries"
  | "culture";

export const GLOSSARY_SECTIONS: { key: GlossarySectionKey; label: string; mark: string; lead: string; color: string; tint: string }[] = [
  { key: "game-rules", label: "試合・ルール", mark: "規", lead: "試合時間、反則、得点の数え方など、コートの上の決まりごと。", color: "#c8323c", tint: "#fdecee" },
  { key: "plays-tactics", label: "プレー・戦術", mark: "技", lead: "シュートやパスの種類から、攻め方・守り方の戦術まで。", color: "#1f63e9", tint: "#eaf1ff" },
  { key: "players-positions", label: "選手・ポジション", mark: "位", lead: "1番〜5番のポジションと、チームの中での選手の役割。", color: "#d9620b", tint: "#fff1e6" },
  { key: "stats-analytics", label: "スタッツ・分析", mark: "数", lead: "ボックススコアの数字から、効率を測る上級指標まで。", color: "#13866f", tint: "#e6f5f1" },
  { key: "season-events", label: "シーズン・大会", mark: "賞", lead: "レギュラーシーズン、プレーオフ、個人賞など、1年の流れ。", color: "#7b3fb8", tint: "#f3ecfb" },
  { key: "team-building", label: "チーム編成", mark: "編", lead: "ドラフト、トレード、ロスターなど、チームをつくる仕事。", color: "#0f7d8c", tint: "#e4f5f7" },
  { key: "contracts-salary", label: "契約・サラリー", mark: "契", lead: "契約の種類と、サラリーキャップ・エプロンなどお金のルール。", color: "#a8641a", tint: "#fbf0e1" },
  { key: "health-injuries", label: "コンディション・怪我", mark: "傷", lead: "欠場情報や怪我のニュースで使われる言葉。", color: "#5b6779", tint: "#eef1f5" },
  { key: "culture", label: "ニックネーム・スラング・カルチャー", mark: "文", lead: "ニックネーム、実況の決め台詞、決めポーズ、スラングなど、NBAを楽しむ言葉。", color: "#c2185b", tint: "#fce8f0" },
];

// NBAカルチャーの中の小見出し(用語データの category ごと。並びもこの順)。
// 選手のタイプ・異名(player-type)からカルチャーに入った用語は「選手の呼び名・評価」にまとめる。
export const GLOSSARY_CULTURE_SUBHEADS: { category: GlossaryCategory; label: string }[] = [
  { category: "nickname", label: "ニックネーム" },
  { category: "commentary", label: "実況表現" },
  { category: "play-slang", label: "プレイの表現" },
  { category: "celebration", label: "決めポーズ" },
  { category: "taunt", label: "挑発" },
  { category: "momentum", label: "勝負・状態" },
  { category: "player-type", label: "選手の呼び名・評価" },
  { category: "team-era", label: "チーム・時代" },
  { category: "trivia", label: "面白ネタ" },
];

// 難易度(初級・中級・上級)。中身は用語データの level(CSV の「現在の難易度」と同じ)。
// 2026-11-13(夜)の指示で、難易度は「ページ」ではなく、用語集トップの画面の中で切り替える選択にした(?level=〜 で選択済みの状態を表す)。
// トップで選ぶと分類カードの語数・代表的な用語がその難易度の分になり、開いた分類ページでもその難易度の用語だけが流れる。
export const GLOSSARY_LEVEL_PAGES: { key: GlossaryLevel; label: string; lead: string }[] = [
  { key: "beginner", label: "初級", lead: "NBAを見るなら、まずはここまで知っておきたい用語。ルール・基本のプレー・スタッツなど、試合を楽しむための土台です。" },
  { key: "intermediate", label: "中級", lead: "戦術や効率の指標、ロスターの動き、ニックネームやスラングまで。試合とニュースがもっと楽しくなる用語です。" },
  { key: "advanced", label: "上級", lead: "サラリーキャップや契約制度、上級指標など。ニュースの裏側やフロントの判断を読み解くための用語です。" },
];

// 前の分類(用語データの category。17種)の #cat-〜 で開かれたときの振り替え先
export const GLOSSARY_LEGACY_CATEGORY_SECTION: Record<GlossaryCategory, GlossarySectionKey> = {
  rules: "game-rules",
  position: "players-positions",
  offense: "plays-tactics",
  defense: "plays-tactics",
  stats: "stats-analytics",
  season: "season-events",
  team: "team-building",
  injury: "health-injuries",
  celebration: "culture",
  taunt: "culture",
  commentary: "culture",
  "play-slang": "culture",
  momentum: "culture",
  "player-type": "culture",
  "team-era": "culture",
  nickname: "culture",
  trivia: "culture",
};

// ─── URL ───
// 用語集トップ / 分類ページ / 難易度別リスト / 用語カード(分類ページの #term-用語ID。開いた状態で着地する)
export const GLOSSARY_TOP_PATH = "/guide/glossary";
export const glossarySectionPath = (s: GlossarySectionKey) => `${GLOSSARY_TOP_PATH}/${s}`;
// 難易度を選んだ状態の用語集トップ(/guide/glossary?level=beginner など)
export const glossaryLevelPath = (lv: GlossaryLevel) => `${GLOSSARY_TOP_PATH}?level=${lv}`;
// 難易度の選択。"all" は「すべて」(初期状態)
export type GlossaryLevelFilter = GlossaryLevel | "all";
export const parseGlossaryLevel = (s: string | null | undefined): GlossaryLevelFilter =>
  s === "beginner" || s === "intermediate" || s === "advanced" ? s : "all";
// URL に難易度の選択(?level=)を付ける。"all" のときは付けない。#term- などの # は後ろに残す
export function withGlossaryLevel(href: string, lv: GlossaryLevelFilter): string {
  if (lv === "all") return href;
  const i = href.indexOf("#");
  const [path, hash] = i < 0 ? [href, ""] : [href.slice(0, i), href.slice(i)];
  return `${path}${path.includes("?") ? "&" : "?"}level=${lv}${hash}`;
}
export const glossaryTermHash = (id: string) => `#term-${id}`;
export const glossaryTermPath = (id: string, s: GlossarySectionKey) => `${glossarySectionPath(s)}${glossaryTermHash(id)}`;

// 用語集トップの分類カードに出す「代表的な用語」(押すと分類ページでそのカードが開く)
export const GLOSSARY_FEATURED: Record<GlossarySectionKey, string[]> = {
  "game-rules": ["traveling", "shot-clock", "three-seconds", "charge-block", "buzzer-beater"],
  "plays-tactics": ["pick-and-roll", "euro-step", "step-back", "zone-defense", "switch"],
  "players-positions": ["point-guard", "center", "sixth-man", "three-and-d", "unicorn"],
  "stats-analytics": ["triple-double", "plus-minus", "true-shooting", "per"],
  "season-events": ["play-in", "playoffs", "mvp", "nba-cup"],
  "team-building": ["trade", "draft", "free-agent", "tanking"],
  "contracts-salary": ["salary-cap", "luxury-tax", "bird-rights", "max-contract", "aprons"],
  "health-injuries": ["injury-report", "day-to-day", "load-management", "acl-tear"],
  culture: ["chef-curry", "night-night", "dagger", "goat", "showtime"],
};

// 用語データに「詳しく読む」(href)が無い用語のうち、対応するガイド記事があるもの(用語データは変えずに、ここで足す)。
// 用語カードの中に、href と同じ「詳しく読む」リンクとして出す。
export const GLOSSARY_EXTRA_GUIDE_LINKS: Record<string, { href: string; label: string }> = {
  "g-league": { href: "/guide/roster-contracts", label: "ロスター契約・短期契約" },
  extension: { href: "/guide/max-contract", label: "MAX契約" },
  tanking: { href: "/guide/draft-lottery", label: "ロッタリー" },
  "hard-cap": { href: "/guide/mle", label: "MLE" },
  "trade-exception": { href: "/guide/aprons", label: "1st Apron / 2nd Apron" },
};
