import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import {
  BackToGuide,
  Bullets,
  GlossarySection,
  GuideHeader,
  GuideTitle,
  OfficialSourcesSection,
  RelatedGuideLink,
  Section,
  SummarySection,
} from "@/components/guide-article";
import { GUIDE_PAGES, type OfficialSource } from "@/lib/guide-official";

export const metadata: Metadata = {
  title: "NBAのPER（選手効率指標）とは？目安と注意点 | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのPER（Player Efficiency Rating）を初心者向けに解説します。ボックススコアから選手の1分当たりの貢献を表す計算の考え方、リーグ平均15を基準にした数値の目安、守備を捉えにくいなど見るときの注意点をまとめました。",
  alternates: { canonical: "/guide/per" },
};

// PERの考え方は Sports Reference「PER Explainer」、目安の表は考案者ジョン・ホリンジャーの基準(Wikipedia等で広く紹介)、
// シーズン記録は Basketball-Reference「Progressive Leaders and Records for Player Efficiency Rating」にもとづく。
// 確認日:2026年11月3日。進行中のシーズン(2026-27)は試合数が少なく値が大きく動くため、記録として扱わない。
// 長い計算式そのものは載せず、考え方だけを説明する。

const SOURCES: OfficialSource[] = [
  {
    title: "PER Explainer（英語）",
    publisher: "Sports Reference",
    date: "当サイトでの確認日：2026年11月3日",
    href: "https://faq.sports-reference.com/portal/en/kb/articles/per-explainer",
    note: "PERの考え方（1分当たり、ペース調整、リーグ平均15）",
  },
  {
    title: "NBA Progressive Leaders and Records for Player Efficiency Rating（英語）",
    publisher: "Basketball-Reference",
    date: "当サイトでの確認日：2026年11月3日",
    href: "https://www.basketball-reference.com/leaders/per_progress.html",
    note: "シーズンPERの記録の推移（2021-22 ニコラ・ヨキッチ 32.85 など）",
  },
  {
    title: "Player efficiency rating（英語）",
    publisher: "Wikipedia",
    date: "当サイトでの確認日：2026年11月3日",
    href: "https://en.wikipedia.org/wiki/Player_efficiency_rating",
    note: "ホリンジャーによるPERの目安と、PERへの主な批判",
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "ボックススコア（Box score）",
    description: "試合ごとの得点、リバウンド、アシスト、シュート成功・試投数などをまとめた成績表。",
  },
  {
    term: "ペース（Pace）",
    description: "48分当たりのポゼッション（攻撃の回数）。速い展開のチームの選手ほど、スタッツの合計が大きくなりやすい。",
  },
  {
    term: "PIE（Player Impact Estimate）",
    description: "NBA.comが使う、試合全体の成績に占める選手の貢献の割合を表す指標。PERと似た結果になるとされる。",
  },
  {
    term: "ネットレーティング",
    description: "100ポゼッション当たりの得失点差。選手の場合は、その選手の出場中のチームの値。",
    href: GUIDE_PAGES["ネットレーティング"],
  },
];

// ホリンジャーによる目安(シーズン通算)
const SCALE: [string, string][] = [
  ["35.0以上", "歴史に残るシーズン"],
  ["30.0〜35.0", "独走のMVP候補"],
  ["27.5〜30.0", "有力なMVP候補"],
  ["25.0〜27.5", "MVP候補の一角"],
  ["22.5〜25.0", "オールスター確実"],
  ["20.0〜22.5", "オールスター当落線上"],
  ["18.0〜20.0", "チームの2番手の得点源"],
  ["16.5〜18.0", "チームの3番手の得点源"],
  ["15.0〜16.5", "平均より少し上"],
  ["13.0〜15.0", "ローテーション選手"],
  ["11.0〜13.0", "ローテーション外の選手"],
  ["9.0〜11.0", "ロスターの当落線上"],
  ["9.0未満", "NBAに残るのが難しい水準"],
];

