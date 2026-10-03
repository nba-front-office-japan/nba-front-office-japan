import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import {
  BackToGuide,
  Bullets,
  CaseTimeline,
  GlossarySection,
  GuideHeader,
  GuideTitle,
  KindLabel,
  OfficialSourcesSection,
  RelatedGuideLink,
  Section,
  SummarySection,
  type CaseEvent,
} from "@/components/guide-article";
import { GUIDE_PAGES, type OfficialSource } from "@/lib/guide-official";

export const metadata: Metadata = {
  title: "サラリーキャップ迂回に関する処分 | NBAガイド | NBA Front Office Japan",
  description:
    "2026年9月にNBAが処分を公表した、LAクリッパーズとカワイ・レナード選手のサラリーキャップ迂回（Circumvention）に関する処分を解説します。NBAが認定した事実と処分の内容を公式発表に沿って整理し、関連する労使協定のルールを事実と分けて説明します。",
};

// 事実は、NBAの公式発表(NBA Communications、2026年9月2日)と、NBA.comに掲載された球団オーナーの声明(2026年9月14日公開)で確認できるものだけを書く。
// 日付は各ページの公開日時(datePublished)で確認した。
// 確認した内容:
//   - NBA Communications(2026年9月2日)：法律事務所による独立した調査にもとづく認定、各当事者への処分(指名権5つ、罰金3,000万ドル、
//     オーナーの1年間の資格停止、幹部2人の無給の資格停止、5年間のコンプライアンス監視、選手の70万ドルの支払い、選手のビジネス・マネージャーの5年間の活動禁止)
//   - NBA.com(2026年9月14日公開)：クリッパーズのオーナーの声明(処分に従い罰金を支払ったこと、報告の認定には意見の相違が残ること)
// 解説は、2023年CBA 第13条(Circumvention)にもとづく。
// 発表に書かれていない金額(報道された契約額など)、関係者の意図、推測・評価は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "NBA announces penalties and findings arising from investigation of LA Clippers and Kawhi Leonard",
    publisher: "NBA Communications（pr.nba.com）",
    date: "2026年9月2日公開",
    href: "https://pr.nba.com/nba-investigation-clippers-kawhi-leonard/",
    note: "調査の認定と処分の内容（NBA.comにも同じ発表が掲載されています）",
  },
  {
    title: "Statement from Clippers Governor Steve Ballmer",
    publisher: "NBA.com",
    date: "2026年9月14日公開",
    href: "https://www.nba.com/news/statement-from-clippers-governor-steve-ballmer",
    note: "処分を受けたクリッパーズのオーナーの声明",
  },
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第13条（Article XIII）：Circumvention（ルールの迂回の禁止、スポンサーなどの第三者を通じた支払い、届け出ていない合意の禁止）",
  },
];

const EVENTS: CaseEvent[] = [
  {
    date: "2026年9月2日",
    title: "NBAが調査の結果と処分を発表",
    body: (
      <>
        NBAは、LAクリッパーズとカワイ・レナード選手が、労使協定（CBA）のサラリーキャップ迂回（Circumvention）に関するルールに違反したとして、処分を発表しました。認定は、法律事務所による独立した調査で得られた情報にもとづくとされています。
      </>
    ),
    source: "NBA Communications（2026年9月2日）",
  },
  {
    date: "2026年9月14日",
    title: "クリッパーズのオーナーが声明を発表",
    body: (
      <>
        クリッパーズのオーナー、スティーブ・バルマー氏は声明で、ファンや関係者に謝罪し、主たるオーナーとして責任を受け入れると述べました。あわせて、リーグの処分に従い、罰金を支払ったことを明らかにしました。一方で、報告書の認定については意見の相違が残っているとも述べています。
      </>
    ),
    source: "NBA.com（2026年9月14日公開）",
  },
];

