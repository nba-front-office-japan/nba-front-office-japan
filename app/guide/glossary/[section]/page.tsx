import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { BackToGuide, GuideHeader } from "@/components/guide-article";
import { GlossaryDictionary } from "@/components/glossary-dictionary";
import { CategoryMark } from "@/components/glossary-mark";
import { GLOSSARY_SECTIONS, GLOSSARY_TOP_PATH, glossarySectionPath } from "@/lib/glossary-terms";
import { fetchGlossaryPlayerIds } from "@/lib/glossary-player-links";
import { glossaryCounts, glossaryLookup, glossaryPathMap, glossarySectionBlock, isGlossarySection } from "@/lib/glossary-pages";

// 選手名鑑へのリンク(ニックネームなど)は名鑑のデータと照合して作るため、1日ごとに作り直す
export const revalidate = 86400;
// 9分類以外の URL は 404(first・deep は別のページ)
export const dynamicParams = false;

export function generateStaticParams() {
  return GLOSSARY_SECTIONS.map((s) => ({ section: s.key }));
}

export async function generateMetadata({ params }: PageProps<"/guide/glossary/[section]">): Promise<Metadata> {
  const { section } = await params;
  if (!isGlossarySection(section)) return {};
  const c = GLOSSARY_SECTIONS.find((x) => x.key === section)!;
  const n = glossaryCounts()[c.key];
  return {
    title: `${c.label}の用語（${n}語） | NBA用語辞典 | NBA Front Office Japan`,
    description: `${c.lead}NBA用語辞典の「${c.label}」${n}語を、ひとことの説明と詳しい解説・実例で紹介します。音声（ゆっくり／ふつう）でも聞けます。`,
    alternates: { canonical: glossarySectionPath(c.key) },
  };
}

// NBA用語辞典の分類ページ(中項目)。その分類の用語カードを全部流す(カードの表示は components/glossary-dictionary.tsx)。
export default async function GlossarySectionPage({ params }: PageProps<"/guide/glossary/[section]">) {
  const { section } = await params;
  if (!isGlossarySection(section)) notFound();
  const i = GLOSSARY_SECTIONS.findIndex((x) => x.key === section);
  const c = GLOSSARY_SECTIONS[i];
  const prev = GLOSSARY_SECTIONS[i - 1];
  const next = GLOSSARY_SECTIONS[i + 1];
  const counts = glossaryCounts();
  const playerIds = await fetchGlossaryPlayerIds();

  return (
    <PageShell>
      <GuideHeader category="NBA用語辞典" categoryHref={GLOSSARY_TOP_PATH} current={c.label} />
      <div className="mb-4 flex items-center gap-3">
        <CategoryMark c={c} size="lg" />
        <h1 className="min-w-0 text-[24px] font-semibold leading-tight tracking-tight [word-break:auto-phrase] sm:text-[32px]">
          {c.label}
          <span className="ml-2 align-middle text-sm font-semibold text-muted tabular-nums">{counts[c.key]}語</span>
        </h1>
      </div>
      <p className="mb-4 max-w-3xl text-sm leading-7 text-muted">
        {c.lead}
        <span className="hidden sm:inline">カードを押すと、その場で解説が開き、音声でも聞けます。</span>
      </p>

      <GlossaryDictionary
        key={c.key}
        blocks={[glossarySectionBlock(c.key)]}
        lookup={glossaryLookup()}
        counts={counts}
        paths={glossaryPathMap()}
        current={c.key}
        playerIds={playerIds}
      />

      {/* 前後の分類へ */}
      <nav aria-label="前後の分類" className="mt-10 grid max-w-4xl gap-2.5 sm:grid-cols-2">
        {prev ? (
          <Link href={glossarySectionPath(prev.key)} className="group flex items-center gap-2.5 border border-line bg-surface px-4 py-3 hover:border-foreground">
            <span aria-hidden className="text-muted">←</span>
            <CategoryMark c={prev} />
            <span className="min-w-0">
              <span className="block text-[11px] font-bold text-muted">前の分類</span>
              <span className="font-bold group-hover:text-blue">{prev.label}</span>
            </span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {next && (
          <Link href={glossarySectionPath(next.key)} className="group flex items-center justify-end gap-2.5 border border-line bg-surface px-4 py-3 text-right hover:border-foreground">
            <span className="min-w-0">
              <span className="block text-[11px] font-bold text-muted">次の分類</span>
              <span className="font-bold group-hover:text-blue">{next.label}</span>
            </span>
            <CategoryMark c={next} />
            <span aria-hidden className="text-muted">→</span>
          </Link>
        )}
      </nav>

      <div className="mt-8 flex flex-wrap gap-x-6">
        <Link href={GLOSSARY_TOP_PATH} className="mt-8 inline-block text-sm font-extrabold text-blue">
          ← NBA用語辞典のトップへ
        </Link>
        <BackToGuide />
      </div>
    </PageShell>
  );
}
