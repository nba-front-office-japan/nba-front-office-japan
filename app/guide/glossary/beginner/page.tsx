import { GlossaryLevelPage, glossaryLevelMetadata } from "@/components/glossary-level-page";

// 選手名鑑へのリンク(ニックネームなど)は名鑑のデータと照合して作るため、1日ごとに作り直す
export const revalidate = 86400;

export const metadata = glossaryLevelMetadata("beginner");

export default function Page() {
  return <GlossaryLevelPage level="beginner" />;
}
