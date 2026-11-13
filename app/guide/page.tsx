import type { Metadata } from "next";
import Link from "next/link";
import { BriefSheet, BriefSide } from "@/components/brief-sheet";
import { PageShell } from "@/components/page-shell";
import { GUIDE_PAGES } from "@/lib/guide-official";
import { GLOSSARY_TERMS } from "@/lib/glossary-terms";

export const metadata: Metadata = {
  title: "NBAガイド | NBA Front Office Japan",
  description: "NBAの制度・契約・ドラフト・トレード・ビジネスなどを日本語で解説するガイドの一覧です。",
};

// ガイドは「順番に理解するための読み物」、用語辞典は「知らない言葉を調べる場所」。
// ガイドの記事は4つのテーマ(章)にまとめる(2026-11-13。「チームをつくる」は「契約とサラリーを読む」に合流)。記事の中身は変えず、並べ方だけを決める。
// 詳細ページがある項目だけ GUIDE_PAGES(lib/guide-official.ts)にURLを登録してリンクにする(未作成のページへはリンクしない)。
// 用語辞典は章とは別の「調べる」カードとして先頭に置き、辞典トップ・初級・中級・上級へリンクする。

// groups があるテーマは、記事一覧を小見出しで分ける(並び順は groups の順のまま)。
type GuideCategory = { category: string; description: string } & (
  | { examples: string[]; groups?: undefined }
  | { groups: { heading: string; items: string[] }[]; examples?: undefined }
);
const categoryArticles = (row: GuideCategory) => row.groups ? row.groups.flatMap((g) => g.items) : row.examples;

const GUIDE_CATEGORIES: GuideCategory[] = [
  {
    category: "NBAの全体像",
    description: "リーグのしくみとお金の流れ。まずここから全体をつかみます。",
    examples: ["NBAを試合結果だけで終わらせない", "放映権", "NBAオーナー", "チーム資産価値"],
  },
  {
    category: "契約とサラリーを読む",
    description: "ドラフト・トレードから契約・サラリーキャップまで、チームづくりを縛るルール。",
    groups: [
      { heading: "ドラフトとトレード", items: ["ドラフト指名権", "ロッタリー", "指名権の価値", "トレードの基本", "サラリーマッチング", "Buyout", "Waive"] },
      { heading: "サラリーキャップと税金", items: ["サラリーキャップ", "ラグジュアリータックス", "1st Apron / 2nd Apron", "Revenue Sharing"] },
      { heading: "契約の種類", items: ["MAX契約", "ミニマム契約", "Bird Rights", "RFA / UFA", "MLE", "ロスター契約・短期契約", "契約用語"] },
    ],
  },
  { category: "スタッツを読む", description: "ボックススコアから上級指標まで、数字の読み方。", examples: ["スタッツ表の見方", "ネットレーティング", "PER"] },
  {
    category: "NBAの歴史と事件",
    description: "リーグの歩みと、ルールが変わるきっかけになった事件。",
    examples: ["NBAの歴史", "ジョー・スミス事件", "タンパリング", "サラリーキャップ迂回に関する処分"],
  },
];

// PC(2列)での配置。「契約とサラリーを読む」は記事が多く縦に長いので左列で3段ぶんを使い、
// 「NBAの歴史と事件」を右列(スタッツを読むの下)に入れて、右側に大きな空白が残らないようにする。スマホ(1列)は並び順どおり。
const GRID_PLACEMENT: Record<string, string> = {
  "契約とサラリーを読む": "sm:row-span-3",
  "NBAの歴史と事件": "sm:col-start-2",
};

