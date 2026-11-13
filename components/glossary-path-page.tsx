import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { BackToGuide, GuideHeader } from "@/components/guide-article";
import { GlossaryDictionary } from "@/components/glossary-dictionary";
import { GLOSSARY_PATHS, GLOSSARY_SECTIONS, GLOSSARY_TOP_PATH, glossaryPathPagePath, type GlossaryPathKey } from "@/lib/glossary-terms";
import { fetchGlossaryPlayerIds } from "@/lib/glossary-player-links";
import { glossaryCounts, glossaryLookup, glossaryPathMap, glossarySectionBlock, termPath } from "@/lib/glossary-pages";

// NBA用語辞典の学習導線ページ(/guide/glossary/first「最初に知る用語」、/guide/glossary/deep「深掘りする用語」)。
// 9分類の中から、その導線に入っている用語だけを集め、分類の見出しを区切りにしてカードを流す。
// 前の用語辞典のレベル絞り込み(?level=)は proxy.ts でこのページかトップへ転送する。

const pathTerms = (p: GlossaryPathKey) =>
  GLOSSARY_SECTIONS.map((s) => glossarySectionBlock(s.key, (t) => termPath(t.id) === p)).filter((b) => b.groups.some((g) => g.terms.length > 0));
const countOf = (p: GlossaryPathKey) => pathTerms(p).reduce((n, b) => n + b.groups.reduce((m, g) => m + g.terms.length, 0), 0);

export function glossaryPathMetadata(p: GlossaryPathKey): Metadata {
  const x = GLOSSARY_PATHS.find((y) => y.key === p)!;
  const n = countOf(p);
  return {
    title: `${x.label}（${n}語） | NBA用語辞典 | NBA Front Office Japan`,
    description: `${x.lead}${n}語を分類ごとに、ひとことの説明と詳しい解説・実例で紹介します。音声（ゆっくり／ふつう）でも聞けます。`,
    alternates: { canonical: glossaryPathPagePath(p) },
  };
}

export async function GlossaryPathPage({ path }: { path: GlossaryPathKey }) {
  const x = GLOSSARY_PATHS.find((y) => y.key === path)!;
  const blocks = pathTerms(path);
  const n = countOf(path);
  const playerIds = await fetchGlossaryPlayerIds();

  return (
    <PageShell>
      <GuideHeader category="NBA用語辞典" categoryHref={GLOSSARY_TOP_PATH} current={x.label} />
      <h1 className="mb-2 flex flex-wrap items-baseline gap-x-3 text-[24px] font-semibold leading-tight tracking-tight sm:text-[32px]">
        {x.label}
        <span className="text-sm font-semibold text-muted tabular-nums">{n}語</span>
      </h1>
      <p className="mb-4 max-w-3xl text-sm leading-7 text-muted">
        {x.lead}
        <span className="hidden sm:inline">カードを押すと、その場で解説が開き、音声でも聞けます。</span>
      </p>

      {/* 導線の切り替え */}
      <nav aria-label="学習導線" className="mb-5 grid grid-cols-2 gap-2 sm:max-w-md">
        {GLOSSARY_PATHS.map((y) => {
          const here = y.key === path;
          return (
            <Link
              key={y.key}
              href={glossaryPathPagePath(y.key)}
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

      <GlossaryDictionary key={path} blocks={blocks} lookup={glossaryLookup()} counts={glossaryCounts()} paths={glossaryPathMap()} playerIds={playerIds} />

      <div className="mt-8 flex flex-wrap gap-x-6">
        <Link href={GLOSSARY_TOP_PATH} className="mt-8 inline-block text-sm font-extrabold text-blue">
          ← NBA用語辞典のトップへ
        </Link>
        <BackToGuide />
      </div>
    </PageShell>
  );
}
