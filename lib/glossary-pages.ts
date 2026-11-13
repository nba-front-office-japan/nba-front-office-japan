// 用語集のページ(トップ・分類ページ・難易度別リスト)をサーバー側で組み立てるための補助。
import {
  GLOSSARY_CULTURE_SUBHEADS,
  GLOSSARY_FEATURED,
  type GlossaryLevelFilter,
  GLOSSARY_SECTIONS,
  GLOSSARY_TERMS,
  type GlossarySectionKey,
  type GlossaryTerm,
} from "@/lib/glossary-terms";
import { GLOSSARY_TAXONOMY } from "@/lib/glossary-taxonomy";

export const GLOSSARY_TERM_BY_ID = Object.fromEntries(GLOSSARY_TERMS.map((t) => [t.id, t])) as Record<string, GlossaryTerm>;

export const termSection = (id: string): GlossarySectionKey => GLOSSARY_TAXONOMY[id];

// 全用語の「名前と分類」だけの表(ブラウザ側の部品に渡す。あわせて読みたい用語のリンクと、# からの振り替えに使う)
export type GlossaryLookup = Record<string, { term: string; section: GlossarySectionKey }>;
export function glossaryLookup(): GlossaryLookup {
  return Object.fromEntries(GLOSSARY_TERMS.map((t) => [t.id, { term: t.term, section: termSection(t.id) }]));
}

// 分類ごとの語数
export function glossaryCounts(): Record<GlossarySectionKey, number> {
  const out = Object.fromEntries(GLOSSARY_SECTIONS.map((s) => [s.key, 0])) as Record<GlossarySectionKey, number>;
  for (const t of GLOSSARY_TERMS) out[termSection(t.id)] += 1;
  return out;
}

export const isGlossarySection = (s: string): s is GlossarySectionKey => GLOSSARY_SECTIONS.some((x) => x.key === s);

// 画面に流す分類のまとまり。NBAカルチャーは、用語データの category ごとの小見出し(GLOSSARY_CULTURE_SUBHEADS)に分ける
export type GlossaryGroup = { label?: string; terms: GlossaryTerm[] };
export type GlossarySectionBlock = { key: GlossarySectionKey; groups: GlossaryGroup[] };

export function glossarySectionBlock(key: GlossarySectionKey, filter: (t: GlossaryTerm) => boolean = () => true): GlossarySectionBlock {
  const terms = GLOSSARY_TERMS.filter((t) => termSection(t.id) === key && filter(t));
  if (key !== "culture") return { key, groups: [{ terms }] };
  return {
    key,
    groups: GLOSSARY_CULTURE_SUBHEADS.map((h) => ({ label: h.label, terms: terms.filter((t) => t.category === h.category) })).filter((g) => g.terms.length > 0),
  };
}

// 難易度ごと(「すべて」を含む)の、分類ごとの語数。用語集トップの分類カードと、分類ページの難易度の切り替えに使う
export const GLOSSARY_LEVEL_FILTERS: GlossaryLevelFilter[] = ["all", "beginner", "intermediate", "advanced"];
export type GlossaryLevelCounts = Record<GlossaryLevelFilter, Record<GlossarySectionKey, number>>;
export function glossaryLevelCounts(): GlossaryLevelCounts {
  const out = Object.fromEntries(
    GLOSSARY_LEVEL_FILTERS.map((lv) => [lv, Object.fromEntries(GLOSSARY_SECTIONS.map((s) => [s.key, 0]))]),
  ) as GlossaryLevelCounts;
  for (const t of GLOSSARY_TERMS) {
    const s = termSection(t.id);
    out.all[s] += 1;
    out[t.level][s] += 1;
  }
  return out;
}

// 難易度ごとの、分類カードに出す「代表的な用語」。
// まず GLOSSARY_FEATURED のうちその難易度の用語、足りなければその分類・難易度の用語をデータの順に足して、最大5語にする
export type GlossaryFeaturedByLevel = Record<GlossaryLevelFilter, Record<GlossarySectionKey, { id: string; term: string }[]>>;
export function glossaryFeaturedByLevel(max = 5): GlossaryFeaturedByLevel {
  const out = {} as GlossaryFeaturedByLevel;
  for (const lv of GLOSSARY_LEVEL_FILTERS) {
    out[lv] = {} as Record<GlossarySectionKey, { id: string; term: string }[]>;
    for (const s of GLOSSARY_SECTIONS) {
      const match = (t: GlossaryTerm) => termSection(t.id) === s.key && (lv === "all" || t.level === lv);
      const picked = GLOSSARY_FEATURED[s.key].map((id) => GLOSSARY_TERM_BY_ID[id]).filter((t) => t && match(t));
      const limit = lv === "all" ? GLOSSARY_FEATURED[s.key].length : max;
      for (const t of GLOSSARY_TERMS) {
        if (picked.length >= limit) break;
        if (match(t) && !picked.includes(t)) picked.push(t);
      }
      out[lv][s.key] = picked.slice(0, limit).map((t) => ({ id: t.id, term: t.term }));
    }
  }
  return out;
}
