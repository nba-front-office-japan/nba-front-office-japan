import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import {
  BackToGuide,
  Bullets,
  GlossarySection,
  GuideHeader,
  GuideTitle,
  LevelLadder,
  OfficialSourcesSection,
  RelatedGuideLink,
  Section,
  SummarySection,
  SystemLevelsTable,
} from "@/components/guide-article";
import { GUIDE_PAGES } from "@/lib/guide-official";

// 解説文は CBA と NBA作成の「CBA 101」をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 数値・出典は lib/guide-official.ts の公式発表の値を使う。

export const metadata: Metadata = {
  title: "NBAサラリーキャップとは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのサラリーキャップの仕組み、チーム編成への影響、ラグジュアリータックス・1st Apron・2nd Apronとの関係を初心者向けに解説します。",
};

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "BRI（Basketball Related Income）",
    description: "放映権料やチケット収入など、NBAのバスケットボール関連収入。サラリーキャップ額の計算のもとになる。",
  },
  {
    term: "キャップスペース",
    description: "サラリーキャップからチームの年俸総額を引いた残り。この範囲なら、FA選手と自由に契約できる。",
  },
  {
    term: "ソフトキャップ",
    description: "例外を使えば上限を超えて契約できる方式。NBAはこの方式で、上限を一切超えられないハードキャップとは異なる。",
  },
  {
    term: "ラグジュアリータックス",
    description: "年俸総額がタックスラインを超えたチームが支払う税金。超過額が大きいほど税率が上がる。",
    href: GUIDE_PAGES["ラグジュアリータックス"],
  },
  {
    term: "1st Apron / 2nd Apron",
    description: "タックスラインより上に設定された2つの基準額。超えると使える補強手段が段階的に減る。",
    href: GUIDE_PAGES["1st Apron / 2nd Apron"],
  },
  {
    term: "Bird Rights",
    description: "自チームのFA選手と、キャップを超えていても再契約できる権利。条件を満たすと最大で選手の最高年俸まで出せる。",
  },
  {
    term: "MLE（ミッドレベル例外）",
    description: "キャップを超えたチームでも、一定額までの契約で他チームの選手を獲得できる例外。チームの年俸水準で使える種類が変わる。",
  },
  {
    term: "サラリーマッチング",
    description: "キャップを超えたチームがトレードをするとき、出す年俸と受け取る年俸をおおむね釣り合わせる必要があるというルール。",
  },
  {
    term: "ミニマム契約",
    description: "経験年数ごとに決まった最低年俸での契約。キャップを超えていても結べる。",
  },
];

