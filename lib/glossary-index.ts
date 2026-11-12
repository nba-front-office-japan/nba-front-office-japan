// NBA用語辞典(/guide/glossary)のページ上部に出す、全用語の索引(あいうえお順・ABC順)。
// ・並べ替えはサーバー側(page.tsx)で1回だけ行い、結果(用語IDの並び)を表示側に渡す
//   (ブラウザごとの並べ替えの違いで、サーバーとブラウザの表示がずれないようにするため)。
// ・先頭の The / ザ・ジ・ は飛ばして並べる(表示は用語名のまま)。
// ・用語データ(lib/glossary-terms.ts / lib/glossary-slang.ts)には手を入れず、用語名が漢字・英字・数字で始まるものだけ下の READING で読みを補う。
//   (用語データの yomi は読み上げ用で漢字を含むため、並べ替えには使わない)
//   英字の略語(FG% など)は、ページで最初に目に入る略語の読み(えふじー…)で並べる。
import { GLOSSARY_CATEGORIES, GLOSSARY_TERMS, type GlossaryCategoryGroup, type GlossaryTerm } from "./glossary-terms";

// subs = 行の中を1文字目(あ・い・う…)で分けたもの(あいうえお順のみ。50音表から1文字目へ飛ぶために使う)
export type GlossaryIndexGroup = { label: string; ids: string[]; subs?: { label: string; ids: string[] }[] };
export type GlossaryIndex = { kana: GlossaryIndexGroup[]; abc: GlossaryIndexGroup[] };

// 用語名が漢字・英字・数字で始まるものの読み(あいうえお順の並べ替えにだけ使う)。
// 用語を追加して読みが足りないと「他」の行に入るので、そのときはここに足す
const READING: Record<string, string> = {
  // 基本の用語
  scoring: "とくてんのかぞえかた",
  "three-seconds": "さんびょうるーる",
  "three-and-d": "すりーあんどでぃー",
  points: "とくてん",
  minutes: "しゅつじょうじかん",
  "field-goal-percentage": "えふじーぱーせんと",
  "three-point-percentage": "すりーぴーぱーせんと",
  "free-throw-percentage": "えふてぃーぱーせんと",
  "plus-minus": "ぷらすまいなす",
  "true-shooting": "てぃーえすぱーせんと",
  "effective-fg": "いーえふじーぱーせんと",
  "usage-rate": "ゆーえすじーぱーせんと",
  "assist-turnover": "えーえすてぃーてぃーおー",
  per: "ぴーいーあーる",
  bpm: "びーぴーえむ",
  vorp: "ぶいおーあーるぴー",
  finals: "えぬびーえーふぁいなる",
  mvp: "えむぶいぴー",
  "rookie-of-the-year": "しんじんおう",
  "nba-cup": "えぬびーえーかっぷ",
  dpoy: "さいゆうしゅうしゅびせんしゅしょう",
  mip: "えむあいぴー",
  "65-game-rule": "ろくじゅうごしあいるーる",
  "general-manager": "じーえむ",
  "g-league": "じーりーぐ",
  "ten-day-contract": "とおかかんけいやく",
  extension: "えんちょうけいやく",
  "bird-rights": "ばーどらいつ",
  mle: "えむえるいー",
  "max-contract": "まっくすけいやく",
  "rfa-ufa": "あーるえふえー",
  "acl-tear": "ぜんじゅうじじんたいだんれつ",
  "mcl-sprain": "ないそくそくふくじんたいそんしょう",
  "meniscus-tear": "はんげつばんそんしょう",
  "groin-strain": "そけいぶのふしょう",
  "ankle-sprain": "あしくびのねんざ",
  "knee-hyperextension": "ひざのかしんてん",
  fracture: "こっせつ",
  "stress-fracture": "ひろうこっせつ",
  contusion: "だぼく",
  concussion: "のうしんとう",
  tendinopathy: "けんしょうがい",
  soreness: "いたみいわかん",
  // スラング・ニックネーム
  "the-chosen-one": "えらばれしもの",
  "pj-brown": "ぴーじぇいぶらうん",
};

