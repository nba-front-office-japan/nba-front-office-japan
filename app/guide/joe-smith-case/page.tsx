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
  title: "ジョー・スミス事件とは？ | NBAガイド | NBA Front Office Japan",
  description:
    "2000年にNBAがミネソタ・ティンバーウルブズに処分を科した「ジョー・スミス事件」を解説します。サラリーキャップのルールに違反する秘密の合意、指名権の没収や罰金などの処分、その後の経過を、当時のリーグの発表と報道をもとに、事実と解説に分けて整理しました。",
};

// 事実は、当時のNBAの発表を伝えた報道(AP配信など)と、現在も公開されている報道記事で確認できるものだけを書く。
// 確認した内容:
//   - CBS News(AP、2000年10月25日)：仲裁人の判断、球団は1年契約として届け出ていたこと、処分(罰金350万ドル、1巡目指名権5つ、契約の無効)
//   - ABC News(2000年10月25日)：選手の契約の無効によりフリーエージェントになったこと、Bird Rightsを失ったこと
//   - ABC News(2000年12月6日)、ESPN(2000年12月9日掲載の試合記事)：オーナーの資格停止と幹部の休職、指名権1つの返還
//   - ESPN(AP、2001年12月28日)：2005年の1巡目指名権の返還
// 解説は、現在の2023年CBA 第13条(Circumvention)と、Bird Rightsの仕組みにもとづく。
// 報道で伝えられた秘密の合意の金額など、このページの目的に必要のない金額や、推測・評価は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "Stern Rips Into T'wolves",
    publisher: "CBS News（AP配信）",
    date: "2000年10月25日",
    href: "https://www.cbsnews.com/news/stern-rips-into-twolves/",
    note: "仲裁人の判断と、NBAコミッショナーによる処分の内容",
  },
  {
    title: "NBA Fines T-Wolves for Secret Deal",
    publisher: "ABC News",
    date: "2000年10月25日",
    href: "https://abcnews.com/Sports/story?id=100243",
    note: "契約の無効、選手がフリーエージェントになったこと",
  },
  {
    title: "NBA Will Suspend Timberwolves Owner",
    publisher: "ABC News",
    date: "2000年12月6日",
    href: "https://abcnews.com/Sports/story?id=100118",
    note: "オーナーの資格停止と、幹部の休職",
  },
  {
    title: "Clippers vs. Timberwolves 試合記事（2000年12月9日）",
    publisher: "ESPN.com",
    date: "2000年12月9日",
    href: "https://a.espncdn.com/nba/2001/20001209/recap/lacmin.html",
    note: "資格停止・休職の受け入れと、没収された指名権のうち1つの返還",
  },
  {
    title: "NBA reinstates lost draft selection",
    publisher: "ESPN.com（AP配信）",
    date: "2001年12月28日",
    href: "https://a.espncdn.com/nba/news/2001/1228/1302250.html",
    note: "2005年のドラフト1巡目指名権の返還",
  },
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第13条（Article XIII）：Circumvention（ルールの迂回の禁止、届け出ていない合意の禁止）。解説で参照した現在の協定です",
  },
];

const EVENTS: CaseEvent[] = [
  {
    date: "2000年10月",
    title: "仲裁人が「秘密の合意」があったと判断",
    body: (
      <>
        NBAの仲裁人が、ミネソタ・ティンバーウルブズ、ジョー・スミス選手、代理人のエリック・フライシャー氏が、サラリーキャップのルールに違反する秘密の合意を結んでいたと判断しました。報道によると、球団はNBAに1年契約として届け出ていましたが、実際には、将来の複数年契約についての合意がありました。
      </>
    ),
    source: "CBS News（AP配信、2000年10月25日）",
  },
  {
    date: "2000年10月25日",
    title: "NBAコミッショナーが処分を発表",
    body: (
      <Bullets
        items={[
          "2001年から2005年までの5年分のドラフト1巡目指名権の没収",
          "球団に350万ドルの罰金",
          "スミス選手の2000-01シーズンの契約と、それ以前の同球団との契約の無効",
        ]}
      />
    ),
    source: "CBS News（AP配信）、ABC News（いずれも2000年10月25日）",
  },
  {
    date: "2000年10月",
    title: "スミス選手はフリーエージェントに",
    body: (
      <>契約が無効になったことで、スミス選手はフリーエージェントとなり、同球団で積み上げていたBird Rightsも失ったと報じられました。</>
    ),
    source: "ABC News（2000年10月25日）",
  },
  {
    date: "2000年12月",
    title: "オーナーの資格停止と幹部の休職、指名権1つを返還",
    body: (
      <>
        球団オーナーのグレン・テイラー氏が資格停止を、バスケットボール部門の責任者だったケビン・マクヘイル氏が休職を受け入れ、いずれも2001年の夏まで続くと報じられました。これを受けて、NBAは没収した5つの指名権のうち1つを球団に戻しました。
      </>
    ),
    source: "ABC News（2000年12月6日）、ESPN.com（2000年12月9日）",
  },
  {
    date: "2001年12月28日",
    title: "2005年の1巡目指名権も返還",
    body: (
      <>
        NBAは、2005年のドラフト1巡目指名権を球団に戻しました。報道によると、コミッショナーは、すでに科された処分と、その後の球団の行動を理由に挙げています。
      </>
    ),
    source: "ESPN.com（AP配信、2001年12月28日）",
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "Bird Rights",
    description: "一定の期間同じ球団でプレーした選手と、その球団がサラリーキャップを超えて再契約できる権利。",
    href: GUIDE_PAGES["Bird Rights"],
  },
  {
    term: "Circumvention（ルールの迂回）",
    description: "サラリーキャップなどの労使協定のルールを、合意や取引によってすり抜けようとすること。協定で禁止されている。",
    href: GUIDE_PAGES["サラリーキャップ迂回に関する処分"],
  },
  {
    term: "仲裁人（Arbitrator）",
    description: "労使協定などをめぐる争いについて、判断を示す第三者。",
  },
];

