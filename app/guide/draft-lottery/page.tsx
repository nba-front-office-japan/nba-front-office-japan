import type { Metadata } from "next";
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
  title: "NBAドラフト・ロッタリーとは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAドラフト・ロッタリーの役割、成績と抽選確率の関係、抽選で決まる指名順の範囲、2027〜2029年のドラフトに適用される新しいロッタリー制度を初心者向けに解説します。",
};

// 解説文は公式資料をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所:
//   - NBA定款・細則(2018年10月版) 第7.02条: ロッタリー対象(プレーオフに進めなかった14チーム)、1位指名の確率表、上位4つの抽選、
//     残りは成績の低い順、同成績の扱い(抽選で決定、2巡目は1巡目と逆順)
//   - NBA.com(2017年9月28日): 現行制度は2019年のドラフトから。最下位でも5位より下にはならない
//   - NBA.com 解説記事(2026年6月1日更新): 2026年のロッタリー(14個のボール・1,001通りの組み合わせ・1,000通りを割り当て)
//   - NBA Communications(2026年4月20日): 同成績の順番は抽選(ランダムドローイング)で決定、2巡目は1巡目と逆順
//   - NBA Communications(2026年5月28日)と同日の公式資料(PDF): 3-2-1 Lottery(2027〜2029年のドラフト)
// 3-2-1 Lotteryの確率の分布は、公式資料で「例示(Illustrative)」として示されているため掲載しない。
// 特定チーム・選手の事例、将来の指名順位予想、指名権の金額評価、推測は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "National Basketball Association Constitution and By-Laws（PDF・英語）",
    publisher: "NBA",
    date: "2018年10月版",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2018/10/NBA-Constitution-By-Laws-October-2018.pdf",
    note: "第7.02条：ロッタリーの対象チーム、1位指名の確率、抽選する指名数、同成績の扱い。NBA公式サイトで公開されている版です",
  },
  {
    title: "NBA Board of Governors approves changes to draft lottery system",
    publisher: "NBA.com",
    date: "2017年9月28日公開",
    href: "https://www.nba.com/news/nba-board-governors-approves-changes-draft-lottery-system",
    note: "現行制度の導入（2019年のドラフトから）と、最下位チームの最低順位",
  },
  {
    title: "2026 NBA Draft Lottery: Odds, history and how it works",
    publisher: "NBA.com",
    date: "2026年6月1日更新",
    href: "https://www.nba.com/news/nba-draft-lottery-explainer",
    note: "2026年のドラフトのロッタリーの仕組み（ボールの数と組み合わせ）",
  },
  {
    title: "Ties broken for order of selection in NBA Draft 2026",
    publisher: "NBA Communications（pr.nba.com）",
    date: "2026年4月20日公開",
    href: "https://pr.nba.com/2026-nba-draft-tiebreakers/",
    note: "同じ成績のチームの順番の決め方（タイブレーク）",
  },
  {
    title: "NBA Board of Governors approves new Draft Lottery system to address tanking",
    publisher: "NBA Communications（pr.nba.com）",
    date: "2026年5月28日公開",
    href: "https://pr.nba.com/nba-board-of-governors-approves-new-draft-lottery-system-to-address-tanking/",
    note: "新しいロッタリー制度「3-2-1 Lottery」の承認と主な変更点",
  },
  {
    title: "3-2-1 Lottery（PDF・英語）",
    publisher: "NBA",
    date: "2026年5月公開",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/46/2026/05/NBA-3-2-1-Draft-Lottery.pdf",
    note: "3-2-1 Lotteryのボールの配分、2巡目の順番など",
  },
];

// 現行制度の1位指名の確率(NBA定款・細則 第7.02条。ロッタリー対象の中で成績の低い順)
const CURRENT_ODDS: [string, string][] = [
  ["1番目に成績が低いチーム", "14.0%"],
  ["2番目", "14.0%"],
  ["3番目", "14.0%"],
  ["4番目", "12.5%"],
  ["5番目", "10.5%"],
  ["6番目", "9.0%"],
  ["7番目", "7.5%"],
  ["8番目", "6.0%"],
  ["9番目", "4.5%"],
  ["10番目", "3.0%"],
  ["11番目", "2.0%"],
  ["12番目", "1.5%"],
  ["13番目", "1.0%"],
  ["14番目", "0.5%"],
];

