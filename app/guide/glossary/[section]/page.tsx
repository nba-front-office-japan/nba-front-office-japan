import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { BackToGuide, GuideHeader } from "@/components/guide-article";
import { GlossaryDictionary } from "@/components/glossary-dictionary";
import { CategoryMark } from "@/components/glossary-mark";
import { GLOSSARY_SECTIONS, GLOSSARY_TOP_PATH, glossarySectionPath } from "@/lib/glossary-terms";
import { fetchGlossaryPlayerIds } from "@/lib/glossary-player-links";
import { glossaryCounts, glossaryLevelCounts, glossaryLookup, glossarySectionBlock, isGlossarySection } from "@/lib/glossary-pages";
import { GlossarySectionNeighbors } from "@/components/glossary-level-select";

// 選手名鑑へのリンク(ニックネームなど)は名鑑のデータと照合して作るため、1日ごとに作り直す
export const revalidate = 86400;
// 9分類以外の URL は 404(beginner・intermediate・advanced・first・deep は next.config.ts で用語集トップへ転送)
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

// NBA用語辞典の分類ページ(中項目)。その分類の用語カードを流す(カードの表示は components/glossary-dictionary.tsx)。
// ?level=〜 が付いていれば、その難易度の用語だけを流す(ページは静的に作り、絞り込みはブラウザ側)。
export default async function GlossarySectionPage({ params }: PageProps<"/guide/glossary/[section]">) {
  const { section } = await params;
  if (!isGlossarySection(section)) notFound();
  const i = GLOSSARY_SECTIONS.findIndex((x) => x.key === section);
  const c = GLOSSARY_SECTIONS[i];
  const counts = glossaryCounts();
  const levelCounts = glossaryLevelCounts();
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
        levelCounts={levelCounts}
        current={c.key}
        playerIds={playerIds}
      />

      {/* 前後の分類へ(難易度を選んでいるときは、その難易度の用語がある分類だけをたどる) */}
      <GlossarySectionNeighbors current={c.key} counts={levelCounts} />

      <div className="mt-8 flex flex-wrap gap-x-6">
        <Link href={GLOSSARY_TOP_PATH} className="mt-8 inline-block text-sm font-extrabold text-blue">
          ← NBA用語辞典のトップへ
        </Link>
        <BackToGuide />
      </div>
    </PageShell>
  );
}
