import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { GUIDE_PAGES } from "@/lib/guide-official";

export const metadata: Metadata = {
  title: "NBAガイド | NBA Front Office Japan",
  description: "NBAの制度・契約・ドラフト・トレード・ビジネスなどを日本語で解説するガイドの一覧です。",
};

// ガイドのカテゴリーと、各カテゴリーで扱う内容の例。
// 詳細ページがある項目だけ GUIDE_PAGES(lib/guide-official.ts)にURLを登録してリンクにする(未作成のページへはリンクしない)。
// RFA / UFA・MLE は「契約」と「NBA用語」の両方に載せる(詳細ページを作ったら同じページへリンクする想定)。

const GUIDE_CATEGORIES: { category: string; examples: string[] }[] = [
  // 最初に読む導入ページ
  { category: "はじめに", examples: ["NBAを試合結果だけで終わらせない"] },
  {
    category: "NBA制度",
    examples: ["サラリーキャップ", "ラグジュアリータックス", "1st Apron / 2nd Apron", "Revenue Sharing"],
  },
  { category: "契約", examples: ["MAX契約", "ミニマム契約", "Bird Rights", "RFA / UFA", "MLE", "ロスター契約・短期契約"] },
  { category: "ドラフト", examples: ["ドラフト指名権", "ロッタリー", "指名権の価値"] },
  {
    category: "トレード・ロスター移動",
    examples: ["トレードの基本", "サラリーマッチング", "Buyout", "Waive"],
  },
  { category: "NBAビジネス", examples: ["放映権", "NBAオーナー", "チーム資産価値"] },
  {
    category: "過去事件",
    examples: ["ジョー・スミス事件", "タンパリング", "サラリーキャップ迂回に関する処分"],
  },
  { category: "NBA用語", examples: ["2-way", "RFA", "UFA", "MLE", "NBA用語集"] },
];

// 例を「、」区切りで並べる。1項目(例:「1st Apron / 2nd Apron」)が行の途中で折り返さないよう、
// 項目ごとに改行を禁止し、項目の区切りでだけ折り返す。
function ExampleList({ examples }: { examples: string[] }) {
  return (
    <>
      {examples.map((example, i) => (
        <span key={example} className="whitespace-nowrap">
          {GUIDE_PAGES[example] ? (
            <Link
              href={GUIDE_PAGES[example]}
              className="font-semibold text-blue underline underline-offset-4 hover:no-underline"
            >
              {example}
            </Link>
          ) : (
            example
          )}
          {i < examples.length - 1 && "、"}
        </span>
      ))}
    </>
  );
}

export default function GuidePage() {
  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Guide</p>
      <h1 className="mb-3 text-[36px] font-semibold tracking-tight">NBAガイド</h1>
      <p className="mb-8 text-sm text-muted">
        NBAの制度・契約・ドラフト・トレード・ビジネスを理解するためのガイドです。各カテゴリーの解説は順次追加します。
      </p>

      {/* PC: 2列の表 */}
      <div className="hidden border border-line bg-surface sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground text-left">
              <th scope="col" className="w-[220px] px-5 py-3 text-[11px] font-extrabold uppercase tracking-[1.3px] text-muted">
                GUIDE内カテゴリー
              </th>
              <th scope="col" className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-[1.3px] text-muted">
                例
              </th>
            </tr>
          </thead>
          <tbody>
            {GUIDE_CATEGORIES.map((row) => (
              <tr key={row.category} className="border-b border-line last:border-b-0">
                <th scope="row" className="px-5 py-4 text-left align-top text-[15px] font-bold">
                  {row.category}
                </th>
                <td className="px-5 py-4 leading-7">
                  <ExampleList examples={row.examples} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* スマホ: カテゴリーごとの縦並び */}
      <div className="border border-line bg-surface sm:hidden">
        <p className="border-b-2 border-foreground px-4 py-3 text-[11px] font-extrabold uppercase tracking-[1.3px] text-muted">
          GUIDE内カテゴリー ／ 例
        </p>
        <dl>
          {GUIDE_CATEGORIES.map((row) => (
            <div key={row.category} className="border-b border-line px-4 py-4 last:border-b-0">
              <dt className="mb-1 text-[15px] font-bold">{row.category}</dt>
              <dd className="text-sm leading-7 text-muted">
                <ExampleList examples={row.examples} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </PageShell>
  );
}
