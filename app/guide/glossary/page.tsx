import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { BackToGuide, GuideHeader, GuideTitle } from "@/components/guide-article";
import { GlossaryTopSearch } from "@/components/glossary-top-search";
import { GlossaryTopLevels } from "@/components/glossary-level-select";
import { GLOSSARY_SECTIONS, GLOSSARY_TERMS } from "@/lib/glossary-terms";
import { glossaryFeaturedByLevel, glossaryLevelCounts, termSection } from "@/lib/glossary-pages";

export const metadata: Metadata = {
  title: "NBA用語辞典 | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのルール・プレー・スタッツ・契約制度の用語から、ニックネームや実況フレーズなどのカルチャーまで、9つの分類で解説（初級・中級・上級で絞り込み可）。用語を押すと「ひとことで言うと」「詳しい解説」「NBAでの実例」が開き、音声（ゆっくり／ふつう）でも聞けます。",
  alternates: { canonical: "/guide/glossary" },
};

// NBA用語辞典のトップ(唯一の入口)。置くのは「見出し」「検索窓」「難易度(初級・中級・上級)の選択」「9分類のカード」だけ。
// 難易度はページではなく、この画面の中の選択(?level=〜。components/glossary-level-select.tsx)。
// 用語のカードは分類ページ(/guide/glossary/<分類>、app/guide/glossary/[section]/page.tsx)に流す。
// 前の URL(/guide/glossary#term-用語ID など)で開かれたときは、検索窓の部品が分類ページへ振り替える。
export default function GlossaryTopPage() {
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

      {/* 難易度の選択(初級・中級・上級)と9分類のカード。難易度を選ぶと分類カードがその難易度の分になる */}
      <GlossaryTopLevels counts={glossaryLevelCounts()} featured={glossaryFeaturedByLevel()} />

      <div className="mt-6">
        <BackToGuide />
      </div>
    </PageShell>
  );
}
