import { GLOSSARY_SECTIONS, type GlossarySectionKey } from "@/lib/glossary-categories";

// 分類のマーク(1文字)。色だけに頼らず文字でも見分けられるようにする(用語集トップ・分類ページ・導線ページ・ガイド記事末尾で共通)
type Section = (typeof GLOSSARY_SECTIONS)[number];
export const GLOSSARY_SECTION_BY_KEY = Object.fromEntries(GLOSSARY_SECTIONS.map((s) => [s.key, s])) as Record<GlossarySectionKey, Section>;

export function CategoryMark({ c, size = "sm" }: { c: { mark: string; color: string }; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "size-12 text-2xl" : size === "md" ? "size-9 text-lg" : "size-6 text-[13px]";
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center font-black text-white ${cls}`} style={{ backgroundColor: c.color }}>
      {c.mark}
    </span>
  );
}
