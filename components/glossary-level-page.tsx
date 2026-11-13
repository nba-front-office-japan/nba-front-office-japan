import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { BackToGuide, GuideHeader } from "@/components/guide-article";
import { GlossaryDictionary } from "@/components/glossary-dictionary";
import { GLOSSARY_LEVEL_PAGES, GLOSSARY_SECTIONS, GLOSSARY_TERMS, GLOSSARY_TOP_PATH, glossaryLevelPath, type GlossaryLevel } from "@/lib/glossary-terms";
import { fetchGlossaryPlayerIds } from "@/lib/glossary-player-links";
import { glossaryCounts, glossaryLookup, glossarySectionBlock } from "@/lib/glossary-pages";

// NBA用語辞典の難易度別リスト(/guide/glossary/beginner「初級」・intermediate「中級」・advanced「上級」)。
// 9分類の中から、その難易度(用語データの level。CSV の「現在の難易度」と同じ)の用語だけを集め、分類の見出しを区切りにしてカードを流す。
// 前の URL(?level=、/first、/deep)からの転送は proxy.ts と next.config.ts。

const levelBlocks = (lv: GlossaryLevel) =>
  GLOSSARY_SECTIONS.map((s) => glossarySectionBlock(s.key, (t) => t.level === lv)).filter((b) => b.groups.some((g) => g.terms.length > 0));
const countOf = (lv: GlossaryLevel) => GLOSSARY_TERMS.filter((t) => t.level === lv).length;

export function glossaryLevelMetadata(lv: GlossaryLevel): Metadata {
  const x = GLOSSARY_LEVEL_PAGES.find((y) => y.key === lv)!;
  const n = countOf(lv);
  return {
    title: `${x.label}のNBA用語（${n}語） | NBA用語辞典 | NBA Front Office Japan`,
    description: `${x.lead}${n}語を分類ごとに、ひとことの説明と詳しい解説・実例で紹介します。音声（ゆっくり／ふつう）でも聞けます。`,
    alternates: { canonical: glossaryLevelPath(lv) },
  };
}

export async function GlossaryLevelPage({ level }: { level: GlossaryLevel }) {
  const x = GLOSSARY_LEVEL_PAGES.find((y) => y.key === level)!;
  const playerIds = await fetchGlossaryPlayerIds();

  return (
    <PageShell>
      <GuideHeader category="NBA用語辞典" categoryHref={GLOSSARY_TOP_PATH} current={x.label} />
      <h1 className="mb-2 flex flex-wrap items-baseline gap-x-3 text-[24px] font-semibold leading-tight tracking-tight sm:text-[32px]">
        {x.label}の用語
        <span className="text-sm font-semibold text-muted tabular-nums">{countOf(level)}語</span>
      </h1>
      <p className="mb-4 max-w-3xl text-sm leading-7 text-muted">
        {x.lead}
        <span className="hidden sm:inline">カードを押すと、その場で解説が開き、音声でも聞けます。</span>
      </p>

      {/* 難易度の切り替え */}
      <nav aria-label="難易度別リスト" className="mb-5 grid grid-cols-3 gap-2 sm:max-w-lg">
        {GLOSSARY_LEVEL_PAGES.map((y) => {
          const here = y.key === level;
          return (
            <Link
              key={y.key}
              href={glossaryLevelPath(y.key)}
              aria-current={here ? "page" : undefined}
              className={`flex min-h-11 items-center justify-center gap-1.5 border px-2 py-1.5 text-sm font-bold ${
                here ? "border-foreground bg-navy text-white" : "border-line bg-surface hover:border-foreground"
              }`}
            >
              {y.label}
              <span className={`tabular-nums ${here ? "text-white/80" : "text-muted"}`}>{countOf(y.key)}</span>
            </Link>
          );
        })}
      </nav>

      <GlossaryDictionary key={level} blocks={levelBlocks(level)} lookup={glossaryLookup()} counts={glossaryCounts()} playerIds={playerIds} />

      <div className="mt-8 flex flex-wrap gap-x-6">
        <Link href={GLOSSARY_TOP_PATH} className="mt-8 inline-block text-sm font-extrabold text-blue">
          ← NBA用語辞典のトップへ
        </Link>
        <BackToGuide />
      </div>
    </PageShell>
  );
}
