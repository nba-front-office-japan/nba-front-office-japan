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
  title: "NBAのオーナーとは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのオーナー（球団の所有者）を初心者向けに解説します。オーナー会議（Board of Governors）、コミッショナーとの関係、オーナーの変更（持分の譲渡）に必要な承認、利益相反や本拠地移転のルールを、NBAの定款・細則をもとに整理しました。",
};

// 解説文は公式資料をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所(すべてNBA定款・細則 2018年10月版):
//   - Interpretation(8)(9)(12)：Member・Membership・Ownerの定義
//   - 第3条：利益相反(他球団での役職・持分の禁止。承認を受けた場合と、公開市場で取引される証券の1%未満を除く)
//   - 第5条：持分の譲渡(大きさにかかわらず対象、コミッショナーの調査、全Governorの3/4以上の賛成。
//     5%超10%未満は委員会、5%以下はコミッショナーが承認できる場合がある)
//   - 第7条：本拠地の移転(申請、移転委員会の調査、全球団の過半数の賛成)
//   - 第18条：オーナー会議(Board of Governors)の構成
//   - 第24条：コミッショナー(全Governorの3/4以上の賛成で選任、最高経営責任者)
// 特定のオーナー・チーム・売却事例・金額・推測・評価は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "National Basketball Association Constitution and By-Laws（PDF・英語）",
    publisher: "NBA",
    date: "2018年10月版",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2018/10/NBA-Constitution-By-Laws-October-2018.pdf",
    note: "Interpretation：用語の定義／第3条：利益相反／第5条：持分の譲渡／第7条：本拠地の移転／第18条：オーナー会議／第24条：コミッショナー。NBA公式サイトで公開されている版で、その後の改定は反映されていない可能性があります",
  },
];

const TRANSFER_STEPS: [string, string][] = [
  ["申請", "譲渡について合意したら、球団がコミッショナーに書面で承認を申請します。"],
  ["調査", "コミッショナーは、譲渡の内容や譲り受ける人・会社などについて、必要な情報を求めて調査します。"],
  ["承認", "調査のあと、オーナー会議にかけられ、全Governorの4分の3以上の賛成で承認されると、譲渡が有効になります。"],
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "Member（メンバー）",
    description: "NBAから、リーグで球団を運営する権利（Membership）を与えられた個人や会社。",
  },
  {
    term: "Owner（オーナー）",
    description: "Memberと、Memberやその権利の持分を直接・間接に持つ、または実質的に支配するすべての個人や会社。",
  },
  {
    term: "オーナー会議（Board of Governors）",
    description: "各球団の代表（Governor）で構成される会議。リーグの運営を全体として監督する。",
  },
  {
    term: "コミッショナー（Commissioner）",
    description: "リーグの最高経営責任者。オーナー会議で、全Governorの4分の3以上の賛成で選ばれる。",
  },
];