// NBAの発表にもとづく処分の一覧
const PENALTIES: [string, string][] = [
  ["LAクリッパーズ（球団）", "2029〜2033年の5年分のドラフト1巡目指名権を没収、3,000万ドルの罰金。球団と関係者は、リーグが監督するコンプライアンス・監視の対象（5年間）"],
  ["スティーブ・バルマー氏（オーナー）", "リーグと球団のすべての活動から1年間の資格停止"],
  ["ジリアン・ザッカー氏（ビジネス部門の責任者）", "1年間の無給の資格停止"],
  ["ローレンス・フランク氏（バスケットボール部門の責任者）", "6か月間の無給の資格停止"],
  ["カワイ・レナード選手", "リーグへ70万ドルを支払う"],
  ["デニス・ロバートソン氏（選手の当時のビジネス・マネージャー）", "5年間、選手などの代理としてNBAの球団と関わることを禁止"],
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "Circumvention（ルールの迂回）",
    description: "サラリーキャップなどの労使協定のルールを、合意や取引によってすり抜けようとすること。協定の第13条で禁止されている。",
  },
  {
    term: "サラリーキャップ",
    description: "チームの年俸総額の基準となる上限。例外を使わない限り、これを超える契約や獲得はできない。",
    href: GUIDE_PAGES["サラリーキャップ"],
  },
  {
    term: "ドラフト指名権の没収",
    description: "ルール違反に対する処分として、球団の指名権をなくすこと。",
    href: GUIDE_PAGES["ドラフト指名権"],
  },
];

