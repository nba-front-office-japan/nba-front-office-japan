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
  title: "NBAのタンパリング事例とは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAが処分を公表したタンパリング（他球団の選手への不正な接触）と、FA交渉の解禁前の交渉の事例を、NBAの公式発表をもとに年代順に整理しました。2019年の罰則強化もあわせて紹介します。",
};

// 事実は、NBAの公式発表(NBA Communications・NBA.com)と、NBA.comに掲載されたAP配信記事で確認できるものだけを書く。
// 日付は各発表ページの公開日時(datePublished)で確認した。
// 確認した内容:
//   - NBA.com(2017年8月31日)：レイカーズに50万ドルの罰金(anti-tampering rule違反)
//   - NBA.com(2020年12月21日)：バックスの2022年2巡目指名権を取り消し
//   - NBA Communications(2021年12月1日)：ブルズ・ヒートの次の2巡目指名権を没収
//   - NBA.com(2022年10月31日)：76ersの2023・2024年2巡目指名権を取り消し
//   - NBA Communications(2022年12月21日)：ニックスの2025年2巡目指名権を取り消し
//   - NBA Communications(2023年10月25日)：サンズが持っていた2024年2巡目指名権を取り消し
//   - NBA.com(AP配信、2019年9月20日)：オーナー会議が罰則の強化を承認
// 発表に書かれていない経緯、関係者の意図、推測・評価は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "Los Angeles Lakers fined for violating anti-tampering rule",
    publisher: "NBA.com",
    date: "2017年8月31日公開",
    href: "https://www.nba.com/news/nba-fines-los-angeles-lakers-violating-anti-tampering-rule",
    note: "レイカーズへの罰金と、anti-tampering ruleの説明",
  },
  {
    title: "NBA teams approve stiffer penalties for tampering",
    publisher: "NBA.com（AP配信）",
    date: "2019年9月20日公開",
    href: "https://www.nba.com/news/ap-teams-approve-stiffer-penalties-tampering",
    note: "オーナー会議による罰則の強化",
  },
  {
    title: "NBA imposes penalty on Bucks for early free agency discussions",
    publisher: "NBA.com",
    date: "2020年12月21日公開",
    href: "https://www.nba.com/news/nba-imposes-penalty-on-bucks-for-early-free-agency-discussions",
    note: "バックスへの処分",
  },
  {
    title: "NBA imposes penalties on Bulls and Heat for early free agency discussions",
    publisher: "NBA Communications（pr.nba.com）",
    date: "2021年12月1日公開",
    href: "https://pr.nba.com/bulls-heat-penalties-free-agency",
    note: "ブルズ・ヒートへの処分",
  },
  {
    title: "NBA imposes penalty on 76ers for early free agency discussions",
    publisher: "NBA.com",
    date: "2022年10月31日公開",
    href: "https://www.nba.com/news/nba-imposes-penalty-on-76ers-for-early-free-agency-discussions",
    note: "76ersへの処分",
  },
  {
    title: "NBA imposes penalty on Knicks for early free agency discussions",
    publisher: "NBA Communications（pr.nba.com）",
    date: "2022年12月21日公開",
    href: "https://pr.nba.com/nba-imposes-penalty-on-new-york-knicks-for-early-free-agency-discussions/",
    note: "ニックスへの処分",
  },
  {
    title: "NBA imposes penalty on Phoenix Suns for early free agency discussions",
    publisher: "NBA Communications（pr.nba.com）",
    date: "2023年10月25日公開",
    href: "https://pr.nba.com/nba-imposes-penalty-on-phoenix-suns-for-early-free-agency-discussions/",
    note: "サンズへの処分",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "II.N(1)：フリーエージェントとの交渉を始められる時期。解説で参照しました",
  },
];

