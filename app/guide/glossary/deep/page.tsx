import { GlossaryPathPage, glossaryPathMetadata } from "@/components/glossary-path-page";

// 選手名鑑へのリンク(ニックネームなど)は名鑑のデータと照合して作るため、1日ごとに作り直す
export const revalidate = 86400;

export const metadata = glossaryPathMetadata("deep");

export default function Page() {
  return <GlossaryPathPage path="deep" />;
}
