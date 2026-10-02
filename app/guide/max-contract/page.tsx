import type { Metadata } from "next";
import type { ReactNode } from "react";
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
  title: "NBAのMAX契約とは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのMAX契約（最高年俸）が、サラリーキャップに対する割合と在籍年数で決まる仕組み、契約年数・昇給率、元のチームとの再契約と他チームとの契約の違いを初心者向けに解説します。",
};

// 解説文は CBA と NBA作成の「CBA 101」をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所:
//   - CBA 第2条(Article II) Section 7「Maximum Annual Salary」/ 第1条の Years of Service の定義
//   - CBA 101 II.G(1) 最高年俸(25%・30%・35%、105%の規定、上位の上限)、G(3) 昇給・減額、G(4) 契約年数
// 個別選手の例、年俸の金額(推計を含む)、CBA 101 に無い細かな例外は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第2条（Article II）Section 7：最高年俸（Maximum Annual Salary）／第1条：Years of Service（在籍年数）の定義",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "II.G「Contract Structure Rules」：最高年俸の区分、元のチームとの契約での上位の上限、昇給率、契約年数",
  },
];

// 在籍年数ごとの最高年俸(1年目の年俸の上限)
const MAX_BY_SERVICE: { years: string; percent: string }[] = [
  { years: "0〜6年", percent: "サラリーキャップの25%" },
  { years: "7〜9年", percent: "サラリーキャップの30%" },
  { years: "10年以上", percent: "サラリーキャップの35%" },
];

// 1年目の年俸を100としたときの、毎年の昇給の上限(1年目の年俸に対する割合で毎年同じ額ずつ上がる)
const RAISE_TABLE: { year: string; eight: string; five: string }[] = [
  { year: "1年目", eight: "100", five: "100" },
  { year: "2年目", eight: "108", five: "105" },
  { year: "3年目", eight: "116", five: "110" },
  { year: "4年目", eight: "124", five: "115" },
  { year: "5年目", eight: "132", five: "—（最長4年）" },
];

// 元のチームとの再契約と、他チームとの契約の違い
const TEAM_COMPARISON: { item: string; own: ReactNode; other: ReactNode }[] = [
  {
    item: "最高年俸（原則）",
    own: "在籍年数に応じて25%・30%・35%",
    other: "在籍年数に応じて25%・30%・35%（原則は同じ）",
  },
  {
    item: "上位の上限",
    own: "条件を満たせば、4年目終了時の30%や、7〜9年目の35%といった上位の上限を使える場合がある",
    other: "使えない（元のチームとの契約だけの仕組み）",
  },
  {
    item: "昇給の上限",
    own: "Bird権・Early Bird権を使う再契約は、1年目の年俸の8%ずつ",
    other: "1年目の年俸の5%ずつ",
  },
  {
    item: "最長の契約年数",
    own: "Bird権を使う再契約は5年",
    other: "キャップスペースなどを使う契約は4年",
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "Years of Service（在籍年数）",
    description:
      "NBAでの経験年数。レギュラーシーズン中に1日以上、アクティブまたはインアクティブのロスターに入っていたシーズンを1年と数える（1シーズンにつき最大1年）。",
  },
  {
    term: "最高年俸（Maximum Annual Salary）",
    description: "契約の1年目に払える年俸の上限。サラリーキャップに対する割合で決まる。2年目以降は昇給のルールで決まる。",
  },
  {
    term: "Bird Rights / Early Bird Rights",
    description:
      "元のチームが、自チームのFA選手とキャップを超えていても再契約できる権利。この権利で再契約すると、昇給の上限が8%になる。",
  },
  {
    term: "Higher Max Criteria",
    description:
      "上位の上限を使うための成績条件。直前のシーズン（または直近3シーズンのうち2シーズン）にオールNBAチームか最優秀守備選手に選ばれる、または直近3シーズンのいずれかでMVPに選ばれること。",
  },
  {
    term: "Rookie Scale Extension",
    description: "ドラフト1巡目で入団した選手が、ルーキー契約の期間中に元のチームと結ぶ延長契約。",
  },
  {
    term: "Designated Veteran Player Extension / Contract",
    description:
      "一定の条件を満たす7〜9年目の選手が元のチームと結ぶ延長契約・再契約で、1年目の年俸の上限が35%になる。",
  },
  {
    term: "サラリーキャップ",
    description: "1チームが選手に払う年俸総額の基準となる上限。MAX契約の上限額は、この金額に対する割合で決まる。",
    href: GUIDE_PAGES["サラリーキャップ"],
  },
];