// 3-2-1 Lotteryのボールの配分(NBA Communications、2026年5月28日)
const NEW_BALLS: { group: string; teams: string; balls: string }[] = [
  { group: "プレーオフにもプレーイン・トーナメントにも進めなかったチーム（下の3チームを除く）", teams: "7チーム", balls: "3個" },
  { group: "そのうち成績が最も低い3チーム（ドラフト・レリゲーション）", teams: "3チーム", balls: "2個" },
  { group: "各カンファレンスのプレーイン9位・10位シード", teams: "4チーム", balls: "2個" },
  { group: "各カンファレンスのプレーイン7位対8位の試合の敗者", teams: "2チーム", balls: "1個" },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "ドラフト・ロッタリー（Draft Lottery）",
    description: "1巡目の上位の指名順を、抽選で決める仕組み。成績が低いチームほど当選しやすくなっている。",
  },
  {
    term: "ロッタリー・チーム（Lottery Teams）",
    description: "ロッタリーの抽選に参加するチーム。現行制度ではプレーオフに進めなかった14チーム。",
  },
  {
    term: "プレーイン・トーナメント",
    description: "プレーオフの最後の出場枠を争う大会。3-2-1 Lotteryでは、ここでの順位や結果によってボールの数が変わる。",
  },
  {
    term: "タイブレーク",
    description: "同じ成績のチームの順番を決める方法。NBAではランダムな抽選（ドローイング）で決める。",
  },
  {
    term: "ドラフト・レリゲーション（Draft Relegation）",
    description: "3-2-1 Lotteryで、成績が最も低い3チームのボールを1個減らす仕組み。そのかわり12位より下にはならない。",
  },
  {
    term: "ドラフト指名権",
    description: "NBAドラフトで選手を指名する権利。1巡目・2巡目にあり、トレードの対象にもなる。",
    href: GUIDE_PAGES["ドラフト指名権"],
  },
];

