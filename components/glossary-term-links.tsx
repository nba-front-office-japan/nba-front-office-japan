import Link from "next/link";
import { CategoryMark, GLOSSARY_SECTION_BY_KEY } from "@/components/glossary-mark";
import { GLOSSARY_EXTRA_GUIDE_LINKS, GLOSSARY_TERMS, GLOSSARY_TOP_PATH, glossaryTermPath } from "@/lib/glossary-terms";
import { termSection } from "@/lib/glossary-pages";

// ガイド記事の末尾に置く「この記事に関係する用語」(NBA用語辞典の分類ページの該当カードへのリンク)。
// 前の分類「契約・チーム運営」(用語データの category: team。今の表示ではチーム編成／契約・サラリー)の用語のうち、
// この記事へリンクしている用語(用語の href か GLOSSARY_EXTRA_GUIDE_LINKS)を自動で集める。
// 用語カード → 記事 のリンクと、記事 → 用語カード のリンクが必ず対になる。
export function glossaryTermsForGuide(guidePath: string) {
  return GLOSSARY_TERMS.filter((t) => t.category === "team" && (t.href ?? GLOSSARY_EXTRA_GUIDE_LINKS[t.id]?.href) === guidePath);
}

export function GlossaryTermLinks({ guidePath }: { guidePath: string }) {
  const terms = glossaryTermsForGuide(guidePath);
  if (terms.length === 0) return null;
  const top = GLOSSARY_SECTION_BY_KEY[termSection(terms[0].id)];
  return (
    <section aria-labelledby="glossary-term-links-title" className="mt-8 border border-line border-t-4 bg-surface p-5 sm:p-6" style={{ borderTopColor: top.color }}>
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-muted">Glossary</p>
      <h2 id="glossary-term-links-title" className="mb-1 text-lg font-semibold tracking-tight">
        この記事に関係する用語
      </h2>
      <p className="mb-3 text-sm leading-7 text-muted">
        <Link href={GLOSSARY_TOP_PATH} className="font-bold text-blue underline underline-offset-4 hover:no-underline">
          NBA用語辞典
        </Link>
        で、ひとことの説明と解説が読めます。
      </p>
      <ul className="flex flex-wrap gap-2">
        {terms.map((t) => {
          const s = termSection(t.id);
          return (
            <li key={t.id}>
              <Link
                href={glossaryTermPath(t.id, s)}
                className="inline-flex items-center gap-1.5 border border-line bg-background px-2.5 py-1.5 text-sm font-bold hover:border-foreground hover:text-blue"
              >
                <CategoryMark c={GLOSSARY_SECTION_BY_KEY[s]} />
                {t.term}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