export default function MaxContractGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="契約" current="MAX契約" />
      <GuideTitle subject="NBAのMAX契約" />
      <p className="mb-8 text-sm text-muted">
        労使協定（CBA）と、NBAが作成した労使協定の要点まとめ（CBA 101）で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "MAX契約は、ルール上もっとも高い年俸で結ぶ契約のことです。",
            "上限の金額は決まった額ではなく、サラリーキャップに対する割合（25%・30%・35%）で決まり、在籍年数が長いほど割合が高くなります。",
            "元のチームがBird権を使って再契約する場合は、契約年数や昇給の上限が他チームとの契約より有利になります。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な制度の解説です。個別の契約には、ここで扱っていない例外や条件があります。実際の契約内容は、各契約の公式な情報で確認してください。
        </p>

        {/* 2. MAX契約の仕組み */}
        <Section kicker="How it works" title="MAX契約はサラリーキャップの割合で決まる">
          <Bullets
            items={[
              <>
                <b>上限は「1年目の年俸」にかかる：</b>最高年俸のルールは、契約の1年目（延長契約なら延長部分の1年目）の年俸に適用されます。2年目以降は、昇給のルールの範囲で決まります。
              </>,
              <>
                <b>金額ではなく割合で決まる：</b>上限は「サラリーキャップの○%」という形で決まります。CBAでは、契約を結んだ時点のサラリーキャップが基準になると定められています。そのため、キャップが上がれば、同じ割合でも上限の金額は上がります。
              </>,
              <>
                <b>前の契約の年俸が高い場合：</b>前の契約の最終シーズンの年俸の105%が、割合で決まる上限より大きい場合は、その105%が上限になります。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ"]} label="NBAサラリーキャップとは？（2026-27シーズンの金額・基本の仕組み）" />
        </Section>

        {/* 3. 在籍年数と上限 */}
        <Section kicker="Years of service" title="在籍年数と上限の割合（25%・30%・35%）">
          <p>原則となる上限は、選手の在籍年数（Years of Service）によって3つに分かれます。</p>
          {/* PC: 表 / スマホ: 縦並び */}
          <div className="hidden border border-line sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
                  <th scope="col" className="px-4 py-2.5">在籍年数</th>
                  <th scope="col" className="px-4 py-2.5 text-right">1年目の年俸の上限</th>
                </tr>
              </thead>
              <tbody>
                {MAX_BY_SERVICE.map((row) => (
                  <tr key={row.years} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 text-left font-bold">{row.years}</th>
                    <td className="px-4 py-3 text-right font-bold">{row.percent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="border border-line sm:hidden">
            {MAX_BY_SERVICE.map((row) => (
              <div key={row.years} className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <dt className="font-bold">{row.years}</dt>
                <dd className="font-bold">{row.percent}</dd>
              </div>
            ))}
          </dl>
          <Bullets
            items={[
              "在籍年数は、レギュラーシーズン中に1日以上NBAのロスター（アクティブまたはインアクティブ）に入っていたシーズンを1年として数えます。",
              "経験を積んだ選手ほど、上限の割合が高くなる仕組みです。",
            ]}
          />
        </Section>

        {/* 4. 元のチームとの契約での上位の上限 */}
        <Section kicker="Higher maximum" title="元のチームとの契約で認められる上位の上限">
          <p>
            原則の割合より高い上限が認められるのは、<b>元のチームとの延長契約・再契約</b>で、成績や在籍の条件を満たす場合に限られます。
          </p>
          <Bullets
            items={[
              <>
                <b>4年目を終えた選手：</b>ルーキー契約の延長、または元のチームとFAとして再契約する場合、Higher Max Criteria（オールNBAチーム・最優秀守備選手・MVPなどの選出条件）を満たせば、上限が25%から30%に上がります。
              </>,
              <>
                <b>7〜9年目の選手：</b>Higher Max Criteriaを満たし、最初の4年間に移籍していない（トレードによる移籍は除く）などの条件のもとで、元のチームと決められた年数の延長契約・再契約を結ぶ場合、上限が35%になります（Designated Veteran Player Extension / Contract）。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 対象となる在籍年数や契約年数、成績の条件には細かな決まりがあります。詳細な条件は公式CBA・CBA 101を参照してください。
          </p>
        </Section>

        {/* 5. 契約年数と昇給率 */}
        <Section kicker="Length & raises" title="契約年数と昇給率">
          <h3 className="font-bold">最長の契約年数</h3>
          <Bullets
            items={[
              "元のチームがBird権を使って再契約する場合：最長5年",
              "キャップスペースを使う契約や、Early Bird権・Non-Bird権を使う再契約など：最長4年",
              "延長契約は、ルーキー契約の延長とDesignated Veteran Player Extensionが最長6年、その他の延長が最長5年（元の契約の残り年数を含む）",
            ]}
          />

          <h3 className="pt-2 font-bold">昇給の上限</h3>
          <Bullets
            items={[
              "2年目以降の年俸は、1年目の年俸の一定割合までしか増減できません。",
              "元のチームがBird権・Early Bird権を使う再契約と延長契約：1年目の年俸の8%まで（サイン・アンド・トレードなどの場合を除く）",
              "それ以外の契約（他チームとの契約など）：1年目の年俸の5%まで",
            ]}
          />
          <p>昇給は「1年目の年俸の○%」の額ずつ毎年増やせるため、最大まで上げた場合の年俸は次のように推移します。</p>
          <div className="border border-line">
            <table className="w-full border-collapse text-sm">
              <caption className="border-b border-line px-4 py-2 text-left text-xs text-muted">
                1年目の年俸を100としたときの、毎年の年俸の上限
              </caption>
              <thead>
                <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
                  <th scope="col" className="px-3 py-2.5 sm:px-4">契約年</th>
                  <th scope="col" className="px-3 py-2.5 text-right sm:px-4">8%の場合</th>
                  <th scope="col" className="px-3 py-2.5 text-right sm:px-4">5%の場合</th>
                </tr>
              </thead>
              <tbody>
                {RAISE_TABLE.map((row) => (
                  <tr key={row.year} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-3 py-2.5 text-left font-bold sm:px-4">{row.year}</th>
                    <td className="px-3 py-2.5 text-right font-bold sm:px-4">{row.eight}</td>
                    <td className="px-3 py-2.5 text-right font-bold sm:px-4">{row.five}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs leading-6 text-muted">
            ※ 年俸の金額ではなく、1年目を100とした比率です。5%の契約の多くは最長4年のため、5年目は空欄にしています。
          </p>
        </Section>

        {/* 6. 元のチームと他チームの違い */}
        <Section kicker="Own team vs. new team" title="所属チームとの再契約と、他チームとの契約の違い">
          <p>
            上限の割合そのものは原則として同じですが、<b>元のチームとの再契約のほうが、総額を大きくしやすい</b>仕組みになっています。
          </p>
          {/* PC: 表 / スマホ: 縦並び */}
          <div className="hidden border border-line sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
                  <th scope="col" className="w-[170px] px-4 py-2.5">項目</th>
                  <th scope="col" className="px-4 py-2.5">元のチームとの再契約</th>
                  <th scope="col" className="px-4 py-2.5">他チームとの契約</th>
                </tr>
              </thead>
              <tbody>
                {TEAM_COMPARISON.map((row) => (
                  <tr key={row.item} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 text-left align-top font-bold">{row.item}</th>
                    {/* 単語の途中で改行しないよう、文節の区切りで折り返す */}
                    <td className="px-4 py-3 align-top text-pretty [word-break:auto-phrase]">{row.own}</td>
                    <td className="px-4 py-3 align-top text-pretty [word-break:auto-phrase]">{row.other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="border border-line sm:hidden">
            {TEAM_COMPARISON.map((row) => (
              <div key={row.item} className="border-b border-line px-4 py-3 last:border-b-0">
                <dt className="font-bold">{row.item}</dt>
                <dd className="mt-1">
                  <span className="text-xs font-bold text-muted">元のチーム：</span>
                  {row.own}
                </dd>
                <dd className="mt-1">
                  <span className="text-xs font-bold text-muted">他チーム：</span>
                  {row.other}
                </dd>
              </div>
            ))}
          </dl>
          <Bullets
            items={[
              "契約年数が長く、昇給の上限も高いため、同じ1年目の年俸でも、元のチームとの再契約のほうが契約総額の上限は大きくなります。",
              "上位の上限（30%・35%）は元のチームとの契約に限られるため、条件を満たす選手にとっては、元のチームが提示できる上限のほうが高くなる場合があります。",
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ Bird権の有無、サイン・アンド・トレード、延長契約かどうかなどで適用されるルールが変わります。詳細な条件は公式CBA・CBA 101を参照してください。
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
