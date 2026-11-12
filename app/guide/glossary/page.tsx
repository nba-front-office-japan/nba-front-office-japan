import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { BackToGuide, GuideHeader, GuideTitle } from "@/components/guide-article";
import { GlossaryDictionary } from "@/components/glossary-dictionary";
import { GUIDE_PAGES } from "@/lib/guide-official";
import { GLOSSARY_TERMS } from "@/lib/glossary-terms";
import { fetchGlossaryPlayerIds } from "@/lib/glossary-player-links";
import { buildGlossaryIndex } from "@/lib/glossary-index";

export const metadata: Metadata = {
  title: "NBA用語辞典（初心者・中級者・上級者） | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのルール・プレー・スタッツ・契約制度の用語から、スラングや選手のニックネームの由来まで、初心者向け・中級者向け・上級者向けの3段階で解説。用語をクリックすると「ひとことで言うと」「詳しい解説」「NBAでの実例」が開き、音声（ゆっくり／ふつう）でも聞けます。",
};

// 選手名鑑へのリンク(ニックネームなど)は名鑑のデータと照合して作るため、1日ごとに作り直す
export const revalidate = 86400;

// NBA用語辞典(URL はもとの「用語一覧」と同じ /guide/glossary)。
// 用語データは lib/glossary-terms.ts と lib/glossary-slang.ts。表示とポップアップ・音声は components/glossary-dictionary.tsx。
export default async function GlossaryGuidePage() {
  const playerIds = await fetchGlossaryPlayerIds();
  return (
    <PageShell>
      <GuideHeader category="NBA用語辞典" />
      <GuideTitle subject="NBA用語辞典" suffix="" />
      <p className="mb-4 max-w-3xl text-sm leading-7 text-muted">
        NBAの試合やニュースで出てくる{GLOSSARY_TERMS.length}語を、流し読みできるカードにしました。<span className="hidden sm:inline">押すとその場で解説が開き、音声でも聞けます。</span>契約の細かい用語は
        <Link href={GUIDE_PAGES["契約用語"]} className="font-bold text-blue underline underline-offset-4 hover:no-underline">
          契約用語
        </Link>
        へ。
      </p>

      <GlossaryDictionary playerIds={playerIds} termIndex={buildGlossaryIndex()} />

      <div className="mt-10">
        <BackToGuide />
      </div>
    </PageShell>
  );
}