const EVENTS: CaseEvent[] = [
  {
    date: "2017年8月31日",
    title: "ロサンゼルス・レイカーズに50万ドルの罰金",
    body: (
      <>
        NBAは、レイカーズがanti-tampering rule（他球団の選手への不正な接触を禁じるルール）に違反したとして、50万ドルの罰金を科しました。法律事務所による独立した調査の結果、当時のGMロブ・ペリンカ氏が、他球団と契約中だったポール・ジョージ選手の代理人と連絡をとり、選手への関心を伝えたことが禁止された行為にあたるとされました。処分には、以前の発言をめぐってNBAが球団に警告していたことも反映されています。一方で、調査では、選手を獲得する合意や了解があった証拠は見つからなかったとされています。
      </>
    ),
    source: "NBA.com（2017年8月31日）",
  },
  {
    date: "2019年9月20日",
    title: "オーナー会議が罰則の強化を承認",
    body: (
      <>
        NBAのオーナー会議は、他球団と契約中の選手や職員へのタンパリングに対する罰則の強化を全会一致で承認しました。最も悪質な場合には最大1,000万ドルの罰金のほか、指名権の没収、幹部の資格停止、契約の無効もありうるとされ、各球団は毎年、ルールを守っていることを証明することになりました。
      </>
    ),
    source: "NBA.com（AP配信、2019年9月20日）",
  },
  {
    date: "2020年12月21日",
    title: "ミルウォーキー・バックスの2022年2巡目指名権を取り消し",
    body: (
      <>
        NBAは、バックスがボグダン・ボグダノビッチ選手側と、FA交渉が認められる日より前に話し合っていたとして、バックスの2022年のドラフト2巡目指名権を取り消しました。処分では、球団が調査に協力したこと、契約条件について早期に合意していた証拠がないこと、最終的に選手と契約しなかったことが考慮されたとされています。
      </>
    ),
    source: "NBA.com（2020年12月21日）",
  },
  {
    date: "2021年12月1日",
    title: "シカゴ・ブルズとマイアミ・ヒートの2巡目指名権を没収",
    body: (
      <>
        NBAは、ブルズ（ロンゾ・ボール選手に関するFA交渉）とヒート（カイル・ラウリー選手に関するFA交渉）が、FA交渉の時期に関するルールに違反したとして、それぞれの次に使える2巡目指名権を没収しました。
      </>
    ),
    source: "NBA Communications（2021年12月1日）",
  },
  {
    date: "2022年10月31日",
    title: "フィラデルフィア・76ersの2023・2024年2巡目指名権を取り消し",
    body: (
      <>
        NBAは、76ersがP.J.タッカー選手とダヌエル・ハウスJr.選手の2人について、FA交渉が認められる日より前に話し合っていたとして、2023年と2024年のドラフト2巡目指名権を取り消しました。球団は調査に全面的に協力したとされています。
      </>
    ),
    source: "NBA.com（2022年10月31日）",
  },
  {
    date: "2022年12月21日",
    title: "ニューヨーク・ニックスの2025年2巡目指名権を取り消し",
    body: (
      <>
        NBAは、ニックスがジェイレン・ブランソン選手について、FA交渉が認められる日より前に話し合っていたとして、ニックス自身の2025年のドラフト2巡目指名権を取り消しました。球団は調査に全面的に協力したとされています。
      </>
    ),
    source: "NBA Communications（2022年12月21日）",
  },
  {
    date: "2023年10月25日",
    title: "フェニックス・サンズが持つ2024年2巡目指名権を取り消し",
    body: (
      <>
        NBAは、サンズがドリュー・ユーバンクス選手について、FA交渉が認められる日より前に話し合っていたとして、サンズが以前のトレードで得ていた2024年のドラフト2巡目指名権を取り消しました。球団は調査に全面的に協力したとされています。
      </>
    ),
    source: "NBA Communications（2023年10月25日）",
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "タンパリング（Tampering）",
    description: "他球団と契約中の選手などに、ルールに反して接触し、獲得への関心を伝えたり働きかけたりすること。",
  },
  {
    term: "FA交渉の解禁",
    description: "フリーエージェントとの交渉を始められる時期。労使協定で決められている。",
    href: GUIDE_PAGES["RFA / UFA"],
  },
  {
    term: "ドラフト指名権の取り消し・没収",
    description: "ルール違反に対する処分として、球団の指名権をなくすこと。このページの事例では2巡目指名権が対象になっている。",
    href: GUIDE_PAGES["ドラフト指名権"],
  },
];

