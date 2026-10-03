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
  title: "NBAの放映権とは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAの放映権を初心者向けに解説します。2025-26シーズンからの全国放映権契約（Disney・NBCUniversal・Amazon）の内容、放映権収入の分配、BRIやサラリーキャップとの関係、球団の放映契約のルールを公式資料をもとに整理しました。",
};

// 解説文は公式資料をもとにした独自の要約で、条文・発表文の転載・全文翻訳ではない。
// 確認した箇所:
//   - NBA Communications(2024年7月24日)：2025-26〜2035-36シーズンの11年契約(Disney・NBCUniversal・Amazon)、各社の主な放送内容、
//     地上波で放送される試合数(約75試合、現行契約の最低15試合から増加)。契約金額は発表文に記載なし
//   - NBA定款・細則(2018年10月版) 細則8.03(a)：全国・ネットワーク・国際のテレビ契約の収入は全球団で均等に分配
//   - NBA定款・細則 細則9.01：球団が結ぶ放映契約に必要な条項(著作権はリーグに帰属、リーグの規則・契約に従う、コミッショナーへの提出と承認)
//   - CBA 第7条(Article VII) Section 1(a)：BRIには試合の放送・配信などから得る収入が含まれる
//   - CBA 101 II.A(2)：サラリーキャップは見込みBRIをもとに計算／IV：選手の取り分はBRIの49〜51%
// 報道ベースの契約総額などの未確認の金額は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "NBA signs new 11-year media agreements with The Walt Disney Company, NBCUniversal and Amazon Prime Video through 2035-36 season",
    publisher: "NBA Communications（pr.nba.com）",
    date: "2024年7月24日公開",
    href: "https://pr.nba.com/nba-walt-disney-company-nbcuniversal-amazon-prime-video-media-agreements/",
    note: "2025-26〜2035-36シーズンの全国放映権契約の内容（契約金額の記載はありません）",
  },
  {
    title: "NBA signs new 11-year media agreements with the Walt Disney Company, NBCUniversal and Amazon Prime Video through 2035-36 season",
    publisher: "NBA.com",
    date: "2024年7月24日公開",
    href: "https://www.nba.com/news/nba-media-agreements-2024",
    note: "同じ発表のNBA.com掲載版",
  },
  {
    title: "National Basketball Association Constitution and By-Laws（PDF・英語）",
    publisher: "NBA",
    date: "2018年10月版",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2018/10/NBA-Constitution-By-Laws-October-2018.pdf",
    note: "細則8.03：テレビ契約の収入の分配／細則9.01：球団の放映契約に必要な条項。NBA公式サイトで公開されている版で、その後の改定は反映されていない可能性があります",
  },
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第7条（Article VII）Section 1(a)：BRI（バスケットボール関連収入）の定義",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "II.A(2)：サラリーキャップの計算／IV：BRIと選手の取り分",
  },
];

// 2024年7月24日のNBA発表にもとづく、各社の主な放送内容(発表時点)
const PARTNERS: { name: string; outlets: string; items: string[] }[] = [
  {
    name: "The Walt Disney Company",
    outlets: "ABC・ESPN",
    items: [
      "レギュラーシーズン：年間80試合（ABCで20試合以上、ESPNで最大60試合）",
      "NBAファイナル（独占）とクリスマスの全5試合",
      "プレーオフ1・2回戦の一部と、11年のうち10年でカンファレンス・ファイナル1シリーズ",
    ],
  },
  {
    name: "NBCUniversal",
    outlets: "NBC・Peacock",
    items: [
      "レギュラーシーズン：年間最大100試合（NBCで50試合以上、Peacockで月曜日の試合など）",
      "オールスター（ライジングスター、オールスター・サタデー、オールスターゲーム）",
      "プレーオフ1・2回戦の一部と、11年のうち6年でカンファレンス・ファイナル1シリーズ",
    ],
  },
  {
    name: "Amazon",
    outlets: "Prime Video",
    items: [
      "レギュラーシーズン：年間66試合（木曜日・金曜日の試合など）",
      "NBAカップの準々決勝以降と、プレーイン・トーナメントの全6試合",
      "プレーオフ1・2回戦の約3分の1と、11年のうち6年でカンファレンス・ファイナル1シリーズ",
    ],
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "放映権（Media rights）",
    description: "試合をテレビや配信で放送・配信する権利。リーグ全体で結ぶ全国・国際向けの契約と、球団が結ぶ契約がある。",
  },
  {
    term: "BRI（Basketball Related Income）",
    description: "放映権料やチケット収入など、NBAのバスケットボール関連収入。選手の取り分やサラリーキャップの計算のもとになる。",
    href: GUIDE_PAGES["サラリーキャップ"],
  },
  {
    term: "Revenue Sharing",
    description: "チーム間の収益分配の仕組み。全国向けのテレビ契約の収入の均等分配とは別の制度。",
    href: GUIDE_PAGES["Revenue Sharing"],
  },
  {
    term: "NBA League Pass",
    description: "NBAの試合を配信で視聴できるNBAのサービス。新しい契約では、Amazonが外部の配信先の一つになる。",
  },
];

