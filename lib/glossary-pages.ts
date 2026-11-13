// 用語集のページ(トップ・分類ページ・学習導線ページ)をサーバー側で組み立てるための補助。
import {
  GLOSSARY_CULTURE_SUBHEADS,
  GLOSSARY_SECTIONS,
  GLOSSARY_TERMS,
  type GlossaryPathKey,
  type GlossarySectionKey,
  type GlossaryTerm,
} from "@/lib/glossary-terms";
import { GLOSSARY_TAXONOMY } from "@/lib/glossary-taxonomy";

export const GLOSSARY_TERM_BY_ID = Object.fromEntries(GLOSSARY_TERMS.map((t) => [t.id, t])) as Record<string, GlossaryTerm>;

export const termSection = (id: string): GlossarySectionKey => GLOSSARY_TAXONOMY[id][0];
export const termPath = (id: string): GlossaryPathKey | undefined => GLOSSARY_TAXONOMY[id][1];

// 全用語の「名前と分類」だけの表(ブラウザ側の部品に渡す。あわせて読みたい用語のリンクと、# からの振り替えに使う)
export type GlossaryLookup = Record<string, { term: string; section: GlossarySectionKey }>;
export function glossaryLookup(): GlossaryLookup {
  return Object.fromEntries(GLOSSARY_TERMS.map((t) => [t.id, { term: t.term, section: termSection(t.id) }]));
}

// 学習導線に入っている用語だけの表(カードのバッジ用)
export function glossaryPathMap(): Record<string, GlossaryPathKey> {
  const out: Record<string, GlossaryPathKey> = {};
  for (const t of GLOSSARY_TERMS) {
    const p = termPath(t.id);
    if (p) out[t.id] = p;
  }
  return out;
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
