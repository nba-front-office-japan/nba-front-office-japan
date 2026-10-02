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
  title: "NBAのミニマム契約とは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのミニマム契約（最低年俸での契約）とは何か、最低年俸が在籍年数で変わる仕組み、キャップを超えたチームでも使える例外、ベテランの1年契約でのキャップ上の扱いを初心者向けに解説します。",
};

// 解説文は CBA と NBA作成の「CBA 101」をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所:
//   - CBA 第2条(Article II) Section 6「Minimum Player Salary」/ 第7条(Article VII) Section 6(i)「Minimum Player Salary Exception」
//   - CBA 101 II.G(2) 最低年俸、II.B(2)(g) Minimum Salary Exception、II.B(2)(j) 日割り、II.G(4) 契約年数、II.K(5) 1年のミニマム契約
// 最低年俸の金額表は、CBA 101 に載っているのが2024-25シーズンの表で、2026-27シーズンの公式の表は確認できないため掲載しない。
// 個別選手の例、推測の金額、未確認の例外は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第2条（Article II）Section 6：最低年俸／第7条（Article VII）Section 6(i)：Minimum Player Salary Exception",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "最低年俸と在籍年数、Minimum Salary Exception、日割り、契約年数、1年のミニマム契約の払い戻しとキャップ上の扱い",
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "最低年俸（Minimum Player Salary）",
    description: "契約で各シーズンに必ず支払わなければならない年俸の下限。選手の在籍年数によって金額が変わる。",
  },
  {
    term: "Minimum Player Salary Exception",
    description:
      "キャップを超えたチームでも、最低年俸で最長2シーズンの契約を結べる例外。1〜2年のミニマム契約の選手をトレードなどで獲得するのにも使える。",
  },
  {
    term: "Years of Service（在籍年数）",
    description:
      "NBAでの経験年数。レギュラーシーズン中に1日以上、アクティブまたはインアクティブのロスターに入っていたシーズンを1年と数える（1シーズンにつき最大1年）。",
  },
  {
    term: "Team Salary（チームの年俸総額）",
    description: "サラリーキャップなどの判定に使う、チームの年俸の合計。ベテランの1年のミニマム契約では、選手の年俸の一部だけが入る。",
  },
  {
    term: "10日契約・シーズン残り契約",
    description: "シーズン途中の短期間の契約。最低年俸は、契約がカバーするレギュラーシーズンの日数に応じて日割りになる。",
  },
  {
    term: "最低総年俸（Minimum Team Salary）",
    description: "チーム全体の年俸総額の下限。選手1人ごとの最低年俸とは別の仕組み。",
  },
  {
    term: "MAX契約",
    description: "ルール上もっとも高い年俸で結ぶ契約。上限はサラリーキャップに対する割合で決まる。",
    href: GUIDE_PAGES["MAX契約"],
  },
  {
    term: "サラリーキャップ",
    description: "1チームが選手に払う年俸総額の基準となる上限。例外を使えば超えて契約できるソフトキャップ。",
    href: GUIDE_PAGES["サラリーキャップ"],
  },
];

