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
  title: "NBAのチーム資産価値とは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのチーム資産価値（球団の価値）を初心者向けに解説します。公式の資産価値はなく、報道される数字はメディアの推計であること、球団の事業に関わる主な制度（収入の分配、商圏、オーナーの変更、本拠地の移転）を公式資料をもとに整理しました。",
};

// 解説文は公式資料をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所:
//   - NBA定款・細則(2018年10月版)：Interpretation(Membershipの定義)、第5条(持分の譲渡)、第7条(本拠地の移転)、
//     第10条(Territory=本拠地の市から75エアマイルの範囲など)、細則8.03(全国・国際向けテレビ契約の収入を均等に分配、
//     レギュラーシーズンの入場料収入はビジターに分配しない)
//   - CBA 第7条(Article VII) Section 1(a)：BRI／CBA 101 IV：選手の取り分はBRIの49〜51%
// 確認したCBA・定款には、球団の資産価値を定める仕組みはない。報道される数字はメディアの推計として扱う。
// 価値を左右する要因の推測、特定のチーム・売却事例・金額・評価は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "National Basketball Association Constitution and By-Laws（PDF・英語）",
    publisher: "NBA",
    date: "2018年10月版",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2018/10/NBA-Constitution-By-Laws-October-2018.pdf",
    note: "Interpretation：Membershipの定義／第5条：持分の譲渡／第7条：本拠地の移転／第10条：Territory／細則8.03：テレビ契約の収入と入場料収入。NBA公式サイトで公開されている版で、その後の改定は反映されていない可能性があります",
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
    note: "IV：BRIと選手の取り分",
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "チーム資産価値（Team valuation）",
    description: "球団を一つの資産として見たときの価値。NBAによる公式の値はなく、報道される数字はメディアの推計。",
  },
  {
    term: "Membership",
    description: "NBAが球団に与える、リーグで球団を運営する権利など。",
    href: GUIDE_PAGES["NBAオーナー"],
  },
  {
    term: "Territory（テリトリー）",
    description: "各球団の商圏として定款で決められた範囲。原則として本拠地の市から75エアマイル以内。",
  },
  {
    term: "BRI（Basketball Related Income）",
    description: "放映権料やチケット収入など、NBAのバスケットボール関連収入。選手の取り分やサラリーキャップの計算のもとになる。",
    href: GUIDE_PAGES["サラリーキャップ"],
  },
  {
    term: "Revenue Sharing",
    description: "チーム間の収益分配の仕組み。",
    href: GUIDE_PAGES["Revenue Sharing"],
  },
];

export default function TeamValueGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="NBAビジネス" current="チーム資産価値" />
      <GuideTitle subject="NBAのチーム資産価値" />
      <p className="mb-8 text-sm text-muted">
        NBAの定款・細則、労使協定（CBA）、NBAが作成した労使協定の要点まとめ（CBA 101）で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "チーム資産価値は、球団を一つの資産として見たときの価値のことです。",
            "NBAが公式に定める資産価値はなく、ニュースなどで見る数字は、メディアがそれぞれの方法で出した推計です。",
            "球団の事業には、収入の分配、商圏（テリトリー）、オーナーの変更や本拠地の移転の承認など、リーグの制度が関わっています。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な解説です。特定のチームの価値や売却価格、価値の予測は扱っていません。推計値は出典や時期によって異なります。
        </p>

        {/* 2. とは */}
        <Section kicker="What it is" title="チーム資産価値とは">
          <Bullets
            items={[
              <>
                <b>球団を資産として見た価値：</b>球団（リーグで球団を運営する権利と、その事業）を一つの資産として見たときの価値を指して使われる言葉です。
              </>,
              <>
                <b>公式の値はない：</b>確認したCBAやNBAの定款・細則には、球団の資産価値を定めたり、公表したりする仕組みはありません。
              </>,
              <>
                <b>報道される数字は推計：</b>ニュースなどで見る資産価値の数字は、メディアが独自の方法で出した推計で、NBAや各チームの公式発表ではありません。
              </>,
            ]}
          />
        </Section>

        {/* 3. 推計値の見方 */}
        <Section kicker="Reading estimates" title="推計値を見るときの注意点">
          <Bullets
            items={[
              <>
                <b>出典を確認する：</b>どのメディアの、いつ公表された推計かによって、数字は異なります。
              </>,
              <>
                <b>売却価格とは別：</b>推計値は、実際に球団の持分が売買された価格そのものではありません。
              </>,
              <>
                <b>オーナーの資産とも別：</b>オーナー個人の推定資産は、チームの資産価値とは別の指標です。
              </>,
            ]}
          />
          <p>
            当サイトの<Link href="/rankings/team-valuations" className="font-semibold text-blue hover:underline">チーム資産価値ランキング</Link>も、メディアによる推計を出典とともに掲載しているもので、NBA・各チームの公式発表ではありません。
          </p>
        </Section>

        {/* 4. 球団の事業に関わる制度 */}
        <Section kicker="League rules" title="球団の事業に関わる主な制度">
          <p>球団の事業には、NBAの定款・細則や労使協定で決められた、次のような制度が関わっています。</p>
          <Bullets
            items={[
              <>
                <b>テレビ契約の収入の分配：</b>ネットワーク・全国・国際向けのテレビ契約から得る収入は、全球団で均等に分けられます。
              </>,
              <>
                <b>入場料収入：</b>レギュラーシーズンの試合の入場料収入は、ビジターの球団には分けられません。
              </>,
              <>
                <b>商圏（テリトリー）：</b>各球団の商圏は、原則として本拠地の市から75エアマイル以内とされ、他の球団は、その球団の同意なしにそこで試合をすることはできません。
              </>,
              <>
                <b>選手の取り分：</b>選手全体の報酬は、BRI（バスケットボール関連収入）の49〜51%の範囲に設定されます。
              </>,
              <>
                <b>オーナーの変更・本拠地の移転：</b>球団の持分の譲渡や本拠地の移転には、リーグの調査と承認が必要です。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ これらは制度の紹介で、資産価値への影響の大きさを示すものではありません。NBAの定款・細則は、NBA公式サイトで公開されている2018年10月版で確認しました。
          </p>
          <RelatedGuideLink href={GUIDE_PAGES["Revenue Sharing"]} label="NBAのRevenue Sharingとは？（チーム間の収益分配）" />
        </Section>

        {/* 5. 関連ガイド */}
        <Section kicker="Related" title="関連ガイド">
          <p>NBAのビジネスに関する、ほかのガイドも参考にしてください。</p>
          <RelatedGuideLink href={GUIDE_PAGES["放映権"]} label="NBAの放映権とは？（全国放映権契約・収入の分配）" />
          <RelatedGuideLink href={GUIDE_PAGES["NBAオーナー"]} label="NBAのオーナーとは？（オーナー会議・オーナーの変更）" />
        </Section>

        {/* 6. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 7. 公式一次資料 */}
        <OfficialSourcesSection sources={SOURCES} />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