// 用語辞典(調べる)のカードに並べるリンク
const GLOSSARY_LINKS = ["NBA用語辞典", "初級", "中級", "上級"];

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
              className="selection-button selection-blue inline-block rounded-lg px-1.5 py-1 font-semibold text-blue underline underline-offset-4 hover:no-underline"
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
      <BriefSheet
        file="09"
        mark={["FRONT OFFICE", "GUIDE"]}
        edition="NBA RULES & BUSINESS"
        report="REFERENCE LIBRARY"
        kicker="Guide"
        title="NBAガイド"
        lead="NBAを順番に理解するためのガイドです。制度・契約・ドラフト・トレード・ビジネスを背景から学べます。知らない言葉をその場で調べるときは、NBA用語辞典を使ってください。"
        side={
          <BriefSide label="Start here">
            <ExampleList examples={[categoryArticles(GUIDE_CATEGORIES[0])[0]]} />
          </BriefSide>
        }
      >
        {/* 用語辞典(調べる)と、5つのテーマ(章)のカード: タイトル＋1行説明＋記事数、その下に記事へのリンク */}
        <ol className="grid items-start gap-3 sm:grid-cols-2">
          <li className="flex flex-col border border-navy border-t-4 bg-navy text-white">
            <div className="px-4 pb-2 pt-3.5 sm:px-5">
              <p className="flex items-baseline gap-2">
                <span className="text-[11px] font-extrabold tracking-[1.3px] text-gold">調べる</span>
                <Link href={GUIDE_PAGES["NBA用語辞典"]} className="text-[17px] font-bold hover:underline">
                  NBA用語辞典
                </Link>
                <span className="ml-auto shrink-0 border border-white/40 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white/80">
                  {GLOSSARY_TERMS.length}語
                </span>
              </p>
              <p className="mt-1 text-[13px] leading-6 text-white/75">試合やニュースで出てくる言葉を、1語1カードでその場で調べられます。</p>
            </div>
            <ul className="space-y-0.5 border-t border-white/20 px-4 py-2.5 text-sm sm:px-5">
              {GLOSSARY_LINKS.map((e) => (
                <li key={e}>
                  <Link href={GUIDE_PAGES[e]} className="group flex items-center gap-1.5 py-1 font-semibold text-white">
                    <span aria-hidden className="text-gold">›</span>
                    <span className="group-hover:underline">{e === "NBA用語辞典" ? "用語辞典のトップ（9分類）" : `${e}の用語`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          {GUIDE_CATEGORIES.map((row, i) => {
            const count = categoryArticles(row).filter((e) => GUIDE_PAGES[e]).length;
            const sections = row.groups ?? [{ heading: "", items: row.examples }];
            return (
              <li key={row.category} className={`flex flex-col border border-line border-t-4 border-t-foreground bg-surface ${GRID_PLACEMENT[row.category] ?? ""}`}>
                <div className="px-4 pb-2 pt-3.5 sm:px-5">
                  <p className="flex items-baseline gap-2">
                    <span className="text-[11px] font-extrabold tabular-nums tracking-[1.3px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[17px] font-bold">{row.category}</span>
                    <span className="ml-auto shrink-0 border border-line px-1.5 py-0.5 text-[11px] font-bold text-muted tabular-nums">{count}記事</span>
                  </p>
                  <p className="mt-1 text-[13px] leading-6 text-muted">{row.description}</p>
                </div>
                <div className="border-t border-line px-4 py-2.5 text-sm sm:px-5">
                  {sections.map((sec) => (
                    <div key={sec.heading || "all"} className={sec.heading ? "mt-2 first:mt-0" : undefined}>
                      {sec.heading && (
                        <p className="border-b border-line pb-1 pt-1 text-[12px] font-extrabold tracking-[0.5px] text-foreground">{sec.heading}</p>
                      )}
                      <ul className="space-y-0.5">
                      {sec.items.map((e) => (
                        <li key={e}>
                          {GUIDE_PAGES[e] ? (
                            <Link href={GUIDE_PAGES[e]} className="group flex items-center gap-1.5 py-1 font-semibold text-blue">
                              <span aria-hidden className="text-muted group-hover:text-blue">›</span>
                              <span className="group-hover:underline">{e === "NBAを試合結果だけで終わらせない" ? `はじめに：${e}` : e}</span>
                            </Link>
                          ) : (
                            <span className="flex items-center gap-1.5 py-1 text-muted">
                              <span aria-hidden>›</span>
                              {e}
                              <span className="text-[11px]">（準備中）</span>
                            </span>
                          )}
                        </li>
                      ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </BriefSheet>
    </PageShell>
  );
}