export default function MinimumContractGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="契約" current="ミニマム契約" />
      <GuideTitle subject="NBAのミニマム契約" />
      <p className="mb-8 text-sm text-muted">
        労使協定（CBA）と、NBAが作成した労使協定の要点まとめ（CBA 101）で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "ミニマム契約は、選手の在籍年数ごとに決められた最低年俸で結ぶ契約です。",
            "最低年俸は在籍年数が長いほど高くなるため、「ミニマム＝全選手が同じ年俸」ではありません。",
            "キャップを超えたチームでも結べる例外があり、ベテランの1年契約では、チームの年俸総額に入る額が選手の年俸より小さくなる場合があります。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な制度の解説です。個別の契約には、ここで扱っていない例外や条件があります。実際の契約内容は、各契約の公式な情報で確認してください。
        </p>

        {/* 2. ミニマム契約とは */}
        <Section kicker="What it is" title="ミニマム契約とは何か">
          <Bullets
            items={[
              <>
                <b>どの契約にも最低年俸がある：</b>NBAの契約は、各シーズンに、選手の在籍年数に応じた最低年俸以上を支払わなければなりません。
              </>,
              <>
                <b>その最低年俸で結ぶのがミニマム契約：</b>この最低年俸ちょうどで結ぶ契約が、一般に「ミニマム契約」と呼ばれます。
              </>,
              <>
                <b>短期契約は日割り：</b>10日契約やシーズン残りの契約では、最低年俸は契約がカバーするレギュラーシーズンの日数に応じて日割りになります。
              </>,
              <>
                <b>金額は毎年上がる：</b>最低年俸の表は、サラリーキャップと同じ伸び率で毎年上がります。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 2026-27シーズンの公式な最低年俸表を確認できなかったため、このページでは具体的な金額表を掲載していません。年額は毎シーズンの公式発表を参照してください。
          </p>
        </Section>

        {/* 3. 在籍年数で変わる */}
        <Section kicker="Years of service" title="最低年俸は在籍年数で変わる">
          <p>
            最低年俸は全選手に共通の1つの金額ではなく、<b>在籍年数（Years of Service）ごとに異なる金額</b>が決められています。在籍年数が長いほど、最低年俸は高くなります。
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border border-line px-4 py-3">
              <p className="mb-1 text-xs font-bold text-muted">よくある誤解</p>
              <p className="font-bold text-pretty [word-break:auto-phrase]">「ミニマム契約の選手は、みんな同じ年俸」</p>
            </div>
            <div className="border border-gold bg-[#fff6e0] px-4 py-3 dark:bg-white/[.06]">
              <p className="mb-1 text-xs font-bold text-muted">実際の仕組み</p>
              <p className="font-bold text-pretty [word-break:auto-phrase]">同じミニマム契約でも、在籍年数が長い選手ほど年俸は高い</p>
            </div>
          </div>
          <Bullets
            items={[
              "たとえば、NBA1年目の選手と10年以上プレーしている選手では、同じ「ミニマム契約」でも適用される最低年俸が異なります。",
              "在籍年数は、レギュラーシーズン中に1日以上NBAのロスター（アクティブまたはインアクティブ）に入っていたシーズンを1年として数えます。",
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["MAX契約"]} label="NBAのMAX契約とは？（在籍年数で決まる年俸の上限）" />
        </Section>

        {/* 4. キャップ状況にかかわらず結べる例外 */}
        <Section kicker="Minimum exception" title="キャップを超えていても結べる例外">
          <p>
            ミニマム契約には、チームの年俸総額がサラリーキャップを超えていても使える<b>Minimum Player Salary Exception</b>という例外があります。
          </p>
          <Bullets
            items={[
              <>
                <b>キャップを超えていても契約できる：</b>この例外を使えば、キャップスペースがないチームでも、選手と最低年俸で契約できます。
              </>,
              <>
                <b>契約は最長2シーズン：</b>この例外で結べるのは1年または2年の契約です。1年目の年俸はその選手の最低年俸と同額で、ボーナスは付けられません。2年契約なら、2年目もその年の最低年俸と同額です。
              </>,
              <>
                <b>トレードなどでの獲得にも使える：</b>1年または2年のミニマム契約を結んでいる選手を、トレードやウェーバーで獲得するときにも使えます。
              </>,
              <>
                <b>シーズン途中は日割り：</b>この例外の金額は、レギュラーシーズン2日目から日割りになります。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ"]} label="NBAサラリーキャップとは？（キャップスペースと例外の基本）" />
        </Section>

        {/* 5. ベテランの1年ミニマム契約 */}
        <Section kicker="Veteran minimum" title="ベテランの1年契約：選手の年俸とキャップ上の扱いの違い">
          <p>
            在籍3年以上の選手が<b>1年のミニマム契約</b>を結ぶ場合、選手が受け取る年俸と、チームの年俸総額（Team Salary）に入る額が同じにならない仕組みがあります。
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border border-line px-4 py-3">
              <p className="mb-1 text-xs font-bold text-muted">選手が受け取る年俸</p>
              <p className="font-bold text-pretty [word-break:auto-phrase]">その選手の在籍年数に応じた最低年俸</p>
            </div>
            <div className="border border-line px-4 py-3">
              <p className="mb-1 text-xs font-bold text-muted">チームの年俸総額に入る額</p>
              <p className="font-bold text-pretty [word-break:auto-phrase]">在籍2年の選手の最低年俸と同じ額</p>
            </div>
          </div>
          <Bullets
            items={[
              <>
                <b>差額はリーグの基金から：</b>選手の最低年俸と、在籍2年の選手の最低年俸との差額は、リーグ全体の基金からチームに払い戻されます。
              </>,
              <>
                <b>年俸総額に入るのは払い戻されない分だけ：</b>チームの年俸総額に入るのは、払い戻されない部分だけです。そのため、キャップ上はベテランの年俸が実際より小さく扱われます。
              </>,
              <>
                <b>対象は1年契約だけ：</b>この扱いは、在籍3年以上の選手との1年のミニマム契約が対象です。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 払い戻しの対象や計算の詳細な条件は、公式CBA・CBA 101を参照してください。
          </p>
        </Section>

        {/* 6. 契約期間と、ミニマム契約だけでは分からない条件 */}
        <Section kicker="Fine print" title="契約期間と、「ミニマム契約」だけでは分からない条件">
          <p>
            ニュースで「ミニマム契約」と報じられても、それだけでは契約の中身がすべて分かるわけではありません。次の点で条件が変わります。
          </p>
          <Bullets
            items={[
              <>
                <b>どの方法で結んだ契約か：</b>Minimum Player Salary Exceptionを使った契約は最長2シーズンです。キャップの状況や使う手段によって、適用されるルールが変わります。
              </>,
              <>
                <b>契約の長さ：</b>1年契約か2年契約かで、ベテランの1年契約の払い戻しの対象になるかどうかが変わります。
              </>,
              <>
                <b>シーズンのどの時期に結んだか：</b>10日契約やシーズン残りの契約、シーズン途中の契約では、日割りの金額になります。
              </>,
              <>
                <b>選手の在籍年数：</b>同じミニマム契約でも、在籍年数で年俸の額も、キャップ上の扱いも変わります。
              </>,
              <>
                <b>チームの最低総年俸とは別：</b>チーム全体の年俸総額の下限（最低総年俸）は、選手1人ごとの最低年俸とは別の仕組みです。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 個別の契約の条件は、契約ごとに異なります。詳細な条件は公式CBA・CBA 101を参照してください。
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