export default function TamperingCasesGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="過去事件" current="タンパリング" />
      <GuideTitle subject="NBAのタンパリング事例" />
      <p className="mb-8 text-sm text-muted">
        NBAの公式発表と、NBA.comに掲載された報道をもとにした、当サイト独自のまとめです。<KindLabel kind="事実" />は公式発表・報道で確認できる内容、<KindLabel kind="解説" />は当サイトによる制度の説明です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "NBAは、他球団と契約中の選手への不正な接触（タンパリング）や、FA交渉が認められる日より前の交渉について、調査のうえ処分を公表しています。",
            "2017年にはレイカーズに罰金が科され、2020年以降は、FA交渉を早く始めたとして複数の球団がドラフト2巡目指名権を失っています。",
            "2019年には、オーナー会議が罰則の強化を承認しました。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは、NBAが処分を公表した事例を、発表の内容に沿ってまとめたものです。すべての事例を網羅したものではありません。発表に書かれていない経緯や、関係者の意図についての推測・評価は載せていません。
        </p>

        {/* 2. 事例 */}
        <Section
          kicker="Cases"
          title={
            <>
              <KindLabel kind="事実" />
              処分が公表された主な事例
            </>
          }
        >
          <CaseTimeline events={EVENTS} />
          <p className="text-xs leading-6 text-muted">
            ※ 2020年以降の事例は、NBAの発表では「FA交渉の時期に関するルール（league rules governing the timing of free agency discussions）」への違反と表現されています。
          </p>
        </Section>

        {/* 3. 解説 */}
        <Section
          kicker="Explanation"
          title={
            <>
              <KindLabel kind="解説" />
              事例に関わるルール（制度面の説明）
            </>
          }
        >
          <Bullets
            items={[
              <>
                <b>他球団と契約中の選手への接触：</b>NBAは2017年の発表で、anti-tampering ruleは、他球団と選手の契約関係への干渉を禁じるもので、契約中の選手への関心を公に示すことや、その選手の代理人に関心を伝えることも含まれると説明しています。
              </>,
              <>
                <b>FA交渉を始められる時期：</b>労使協定では、フリーエージェントと交渉を始められる時期が決められています。2020年以降の事例は、この時期より前に交渉していたことが処分の理由とされています。
              </>,
              <>
                <b>処分の種類：</b>公表された事例では、罰金のほか、ドラフト2巡目指名権の取り消し・没収が科されています。処分では、調査への協力などが考慮されたことも示されています。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["RFA / UFA"]} label="NBAのRFAとUFAとは？（フリーエージェントの基本）" />
        </Section>

        {/* 4. 関連ガイド */}
        <Section kicker="Related" title="関連ガイド">
          <p>ほかの過去の事例や、指名権の基本は、次のガイドで解説しています。</p>
          <RelatedGuideLink href={GUIDE_PAGES["ジョー・スミス事件"]} label="ジョー・スミス事件とは？（2000年の秘密の合意と処分）" />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ迂回に関する処分"]} label="サラリーキャップ迂回に関する処分（2026年9月のNBA発表）" />
          <RelatedGuideLink href={GUIDE_PAGES["ドラフト指名権"]} label="NBAのドラフト指名権とは？（指名権の基本とトレードのルール）" />
        </Section>

        {/* 5. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 6. 出典 */}
        <OfficialSourcesSection
          sources={SOURCES}
          kicker="Sources"
          title="出典（公式発表・報道・協定）"
          note="このページは上記の公式発表・報道・協定をもとにした当サイト独自のまとめです。記事や条文を転載・翻訳したものではありません。"
        />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