export default function OwnersGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="NBAビジネス" current="NBAオーナー" />
      <GuideTitle subject="NBAのオーナー" />
      <p className="mb-8 text-sm text-muted">
        NBAの定款・細則（Constitution and By-Laws）で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "NBAのオーナーは、リーグで球団を運営する権利（Membership）を持つ個人や会社と、その持分を持つ人たちのことです。",
            "各球団は代表（Governor）をオーナー会議に送り、オーナー会議はリーグの運営を監督し、コミッショナーを選びます。",
            "球団の持分の譲渡（オーナーの変更）には、原則としてコミッショナーの調査とオーナー会議の承認が必要です。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な解説です。NBAの定款・細則は、NBA公式サイトで公開されている2018年10月版で確認しました。その後の改定は反映されていない可能性があるため、最新の公式発表を確認してください。
        </p>

        {/* 2. オーナーとは */}
        <Section kicker="Who they are" title="NBAのオーナーとは">
          <Bullets
            items={[
              <>
                <b>球団を運営する権利：</b>NBAでは、リーグで球団を運営する権利などを「Membership」と呼び、その権利を与えられた個人や会社を「Member」と呼びます。
              </>,
              <>
                <b>オーナーは1人とは限らない：</b>定款では、Memberに加えて、Memberやその権利の持分を直接・間接に持つ人や会社、実質的に支配する人や会社も「Owner」とされています。
              </>,
              <>
                <b>リーグのルールに従う：</b>持分を譲り受ける人や会社は、NBAの定款・細則や規則に従うことに同意する必要があります。
              </>,
            ]}
          />
        </Section>

        {/* 3. オーナー会議 */}
        <Section kicker="Board of Governors" title="オーナー会議（Board of Governors）">
          <Bullets
            items={[
              <>
                <b>リーグの運営を監督：</b>リーグの運営は、オーナー会議を通じて、各球団（Member）が全体として監督します。
              </>,
              <>
                <b>各球団の代表（Governor）：</b>各球団は、オーナー、または球団の役員・権限を与えられた従業員の中から、代表のGovernorを1人選びます。代理（Alternate Governor）も3人まで届け出られます。
              </>,
              <>
                <b>選手は代表になれない：</b>選手は、GovernorやAlternate Governorになることも、オーナー会議で投票することもできません。
              </>,
            ]}
          />
        </Section>

        {/* 4. コミッショナーとの関係 */}
        <Section kicker="Commissioner" title="コミッショナーとの関係">
          <Bullets
            items={[
              <>
                <b>オーナー会議が選ぶ：</b>コミッショナーは、全Governorの4分の3以上の賛成で選ばれ、同じく4分の3以上の賛成で任期を終わらせることもできます。
              </>,
              <>
                <b>リーグの最高経営責任者：</b>コミッショナーはリーグの最高経営責任者として、リーグの業務全体を監督し、リーグに悪い影響を与えうる事柄を調査する権限を持ちます。
              </>,
              <>
                <b>利害関係の禁止：</b>コミッショナーは、プロスポーツに直接・間接の金銭的な利害関係を持つことができません。
              </>,
            ]}
          />
        </Section>

        {/* 5. オーナーの変更 */}
        <Section kicker="Ownership transfers" title="オーナーの変更（持分の譲渡）に必要な手続き">
          <p>
            球団の持分は、<b>大きさにかかわらず</b>、定款の定めに従わなければ売却・譲渡などができません。主な流れは次のとおりです。
          </p>
          <ol className="space-y-3">
            {TRANSFER_STEPS.map(([title, text], i) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center bg-navy text-xs font-bold text-white">{i + 1}</span>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="text-pretty text-muted [word-break:auto-phrase]">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <Bullets
            items={[
              <>
                <b>小さな持分の場合：</b>5%を超え10%未満の持分は委員会が、5%以下の持分はコミッショナーが、オーナー会議にかけずに承認できる場合があります。
              </>,
              <>
                <b>ただし例外：</b>承認を受けていない人が10%以上の持分を持つことになる場合や、球団の実質的な支配者が変わる場合などは、この簡略な承認の対象になりません。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">※ 細かな条件や例外は、このページでは扱っていません。正確な条件は下の公式資料を確認してください。</p>
        </Section>

        {/* 6. その他のルール */}
        <Section kicker="Other rules" title="利益相反・本拠地の移転のルール">
          <Bullets
            items={[
              <>
                <b>他球団の持分・役職：</b>オーナーやその役員・従業員などは、承認を受けた場合などを除き、他の球団の役職に就いたり、他の球団の持分を持ったりすることはできません（公開市場で取引される証券の1%未満の保有などは例外）。
              </>,
              <>
                <b>本拠地の移転：</b>球団が本拠地や本拠地の試合会場を移すには、コミッショナーへの申請と移転委員会による調査を経て、全球団の過半数の賛成で承認される必要があります。
              </>,
            ]}
          />
        </Section>

        {/* 7. 関連ページ */}
        <Section kicker="Related" title="関連ガイド・関連ページ">
          <p>
            オーナー個人の資産と、チームの資産価値は別のものです。当サイトの<Link href="/rankings/owner-net-worth" className="font-semibold text-blue hover:underline">オーナー純資産ランキング</Link>は、メディアによる個人の推定純資産で、本人・チームの公式発表ではありません。
          </p>
          <RelatedGuideLink href={GUIDE_PAGES["チーム資産価値"]} label="NBAのチーム資産価値とは？（推計値の見方）" />
          <RelatedGuideLink href={GUIDE_PAGES["放映権"]} label="NBAの放映権とは？（全国放映権契約・収入の分配）" />
        </Section>

        {/* 8. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 9. 公式一次資料 */}
        <OfficialSourcesSection sources={SOURCES} />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