const KANA_ROWS: [string, string][] = [
  ["あ", "あいうえお"],
  ["か", "かきくけこ"],
  ["さ", "さしすせそ"],
  ["た", "たちつてと"],
  ["な", "なにぬねの"],
  ["は", "はひふへほ"],
  ["ま", "まみむめも"],
  ["や", "やゆよ"],
  ["ら", "らりるれろ"],
  ["わ", "わをん"],
];
const SMALL_KANA: Record<string, string> = { ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お", っ: "つ", ゃ: "や", ゅ: "ゆ", ょ: "よ", ゎ: "わ", ゔ: "う" };

const toHiragana = (s: string) => s.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
// 先頭の「ザ・」「ジ・」(英語の The)は飛ばして並べる(例: ザ・グローブ → か行)。ABC順で The を飛ばすのと同じ
const reading = (t: GlossaryTerm) => toHiragana(READING[t.id] ?? t.term).replace(/^(ざ|じ)・/, "");

// 読みの1文字目(濁点・半濁点・小さい文字はもとの文字にする。例: ド → と)
function kanaInitial(t: GlossaryTerm): string {
  const first = reading(t).charAt(0);
  return SMALL_KANA[first] ?? first.normalize("NFD").charAt(0);
}
// 1文字目から「あ行」「か行」…を決める
function kanaRow(t: GlossaryTerm): string {
  const ch = kanaInitial(t);
  return KANA_ROWS.find(([, chars]) => chars.includes(ch))?.[0] ?? "他";
}
/** 50音表に並べる行と文字(索引の上の表に使う) */
export const GLOSSARY_KANA_TABLE: { row: string; chars: string[] }[] = KANA_ROWS.map(([row, chars]) => ({ row, chars: [...chars] }));

// ABC順の並べ替えキー(先頭の The は飛ばして並べる。例: The Answer → A)
export const abcSortKey = (en: string) =>
  en
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^the\s+/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const abcLetter = (en: string) => {
  const c = abcSortKey(en).charAt(0);
  return /[a-z]/.test(c) ? c.toUpperCase() : "0-9";
};

function groupBy(terms: GlossaryTerm[], label: (t: GlossaryTerm) => string): GlossaryIndexGroup[] {
  const out: GlossaryIndexGroup[] = [];
  for (const t of terms) {
    const l = label(t);
    const last = out[out.length - 1];
    if (last && last.label === l) last.ids.push(t.id);
    else out.push({ label: l, ids: [t.id] });
  }
  return out;
}

/** 全用語の索引。group を指定すると、そのまとまり(スラング・ニックネームなど)の用語だけ */
export function buildGlossaryIndex(group?: GlossaryCategoryGroup): GlossaryIndex {
  const cats = new Set(GLOSSARY_CATEGORIES.filter((c) => !group || c.group === group).map((c) => c.key));
  const terms = GLOSSARY_TERMS.filter((t) => cats.has(t.category));
  const ja = new Intl.Collator("ja");
  const kana = [...terms].sort((a, b) => ja.compare(reading(a), reading(b)) || ja.compare(a.term, b.term));
  const abc = [...terms].sort((a, b) => {
    const ka = abcSortKey(a.en);
    const kb = abcSortKey(b.en);
    // 数字で始まるもの(3 Goggles など)は最後にまとめる
    const da = /^[0-9]/.test(ka) ? 1 : 0;
    const db = /^[0-9]/.test(kb) ? 1 : 0;
    return da - db || (ka < kb ? -1 : ka > kb ? 1 : 0);
  });
  const byId = Object.fromEntries(terms.map((t) => [t.id, t]));
  const kanaGroups = groupBy(kana, kanaRow).map((g) => ({ ...g, subs: groupBy(g.ids.map((id) => byId[id]), kanaInitial) }));
  return { kana: kanaGroups, abc: groupBy(abc, (t) => abcLetter(t.en)) };
}