export default function SalaryCapCircumventionGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="過去事件" current="サラリーキャップ迂回に関する処分" />
      <GuideTitle subject="サラリーキャップ迂回に関する処分" suffix="" />
      <p className="mb-8 text-sm text-muted">
        NBAの公式発表と労使協定（CBA）をもとにした、当サイト独自の解説です。<KindLabel kind="事実" />は公式発表で確認できる内容、<KindLabel kind="解説" />は当サイトによる制度の説明です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "2026年9月2日、NBAは、LAクリッパーズとカワイ・レナード選手が、労使協定のサラリーキャップ迂回に関するルールに違反したとして処分を発表しました。",
            "NBAは、球団が選手と取引先企業との間の副収入の機会をつくり、選手側の個人的な経費を支払ったことなどを認定しました。",
            "球団には5年分のドラフト1巡目指名権の没収と3,000万ドルの罰金が科され、オーナーや幹部も資格停止などの処分を受けました。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>事案は終結したとは限りません：</b>NBAは発表で、法律事務所が引き続き調査に関係する情報を受け付けており、リーグは必要に応じてさらなる措置を検討するとしています。このページは2026年9月の発表時点の内容をまとめたもので、この事案が完全に終結したと断定するものではありません。
        </p>

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは、NBAの発表で認定された事実と処分を、発表の内容に沿ってまとめたものです。発表に書かれていない経緯や金額、関係者の意図についての推測・評価は載せていません。
        </p>

        {/* 2. 経過 */}
        <Section
          kicker="Timeline"
          title={
            <>
              <KindLabel kind="事実" />
              発表の経過
            </>
          }
        >
          <CaseTimeline events={EVENTS} />
        </Section>

        {/* 3. NBAの認定 */}
        <Section
          kicker="Findings"
          title={
            <>
              <KindLabel kind="事実" />
              NBAが認定した内容
            </>
          }
        >
          <p>NBAの発表によると、調査では、球団の組織による不正行為のパターンと、複数の重大なルール違反が認定されました。発表された主な内容は次のとおりです。</p>
          <Bullets
            items={[
              <>
                <b>球団：</b>選手と、球団と取引のある4社（Aspiration Partners、Boingo Wireless、Daktronics、Lockton Insurance）との間の副収入の機会を球団側から持ちかけ、スポンサー契約の成立を手助けし、球団との取引を示して企業に契約を促したこと。また、選手とその関係者の個人的な経費を支払ったこと、選手の当時のビジネス・マネージャーを通じた不適切な働きかけを報告しなかったこと。
              </>,
              <>
                <b>オーナー：</b>選手が副収入の機会を得られるよう、知りながら手助けしようとしたこと、Aspirationが選手とスポンサー契約を結ぶ前提条件だと知っていた取引を承認したこと、組織がルールを守る体制をつくらなかったこと。
              </>,
              <>
                <b>選手：</b>選手の当時のビジネス・マネージャーを通じて、副収入の機会を得られるよう球団に働きかけ、実際にその機会を得たこと、球団が支払った個人的な経費を返さなかったこと。
              </>,
              <>
                <b>以前の違反：</b>発表では、クリッパーズはサラリーキャップ迂回のルールについて以前にも違反した球団であるとされています。
              </>,
            ]}
          />
        </Section>

        {/* 4. 処分 */}
        <Section
          kicker="Penalties"
          title={
            <>
              <KindLabel kind="事実" />
              処分の内容
            </>
          }
        >
          <dl className="divide-y divide-line border border-line">
            {PENALTIES.map(([who, what]) => (
              <div key={who} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[260px_1fr] sm:gap-4">
                <dt className="font-bold [word-break:auto-phrase]">{who}</dt>
                <dd className="text-pretty [word-break:auto-phrase]">{what}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs leading-6 text-muted">
            ※ 肩書きはNBAの発表時点のものです。発表では、選手の契約の扱いについては触れられていません。
          </p>
          <Bullets
            items={[
              <>
                <b>処分の確定：</b>NBAと選手会（NBPA）は、これらの処分がすべての当事者にとって最終的で拘束力があることを確認する合意を結んだとされています。
              </>,
              <>
                <b>調査の継続：</b>発表では、法律事務所は引き続き調査に関係する情報を受け付けており、リーグは必要に応じてさらなる措置を検討するとされています。
              </>,
            ]}
          />
        </Section>

        {/* 5. 解説 */}
        <Section
          kicker="Explanation"
          title={
            <>
              <KindLabel kind="解説" />
              関係する労使協定のルール（制度面の説明）
            </>
          }
        >
          <Bullets
            items={[
              <>
                <b>ルールの迂回の禁止：</b>労使協定の第13条は、サラリーキャップやその例外、最大年俸などのルールの目的をすり抜けるための合意や取引を、リーグ・選手会・球団・選手のいずれにも禁じています。
              </>,
              <>
                <b>第三者を通じた支払い：</b>同じ条文では、球団がスポンサーや取引先などの第三者と合意し、その第三者が契約中の選手に、バスケットボールの対価としての報酬を支払うこと（名目が別の仕事であっても）を、ルールの迂回にあたると定めています。
              </>,
              <>
                <b>届け出ていない合意の禁止：</b>球団と選手の間で、NBAに届け出ていない報酬や、投資・ビジネスの機会などについて合意することも禁じられています。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ NBAの発表は、どの条文のどの規定に違反したかまでは示していません。このページでは、関係する協定のルールを紹介しています。
          </p>
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ"]} label="NBAサラリーキャップとは？（基本の仕組み・例外）" />
        </Section>

        {/* 6. 関連ガイド */}
        <Section kicker="Related" title="関連ガイド">
          <p>サラリーキャップのルールをめぐる過去の事例は、次のガイドでも解説しています。</p>
          <RelatedGuideLink href={GUIDE_PAGES["ジョー・スミス事件"]} label="ジョー・スミス事件とは？（2000年の秘密の合意と処分）" />
          <RelatedGuideLink href={GUIDE_PAGES["タンパリング"]} label="NBAのタンパリング事例とは？（処分が公表された事例）" />
          <RelatedGuideLink href={GUIDE_PAGES["ドラフト指名権"]} label="NBAのドラフト指名権とは？（指名権の基本とトレードのルール）" />
        </Section>

        {/* 7. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 8. 出典 */}
        <OfficialSourcesSection
          sources={SOURCES}
          kicker="Sources"
          title="出典（公式発表・協定）"
          note="このページは上記の公式発表・協定をもとにした当サイト独自の解説です。発表文や条文を転載・翻訳したものではありません。"
        />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