export default function MediaRightsGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="NBAビジネス" current="放映権" />
      <GuideTitle subject="NBAの放映権" />
      <p className="mb-8 text-sm text-muted">
        NBAの公式発表、NBAの定款・細則、労使協定（CBA）、NBAが作成した労使協定の要点まとめ（CBA 101）で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "放映権は、試合をテレビや配信で放送・配信する権利で、NBAの大きな収入源の一つです。",
            "NBAは2024年7月、2025-26シーズンから2035-36シーズンまでの11年間、Disney・NBCUniversal・Amazonと全国向けの放映権契約を結んだと発表しました。",
            "全国・国際向けのテレビ契約の収入は全球団で均等に分けられ、放映権収入はサラリーキャップの計算のもとになるBRIにも含まれます。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な解説です。契約の金額は、NBAの公式発表では公表されていないため掲載していません。契約内容は発表時点のもので、変更される場合があります。
        </p>

        {/* 2. 放映権とは */}
        <Section kicker="What it is" title="放映権とは">
          <Bullets
            items={[
              <>
                <b>試合を放送・配信する権利：</b>NBAの試合を、テレビ、ラジオ、インターネットなどで放送・配信する権利です。
              </>,
              <>
                <b>リーグが結ぶ契約：</b>全国向け・国際向けの放映権は、リーグが放送局や配信サービスと契約を結びます。
              </>,
              <>
                <b>球団が結ぶ契約：</b>球団も、自分の試合の放映について契約を結ぶことがあります。その契約は、リーグの規則やリーグが結んだ契約に従う必要があります（下の項目を参照）。
              </>,
            ]}
          />
        </Section>

        {/* 3. 2025-26からの契約 */}
        <Section kicker="2025-26 to 2035-36" title="2025-26シーズンからの全国放映権契約">
          <p>
            NBAは2024年7月24日、2025-26シーズンから2035-36シーズンまでの<b>11年間</b>の放映権契約を発表しました。Disneyとの契約を更新し、新たにNBCUniversal、Amazonと契約を結んでいます。
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {PARTNERS.map((p) => (
              <div key={p.name} className="border border-line px-4 py-3">
                <p className="font-bold [word-break:auto-phrase]">{p.name}</p>
                <p className="mb-2 text-xs font-bold text-blue">{p.outlets}</p>
                <ul className="space-y-1.5 text-pretty [word-break:auto-phrase]">
                  {p.items.map((item) => (
                    <li key={item} className="pl-[1em] -indent-[1em]">
                      ・{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Bullets
            items={[
              <>
                <b>地上波での放送が増える：</b>レギュラーシーズンで地上波（Broadcast TV）で放送される試合は、毎シーズン約75試合になると発表されています（それまでの契約では最低15試合）。
              </>,
              <>
                <b>配信サービスでの視聴：</b>全国向けの試合は、Prime Video、Peacock、ESPNの配信サービスで視聴できるようになると発表されています。
              </>,
              <>
                <b>国際向けの配信：</b>3社は、それぞれ一部の国・地域での配信も担います。Amazonは、NBA League Passの外部の配信先の一つにもなります。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 内容は2024年7月24日のNBAの発表にもとづく概要です。試合数は「約」「最大」などの表現を含みます。この発表では、契約金額は公表されていません。
          </p>
        </Section>

        {/* 4. 収入の分配とBRI */}
        <Section kicker="Revenue" title="放映権収入の分配とサラリーキャップとの関係">
          <Bullets
            items={[
              <>
                <b>全球団で均等に分配：</b>NBAの細則では、ネットワーク・全国・国際向けのテレビ契約から得る収入は、全球団で均等に分けると定められています。
              </>,
              <>
                <b>BRIに含まれる：</b>CBAでは、試合の放送・配信などから得る収入は、BRI（バスケットボール関連収入）に含まれると定められています。
              </>,
              <>
                <b>選手の取り分とサラリーキャップ：</b>選手全体の報酬はBRIの49〜51%の範囲に設定され、サラリーキャップは、その年度の見込みBRIをもとに計算されます。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ"]} label="NBAサラリーキャップとは？（BRIとキャップの計算）" />
          <RelatedGuideLink href={GUIDE_PAGES["Revenue Sharing"]} label="NBAのRevenue Sharingとは？（チーム間の収益分配）" />
        </Section>

        {/* 5. 球団の放映契約のルール */}
        <Section kicker="Team contracts" title="球団が結ぶ放映契約のルール">
          <p>NBAの細則では、球団が自分の試合の放映について結ぶ契約に、次の内容を入れるよう定められています。</p>
          <Bullets
            items={[
              <>
                <b>著作権はリーグに：</b>放映される試合の著作権は、リーグ（NBA）が持ちます。
              </>,
              <>
                <b>リーグの規則・契約に従う：</b>球団の契約は、NBAの定款・細則や規則、リーグが結んだ放映契約に従います。
              </>,
              <>
                <b>コミッショナーへの提出：</b>契約はコミッショナーに提出され、定められた条件を満たさない場合は、コミッショナーが承認しないことができます。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ NBAの定款・細則は、NBA公式サイトで公開されている2018年10月版で確認しました。その後の改定は反映されていない可能性があります。
          </p>
        </Section>

        {/* 6. 関連ガイド */}
        <Section kicker="Related" title="関連ガイド">
          <p>NBAのビジネスに関する、ほかのガイドも参考にしてください。</p>
          <RelatedGuideLink href={GUIDE_PAGES["NBAオーナー"]} label="NBAのオーナーとは？（オーナー会議・オーナーの変更）" />
          <RelatedGuideLink href={GUIDE_PAGES["チーム資産価値"]} label="NBAのチーム資産価値とは？（推計値の見方）" />
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