export default function SalaryCapGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="NBA制度" current="サラリーキャップ" />
      <GuideTitle subject="NBAサラリーキャップ" />
      <p className="mb-8 text-sm text-muted">
        数値は2026-27シーズン（2026年7月1日から適用）のNBA公式発表にもとづきます。仕組みの解説は公式資料をもとにした当サイト独自の要約です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "サラリーキャップは、1チームが選手に払う年俸総額の「基準となる上限」です。",
            "NBAは例外を使えば上限を超えて契約できる「ソフトキャップ」なので、多くのチームが上限を超えています。",
            "ただし超えるほど、ラグジュアリータックスやApronの制限で使える補強手段が減っていきます。",
          ]}
        />

        {/* 2. 基本的な仕組み */}
        <Section kicker="How it works" title="サラリーキャップの基本的な仕組み">
          <Bullets
            items={[
              <>
                <b>1年単位で決まる：</b>毎年7月1日から翌年6月30日までを1つの「サラリーキャップ年度」として、金額が設定されます。
              </>,
              <>
                <b>リーグの収入に連動：</b>サラリーキャップは、NBAのバスケットボール関連収入（BRI）の見込みをもとに毎年計算されます。タックスラインや2つのApronも、キャップと同じ伸び率で毎年上がります。
              </>,
              <>
                <b>急な変動は抑えられる：</b>各基準額は前年より下がらず、前年から10%を超えて上がることもない決まりです。
              </>,
              <>
                <b>キャップスペースがあれば自由に補強：</b>年俸総額がキャップを下回るチームは、その差額（キャップスペース）の範囲で、FA選手との契約やトレードでの年俸の受け入れができます。
              </>,
              <>
                <b>例外を使えば上限を超えられる：</b>自チームの選手との再契約（Bird Rights）、ミッドレベル例外（MLE）、ミニマム契約、ドラフト指名選手のルーキー契約などは、キャップを超えていても結べます。
              </>,
              <>
                <b>下限もある：</b>年俸総額が最低総年俸を下回るチームは、不足分を支払う必要があります。
              </>,
            ]}
          />

          <SystemLevelsTable />
        </Section>

        {/* 3. チーム編成への影響 */}
        <Section kicker="Team building" title="なぜチーム編成に影響するのか">
          <p>
            サラリーキャップは「いくらまで払えるか」だけでなく、<b>どの方法で選手を集められるか</b>を左右します。
          </p>
          <Bullets
            items={[
              <>
                <b>キャップスペースがあるチーム：</b>他チームのFA選手に大型契約を提示できます。若手中心のチームや、大型契約が満了したチームがこの立場になりやすいです。
              </>,
              <>
                <b>キャップを超えているチーム：</b>他チームのFA選手を獲るには、主にMLEやミニマム契約などの例外に頼ることになり、提示できる金額に限りがあります。そのため、自チームの選手との再契約（Bird Rights）とトレードが補強の中心になります。
              </>,
              <>
                <b>トレードでは年俸の釣り合いが必要：</b>キャップを超えたチームは、出す年俸と受け取る年俸をおおむね合わせる必要があり（サラリーマッチング）、欲しい選手がいても簡単には獲得できません。
              </>,
              <>
                <b>長期契約は将来の枠を使う：</b>複数年契約の年俸は翌年以降の年俸総額にも残るため、今の補強が数年先の自由度を左右します。
              </>,
            ]}
          />
        </Section>

        {/* 4. タックス・Apronとの関係 */}
        <Section
          kicker="Tax & Aprons"
          title={
            <>
              ラグジュアリータックス・<span className="whitespace-nowrap">1st Apron</span>・
              <span className="whitespace-nowrap">2nd Apronとの関係</span>
            </>
          }
        >
          <p>
            キャップの上には、さらに3つの基準額があります。年俸総額が上の段に進むほど、支払う税金が増え、使える補強手段が減っていきます。
          </p>
          <LevelLadder
            steps={[
              ["サラリーキャップ", "ここを下回っていれば、キャップスペースで自由に補強できる"],
              ["タックスライン", "超えるとラグジュアリータックスを支払う"],
              ["1st Apron", "超えると一部の補強手段が使えなくなる"],
              ["2nd Apron", "さらに厳しい制限と、ドラフト指名権へのペナルティ"],
            ]}
          />

          <h3 className="pt-2 font-bold">ラグジュアリータックス</h3>
          <Bullets
            items={[
              "レギュラーシーズン最終日の時点で年俸総額がタックスラインを超えていると、超えた額に応じて税金を支払います。",
              "税率は段階式で、超過額が大きいほど高くなります。",
              "直近5シーズンのうち4シーズン以上（その年を含む）で支払っているチームは「リピーター」として、さらに高い税率になります。",
              "集まった税金の一部は、タックスを払っていないチームに分配されることがあります。",
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["ラグジュアリータックス"]} label="NBAラグジュアリータックスとは？（税率の考え方・チーム編成への影響）" />

          <h3 className="pt-2 font-bold">1st Apron</h3>
          <Bullets
            items={[
              "取引の結果、年俸総額が1st Apronを超える場合は、その取引ができません。",
              "対象になる主な補強手段：通常のMLE（Non-Taxpayer MLE）、Bi-annual Exception、サイン・アンド・トレードでの選手獲得など。",
              "これらを一度使うと、そのシーズンは年俸総額を1st Apron以下に保つ必要があります。",
            ]}
          />

          <h3 className="pt-2 font-bold">2nd Apron</h3>
          <Bullets
            items={[
              "1st Apronの制限に加えて、トレードで複数選手の年俸を合算して受け入れる、トレードで現金を支払う、Taxpayer MLEで契約する、といった手段も使えなくなります。",
              "シーズン最終戦の開始時点で2nd Apronを超えていると、7年後のドラフト1巡目指名権がトレードできなくなります（指名権の凍結）。",
              "その後4シーズンのうち2シーズン以上で再び超えると、凍結された指名権は1巡目の最後の順位に回されます。",
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["1st Apron / 2nd Apron"]} label="NBAの1st Apronと2nd Apronとは？（制限の内容・指名権のペナルティ）" />
          <p className="text-xs leading-6 text-muted">
            ※ 条件の細部には例外や追加のルールがあります。正確な条件は下の公式資料（CBA）を確認してください。
          </p>
        </Section>

        {/* 5. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 6. 公式一次資料 */}
        <OfficialSourcesSection />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
