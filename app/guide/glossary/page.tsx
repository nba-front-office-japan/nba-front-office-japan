import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { BackToGuide, GuideHeader, GuideTitle } from "@/components/guide-article";
import { GlossaryTopSearch } from "@/components/glossary-top-search";
import { CategoryMark } from "@/components/glossary-mark";
import {
  GLOSSARY_FEATURED,
  GLOSSARY_LEVEL_PAGES,
  GLOSSARY_SECTIONS,
  GLOSSARY_TERMS,
  glossaryLevelPath,
  glossarySectionPath,
  glossaryTermPath,
} from "@/lib/glossary-terms";
import { GLOSSARY_TERM_BY_ID, glossaryCounts, termSection } from "@/lib/glossary-pages";

export const metadata: Metadata = {
  title: "NBA用語辞典 | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのルール・プレー・スタッツ・契約制度の用語から、ニックネームや実況フレーズなどのカルチャーまで、9つの分類と初級・中級・上級のリストで解説。用語を押すと「ひとことで言うと」「詳しい解説」「NBAでの実例」が開き、音声（ゆっくり／ふつう）でも聞けます。",
  alternates: { canonical: "/guide/glossary" },
};

// NBA用語辞典のトップ(入口ページ)。置くのは「見出し」「検索窓」「初級・中級・上級のリストの入口」「9分類のカード」だけ。
// 用語のカードは分類ページ(/guide/glossary/<分類>、app/guide/glossary/[section]/page.tsx)に流す。
// 前の URL(/guide/glossary#term-用語ID など)で開かれたときは、検索窓の部品が分類ページへ振り替える。
export default function GlossaryTopPage() {
  const counts = glossaryCounts();
  const searchItems = GLOSSARY_TERMS.map((t) => ({ id: t.id, term: t.term, en: t.en, short: t.short, section: termSection(t.id) }));
  return (
    <PageShell>
      <GuideHeader category="NBA用語辞典" />
      <GuideTitle subject="NBA用語辞典" suffix="" />
      <p className="mb-5 max-w-3xl text-sm leading-7 text-muted">
        NBAの試合やニュースで出てくる{GLOSSARY_TERMS.length}語を、{GLOSSARY_SECTIONS.length}の分類に分けました。分類を開くと用語のカードが流れ、押すとその場で解説が開きます（音声でも聞けます）。
      </p>

      <section aria-label="用語を検索" className="mb-8 max-w-3xl">
        <GlossaryTopSearch items={searchItems} />
      </section>

      {/* 難易度別リストの入口(初級・中級・上級) */}
      <section aria-labelledby="glossary-levels-title" className="mb-10">
        <h2 id="glossary-levels-title" className="mb-3 border-b-4 border-foreground pb-2 text-xl font-black tracking-tight sm:text-2xl">
          どこから読む？
        </h2>
        <ul className="grid gap-2.5 sm:grid-cols-3">
          {GLOSSARY_LEVEL_PAGES.map((l, i) => {
            const n = GLOSSARY_TERMS.filter((t) => t.level === l.key).length;
            const first = i === 0;
            return (
              <li key={l.key}>
                <Link
                  href={glossaryLevelPath(l.key)}
                  className={`group flex h-full flex-col border px-4 py-4 ${first ? "border-navy bg-navy text-white" : "border-foreground bg-surface hover:bg-background"}`}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="inline-flex gap-0.5">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className={`inline-block size-2 bg-current ${d <= i ? "" : "opacity-25"}`} />
                      ))}
                    </span>
                    <span className="text-lg font-black group-hover:underline">{l.label}</span>
                    <span className={`text-xs font-semibold tabular-nums ${first ? "text-white/70" : "text-muted"}`}>{n}語</span>
                    <span aria-hidden className="ml-auto text-lg font-black">
                      →
                    </span>
                  </span>
                  <span className={`mt-1.5 text-sm leading-6 ${first ? "text-white/80" : "text-muted"}`}>{l.lead}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 9分類のカード */}
      <section aria-labelledby="glossary-categories-title">
        <h2 id="glossary-categories-title" className="mb-4 border-b-4 border-foreground pb-2 text-xl font-black tracking-tight sm:text-2xl">
          分類から探す
          <span className="ml-2 text-sm font-semibold text-muted tabular-nums">{GLOSSARY_SECTIONS.length}分類</span>
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GLOSSARY_SECTIONS.map((c) => (
            <li key={c.key} className="flex flex-col border border-line border-t-4 bg-surface" style={{ borderTopColor: c.color }}>
              <Link href={glossarySectionPath(c.key)} className="group flex items-center gap-2.5 px-4 pb-1 pt-3.5">
                <CategoryMark c={c} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-bold leading-snug [word-break:auto-phrase] group-hover:text-blue">{c.label}</span>
                  <span className="text-xs font-semibold text-muted tabular-nums">{counts[c.key]}語</span>
                </span>
                <span aria-hidden className="text-lg font-black text-muted group-hover:text-blue">
                  →
                </span>
              </Link>
              <p className="px-4 text-[13px] leading-6 text-muted">{c.lead}</p>
              <ul className="mt-auto flex flex-wrap gap-1.5 px-4 pb-4 pt-3" aria-label={`${c.label}の代表的な用語`}>
                {GLOSSARY_FEATURED[c.key]
                  .map((id) => GLOSSARY_TERM_BY_ID[id])
                  .filter(Boolean)
                  .map((t) => (
                    <li key={t.id}>
                      <Link
                        href={glossaryTermPath(t.id, c.key)}
                        className="inline-flex items-center border border-line bg-background px-2 py-1 text-xs font-bold hover:border-foreground hover:text-blue"
                      >
                        {t.term}
                      </Link>
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6">
        <BackToGuide />
      </div>
    </PageShell>
  );
}