export default function PerGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="スタッツの見方" current="PER" />
      <GuideTitle subject="NBAのPER（選手効率指標）" />
      <p className="mb-8 text-sm text-muted">
        Sports Reference（Basketball-Reference）の解説などをもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "PER（Player Efficiency Rating）は、ボックススコアの成績から、選手の「1分当たりの貢献」を1つの数字にまとめた指標です。",
            "リーグ平均が毎シーズン15になるように調整されていて、15より上なら平均以上、20を超えるとオールスター級が目安です。",
            "守備やスクリーンなど、ボックススコアに表れにくい貢献は十分に反映されない点に注意が必要です。",
          ]}
        />

        {/* 2. とは */}
        <Section kicker="What it is" title="PERとは">
          <Bullets
            items={[
              <>
                <b>考案者：</b>ESPNのコラムニストだったジョン・ホリンジャー（のちにグリズリーズのフロントでも勤務）が考案しました。
              </>,
              <>
                <b>1つの数字で比べられる：</b>得点、リバウンド、アシストなど、ばらばらのスタッツをまとめて1つの数字にするため、ポジションの違う選手同士でもざっくり比べられます。
              </>,
              <>
                <b>平均は必ず15：</b>リーグ全体の平均が15になるように毎シーズン調整されるため、時代が違っても「平均と比べてどれくらい上か」を比べやすくなっています。
              </>,
            ]}
          />
        </Section>

        {/* 3. 計算の考え方 */}
        <Section kicker="How it works" title="計算の考え方">
          <p>正式な計算式はとても長いため、ここでは考え方だけを紹介します。</p>
          <ol className="space-y-2">
            {[
              ["プラスを足す", "フィールドゴール成功、3ポイント成功、フリースロー成功、アシスト、リバウンド、スティール、ブロック"],
              ["マイナスを引く", "シュートのミス、フリースローのミス、ターンオーバー、ファウル"],
              ["価値で重み付け", "それぞれのプレーが、どれだけ得点を生んだか・防いだかに応じて重みを変える"],
              ["1分当たりにそろえる", "出場時間の長さではなく、コートにいる1分当たりの貢献にする"],
              ["ペースを調整する", "速い展開のチームの選手が、攻撃回数の多さだけで有利にならないようにする"],
              ["平均を15にそろえる", "リーグ平均が15になるように全体を調整する"],
            ].map(([name, text], i) => (
              <li key={name} className="flex items-start gap-3 border border-line px-3 py-2.5">
                <span className="grid h-6 w-6 flex-none place-items-center bg-navy text-xs font-bold text-white">{i + 1}</span>
                <span>
                  <b>{name}</b>
                  <span className="block text-muted sm:inline sm:before:content-['：']">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>

        {/* 4. 数値の目安 */}
        <Section kicker="Benchmarks" title="数値の目安（シーズン通算）">
          <p>考案者のホリンジャーは、シーズン通算のPERの目安を次のように示しています。</p>
          <ol className="space-y-2">
            {SCALE.map(([value, text]) => (
              <li
                key={value}
                className={`flex items-start gap-3 border px-3 py-2.5 ${value === "15.0〜16.5" ? "border-gold bg-[#fff6e0] dark:bg-white/[.06]" : "border-line"}`}
              >
                <span className="w-[96px] flex-none font-bold">{value}</span>
                <span className="text-muted">{text}</span>
              </li>
            ))}
          </ol>
          <p>
            シーズン（全日程を終えたシーズン）のPERの最高記録は、2021-22シーズンのニコラ・ヨキッチ（ナゲッツ）の32.85です（Basketball-Reference、2026年11月3日確認）。30を超えるシーズンは、歴代でもごく一部の選手しか記録していません。
          </p>
        </Section>

        {/* 5. 見方の注意点 */}
        <Section kicker="Caution" title="見るときの注意点">
          <Bullets
            items={[
              <>
                <b>守備の評価が弱い：</b>スティールとブロック以外の守備（マーク相手を抑える、ヘルプに入るなど）はボックススコアに残りにくく、守備が持ち味の選手は低く出がちです。
              </>,
              <>
                <b>出場時間が短い選手・シーズン序盤はブレる：</b>1分当たりの指標なので、出場時間が少ないと数本のシュートで大きく動きます。シーズン序盤に歴代最高を上回るような値が出ることもありますが、試合数が増えると落ち着くのが普通です。
              </>,
              <>
                <b>シュートの多い選手が有利になりやすい：</b>多くシュートを打つ選手が高く出やすいという批判があります。シュートの効率（成功率）もあわせて見るのがおすすめです。
              </>,
              <>
                <b>昔の選手との比較は慎重に：</b>ルールや記録される項目が時代で違います。たとえばNBAでターンオーバーが記録されるようになったのは1977-78シーズンからのため、それより前のPERは推定を含みます。
              </>,
              <>
                <b>1つの指標だけで決めない：</b>PERは便利な目安ですが、選手の価値をすべて表すものではありません。ネットレーティングなど、ほかの指標と組み合わせて見ましょう。
              </>,
            ]}
          />
        </Section>

        {/* 6. サイト内で確認する */}
        <Section kicker="On this site" title="当サイトで確認できるデータ">
          <p>
            当サイトでは、PERの数値そのものはまだ掲載していません。PERの材料になる基本スタッツは次のページで確認できます。
          </p>
          <Bullets
            items={[
              <>
                <Link href="/stats" className="font-semibold text-blue hover:underline">選手スタッツ</Link>：出場時間、得点、リバウンド、アシスト、スティール、ブロック、ターンオーバーなど
              </>,
              <>
                <Link href="/players/featured" className="font-semibold text-blue hover:underline">人気選手ガイド</Link>：主な選手の特徴と成績
              </>,
              <>
                <Link href="/games" className="font-semibold text-blue hover:underline">試合結果・ボックススコア</Link>：試合ごとの選手の成績
              </>,
            ]}
          />
        </Section>

        {/* 7. 関連ガイド */}
        <Section kicker="Related" title="関連ガイド">
          <RelatedGuideLink href={GUIDE_PAGES["ネットレーティング"]} label="NBAのネットレーティングとは？（100ポゼッション当たりの得失点差）" />
          <RelatedGuideLink href={GUIDE_PAGES["スタッツ・指標"]} label="用語一覧：スタッツ・指標" />
        </Section>

        {/* 8. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 9. 出典 */}
        <OfficialSourcesSection
          sources={SOURCES}
          kicker="Sources"
          title="出典"
          note="このページは上記の資料をもとにした当サイト独自の解説です。計算式の転載・全文翻訳ではありません。"
        />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