export default function JoeSmithCaseGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="過去事件" current="ジョー・スミス事件" />
      <GuideTitle subject="ジョー・スミス事件" />
      <p className="mb-8 text-sm text-muted">
        当時のNBAの発表を伝えた報道と、労使協定（CBA）をもとにした、当サイト独自の解説です。<KindLabel kind="事実" />は報道で確認できる内容、<KindLabel kind="解説" />は当サイトによる制度の説明です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "2000年10月、NBAは、ミネソタ・ティンバーウルブズとジョー・スミス選手らが、サラリーキャップのルールに違反する秘密の合意を結んでいたとして処分を発表しました。",
            "処分は、5年分のドラフト1巡目指名権の没収、350万ドルの罰金、スミス選手の契約の無効などです。",
            "その後、オーナーの資格停止と幹部の休職が決まり、没収された指名権のうち2つは球団に戻されました。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは、公表された処分と報道で確認できる経過をまとめたものです。関係者の意図や、報道で確認できない事情についての推測・評価は載せていません。
        </p>

        {/* 2. 経過 */}
        <Section
          kicker="Timeline"
          title={
            <>
              <KindLabel kind="事実" />
              事件の経過
            </>
          }
        >
          <CaseTimeline events={EVENTS} />
        </Section>

        {/* 3. 解説 */}
        <Section
          kicker="Explanation"
          title={
            <>
              <KindLabel kind="解説" />
              なぜ問題になったのか（制度面の説明）
            </>
          }
        >
          <Bullets
            items={[
              <>
                <b>届け出た契約と実際の合意が違う：</b>サラリーキャップは、球団がNBAに届け出た契約にもとづいて運用されます。届け出た契約とは別に将来の契約を約束すると、キャップのルールが意味をなさなくなります。
              </>,
              <>
                <b>現在の協定での扱い：</b>現在の2023年の労使協定（CBA）でも、第13条で、協定の目的をすり抜けるための合意や取引（Circumvention）と、NBAに届け出ていない将来の契約についての合意が禁止されています。
              </>,
              <>
                <b>Bird Rightsとの関係：</b>Bird Rightsは、一定の期間同じ球団でプレーした選手と、その球団がキャップを超えて再契約できる仕組みです。契約が無効になったことで、スミス選手はこの権利も失いました。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 第13条の内容は現在の2023年CBAのもので、2000年当時の協定の条文ではありません。制度の考え方を説明するために参照しています。
          </p>
          <RelatedGuideLink href={GUIDE_PAGES["Bird Rights"]} label="NBAのBird Rightsとは？（自チームの選手と再契約できる権利）" />
        </Section>

        {/* 4. 関連ガイド */}
        <Section kicker="Related" title="関連ガイド">
          <p>サラリーキャップの仕組みや、ほかの過去の事例は、次のガイドで解説しています。</p>
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ迂回に関する処分"]} label="サラリーキャップ迂回に関する処分（2026年9月のNBA発表）" />
          <RelatedGuideLink href={GUIDE_PAGES["タンパリング"]} label="NBAのタンパリング事例とは？（処分が公表された事例）" />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ"]} label="NBAサラリーキャップとは？（基本の仕組み・例外）" />
        </Section>

        {/* 5. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 6. 出典 */}
        <OfficialSourcesSection
          sources={SOURCES}
          kicker="Sources"
          title="出典（公式発表・報道・協定）"
          note="このページは上記の報道・協定をもとにした当サイト独自の解説です。記事や条文を転載・翻訳したものではありません。"
        />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