export default function DraftLotteryGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="ドラフト" current="ロッタリー" />
      <GuideTitle subject="NBAドラフト・ロッタリー" />
      <p className="mb-8 text-sm text-muted">
        NBAの定款・細則、NBA.com、NBA Communicationsの公式発表で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "ドラフト・ロッタリーは、プレーオフに進めなかったチームの1巡目の指名順の一部を、抽選で決める制度です。",
            "成績が低いチームほど当選の確率は高くなりますが、最も低いチームでも1位指名が保証されるわけではありません。",
            "2027〜2029年のドラフトでは、対象を16チームに広げた新しい制度「3-2-1 Lottery」が使われます。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な制度の解説です。制度は将来変更される場合があるため、最新の公式発表を確認してください。
        </p>

        {/* 2. ロッタリーとは */}
        <Section kicker="What it is" title="ドラフト・ロッタリーとは">
          <Bullets
            items={[
              <>
                <b>指名順の一部を抽選で決める：</b>NBAドラフトの1巡目は、プレーオフに進めなかったチームが先に指名します。その中の上位の順番を抽選で決めるのが、ドラフト・ロッタリーです。
              </>,
              <>
                <b>成績が低いほど当選しやすい：</b>抽選での当選確率は、レギュラーシーズンの成績が低いチームほど高く設定されています。
              </>,
              <>
                <b>抽選しない範囲は成績順：</b>抽選で決まらない順番は、レギュラーシーズンの成績の低い順に決まります。プレーオフに進んだチームは、そのあとに成績の低い順で指名します。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["ドラフト指名権"]} label="NBAのドラフト指名権とは？（1巡目・2巡目の指名権とトレード）" />
        </Section>

        {/* 3. 現行制度 */}
        <Section kicker="Current system" title="現行の仕組み（2019〜2026年のドラフト）">
          <Bullets
            items={[
              <>
                <b>対象は14チーム：</b>プレーオフに進めなかった14チームが抽選に参加します。
              </>,
              <>
                <b>上位4つを抽選：</b>抽選で決まるのは1〜4位の指名順です。5〜14位は、残ったチームが成績の低い順に入ります。
              </>,
              <>
                <b>抽選の方法：</b>1〜14の番号の付いた14個のボールから4個を引きます。組み合わせは1,001通りあり、そのうち1,000通りが14チームに割り当てられます。
              </>,
              <>
                <b>導入の時期：</b>この仕組みは2017年9月に承認され、2019年のドラフトから使われています。
              </>,
            ]}
          />
          <h3 className="pt-2 font-bold">1位指名の確率（成績の低い順）</h3>
          <div className="grid grid-cols-1 gap-x-6 border border-line px-4 py-2 sm:grid-cols-2">
            {CURRENT_ODDS.map(([rank, odds]) => (
              <div key={rank} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1.5 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
                <span>{rank}</span>
                <b>{odds}</b>
              </div>
            ))}
          </div>
          <p className="text-xs leading-6 text-muted">
            出典：NBAの定款・細則（2018年10月版）第7.02条。同じ成績のチームがある年は、確率が調整されます（下の「タイブレーク」を参照）。
          </p>
        </Section>

        {/* 4. 最下位でも1位とは限らない理由 */}
        <Section kicker="No guarantee" title="成績が最も低くても1位指名が保証されない理由">
          <Bullets
            items={[
              <>
                <b>最も高い確率でも14%：</b>現行制度では、成績が最も低い3チームの1位指名の確率は、いずれも14.0%です。
              </>,
              <>
                <b>上位4つすべてが抽選：</b>1〜4位の順番はすべて抽選で決まるため、成績の低いチームより上のチームが先に当選することがあります。
              </>,
              <>
                <b>最下位でも5位まで下がりうる：</b>上位4つを他のチームが引き当てた場合、成績が最も低いチームでも5位になります。公式には「最も成績が低いチームでも5位より下にはならない」と説明されています。
              </>,
            ]}
          />
        </Section>

        {/* 5. 対象チーム・タイブレーク・プレーイン */}
        <Section kicker="Eligibility & ties" title="対象チーム・タイブレーク・プレーイン・トーナメントとの関係">
          <Bullets
            items={[
              <>
                <b>対象チーム（現行制度）：</b>抽選に参加するのは、プレーオフに進めなかった14チームです。プレーイン・トーナメントで敗れてプレーオフに進めなかったチームも、この14チームに含まれます。
              </>,
              <>
                <b>タイブレーク：</b>レギュラーシーズンの成績が同じチームの順番は、ランダムな抽選（ドローイング）で決まります。
              </>,
              <>
                <b>同じ成績のチームの2巡目：</b>同じ成績のチームの2巡目の順番は、1巡目の順番と逆になります。
              </>,
              <>
                <b>同じ成績のロッタリー・チームの確率：</b>2026年の公式の確率表では、同じ成績の2チームに、本来の2つの順位の確率を合わせた値が、ほぼ半分ずつ割り当てられています。
              </>,
              <>
                <b>3-2-1 Lotteryでのプレーイン：</b>2027年からの新制度では、プレーイン・トーナメントの順位や結果によって、ボールの数が変わります（次の項目を参照）。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 定款では、タイブレークの具体的な手続きはコミッショナーが決めるとされています。詳細は各年の公式発表を参照してください。
          </p>
        </Section>

        {/* 6. 新制度 */}
        <Section kicker="3-2-1 Lottery" title="2027〜2029年のドラフトの新制度「3-2-1 Lottery」">
          <p>
            NBAは2026年5月28日、新しいロッタリー制度「3-2-1 Lottery」を承認しました。<b>2027年、2028年、2029年のドラフト</b>で使われ、上で説明した現行制度とは仕組みが大きく変わります。
          </p>
          <Bullets
            items={[
              <>
                <b>対象を16チームに拡大：</b>ロッタリーの対象が14チームから16チームに広がり、プレーイン・トーナメントのチームも加わります。
              </>,
              <>
                <b>16位まですべて抽選：</b>16チームに割り当てたボールを引いて、1巡目の1〜16位の順番を決めます。
              </>,
              <>
                <b>確率を平らにする：</b>各チームのボールは3個・2個・1個のいずれかで、成績が低いほど有利になる差を小さくしています。
              </>,
            ]}
          />
          <h3 className="pt-2 font-bold">ボールの配分</h3>
          {/* PC: 表 / スマホ: 縦並び */}
          <div className="hidden border border-line sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
                  <th scope="col" className="px-4 py-2.5">チーム</th>
                  <th scope="col" className="w-[110px] px-4 py-2.5 text-right">チーム数</th>
                  <th scope="col" className="w-[120px] px-4 py-2.5 text-right">ボール</th>
                </tr>
              </thead>
              <tbody>
                {NEW_BALLS.map((row) => (
                  <tr key={row.group} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 text-left font-normal text-pretty [word-break:auto-phrase]">{row.group}</th>
                    <td className="px-4 py-3 text-right font-bold">{row.teams}</td>
                    <td className="px-4 py-3 text-right font-bold">{row.balls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="border border-line sm:hidden">
            {NEW_BALLS.map((row) => (
              <div key={row.group} className="border-b border-line px-4 py-3 last:border-b-0">
                <dt>{row.group}</dt>
                <dd className="mt-1 font-bold">
                  {row.teams}・ボール{row.balls}
                </dd>
              </div>
            ))}
          </dl>
          <Bullets
            items={[
              <>
                <b>ドラフト・レリゲーション：</b>成績が最も低い3チームは、勝つことへの動機を高めるためにボールが1個減ります。そのかわり、12位より下にはなりません。ほかのロッタリー・チームは、16位まで下がる可能性があります。
              </>,
              <>
                <b>連続した上位指名の制限：</b>同じチームの指名権が、2年続けて1位、または3年続けてトップ5になることはできません。この制限は、そのチーム自身の指名権に対してかかり、トレードで他のチームが持っている場合も同じです。
              </>,
              <>
                <b>プロテクトの制限：</b>新たにトレードされる指名権に「トップ12〜15」のプロテクトを付けられなくなります。
              </>,
              <>
                <b>2巡目の順番：</b>ロッタリーの16チームは1巡目と逆の順番、それ以外のチームはレギュラーシーズンの成績の低い順で指名します。
              </>,
              <>
                <b>処分の強化：</b>リーグは、意図的に負けるような行為に対して、当選確率の引き下げや指名順の変更、罰金を科す権限を持ちます。
              </>,
              <>
                <b>2030年以降：</b>2030年のドラフト以降の指名順のルールは、オーナー会議（Board of Governors）の投票で決めるとされています。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 3-2-1 Lotteryの順位ごとの確率は、公式資料で例示（Illustrative）として示されているため、このページでは掲載していません。公表されていない詳細は推測で補っていません。
          </p>
        </Section>

        {/* 7. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 8. 公式一次資料 */}
        <OfficialSourcesSection sources={SOURCES} />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
