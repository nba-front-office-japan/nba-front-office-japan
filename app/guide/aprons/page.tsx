import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import {
  BackToGuide,
  Bullets,
  GlossarySection,
  GuideHeader,
  HEADING_WRAP,
  LevelLadder,
  OfficialSourcesSection,
  RelatedGuideLink,
  Section,
  SummarySection,
  SystemLevelsTable,
} from "@/components/guide-article";
import { GUIDE_PAGES } from "@/lib/guide-official";

export const metadata: Metadata = {
  title: "NBAの1st Apronと2nd Apronとは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAの1st Apronと2nd Apronの位置づけ、サラリーキャップ・ラグジュアリータックスとの違い、超えたときの補強制限とドラフト指名権のペナルティを初心者向けに解説します。",
};

// 解説文は CBA と NBA作成の「CBA 101」(2024年11月作成)をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 制限内容は CBA 101 の「Operation of Apron Levels」「Draft Pick Penalty」で確認できるものだけを書き、
// 細かな条件や例外は推測で補わず、公式資料への参照にとどめる。
// 2026-27シーズンの数値は lib/guide-official.ts の公式発表の値だけを使う。仮の金額・架空の事例は載せない。

// サラリーキャップ・ラグジュアリータックス・Apronの違い
const COMPARISON: { name: string; effect: string; timing: string; href?: string }[] = [
  {
    name: "サラリーキャップ",
    effect: "下回っていれば、キャップスペースでFA選手と契約できる。超えても例外を使えば契約できる。",
    timing: "契約や取引をするとき",
    href: GUIDE_PAGES["サラリーキャップ"],
  },
  {
    name: "ラグジュアリータックス",
    effect: "タックスラインを超えた額に応じて税金を支払う。支払えば超えていてよい。",
    timing: "レギュラーシーズン最終日の時点",
    href: GUIDE_PAGES["ラグジュアリータックス"],
  },
  {
    name: "1st Apron / 2nd Apron",
    effect: "税金ではなく、特定の補強手段が使えなくなる。超える結果になる取引そのものができない。",
    timing: "取引の直後。対象の手段を使った年度は、その年度の終わりまで",
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "Apron Team Salary",
    description:
      "Apronの判定に使う年俸総額。通常の年俸総額をもとに、FA選手の保留額やドラフト1巡目指名権の保留額を除くなどの調整をした額。",
  },
  {
    term: "Traded Player Exception（TPE）",
    description: "キャップを超えたチームが、トレードで放出した選手の年俸をもとに、別の選手を受け入れられる例外。",
  },
  {
    term: "Aggregated / Expanded TPE",
    description:
      "複数選手の年俸を合算して使えるトレード例外。Expandedは受け入れられる年俸の上限が広がる。Expandedは1st Apron、Aggregatedは2nd Apronを超えるチームは使えない。",
  },
  {
    term: "Bi-annual Exception",
    description: "キャップを超えたチームが、一定額までの契約を結べる例外。1st Apronを超えるチームは使えない。",
  },
  {
    term: "Non-Taxpayer MLE / Taxpayer MLE",
    description:
      "キャップを超えたチームが使えるミッドレベル例外。1st Apronを超えると金額の小さいTaxpayer MLEしか使えず、2nd Apronを超えるとそれも使えない。",
  },
  {
    term: "サイン・アンド・トレード",
    description: "FA選手が元のチームと契約し、そのまま別のチームへトレードされる取引。1st Apronを超えるチームは、この方法で選手を獲得できない。",
  },
  {
    term: "指名権の凍結（Frozen Pick）",
    description: "2nd Apronを超えたチームの、7年後のドラフト1巡目指名権がトレードできなくなるペナルティ。",
  },
  {
    term: "サラリーキャップ",
    description: "1チームが選手に払う年俸総額の基準となる上限。例外を使えば超えて契約できるソフトキャップ。",
    href: GUIDE_PAGES["サラリーキャップ"],
  },
  {
    term: "ラグジュアリータックス",
    description: "年俸総額がタックスラインを超えたチームが支払う税金。超過額が大きいほど税率が上がる。",
    href: GUIDE_PAGES["ラグジュアリータックス"],
  },
];

export default function ApronsGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="NBA制度" current="1st Apron / 2nd Apron" />
      <h1 className={`mb-3 text-[26px] font-semibold leading-tight tracking-tight sm:text-[36px] ${HEADING_WRAP}`}>
        {/* 狭い画面では「NBAの1st Apronと」「2nd Apronとは？」の間で改行する */}
        <span className="inline-block max-w-full">NBAの1st Apronと</span>
        <span className="inline-block max-w-full">2nd Apronとは？</span>
      </h1>
      <p className="mb-8 text-sm text-muted">
        数値は2026-27シーズン（2026年7月1日から適用）のNBA公式発表、制限の内容はNBAが作成した労使協定の要点まとめ（CBA 101）にもとづきます。仕組みの解説は公式資料をもとにした当サイト独自の要約です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "1st Apronと2nd Apronは、タックスラインよりさらに上に設定された、年俸総額の2つの基準額です。",
            "Apron自体は税金ではなく、超えると使える補強手段（契約やトレードの方法）が段階的に制限されます。",
            "2nd Apronを超えると制限がさらに増え、ドラフト1巡目指名権がトレードできなくなるペナルティもあります。",
          ]}
        />

        {/* 2. 位置づけ */}
        <Section kicker="Where they sit" title="1st Apronと2nd Apronの位置づけ">
          <p>
            年俸総額の基準は、下からサラリーキャップ、タックスライン、1st Apron、2nd Apronの順に並んでいます。Apronは、その中でいちばん上にある2段です。
          </p>
          <LevelLadder
            highlight={["1st Apron", "2nd Apron"]}
            steps={[
              ["サラリーキャップ", "ここを下回っていれば、キャップスペースで自由に補強できる"],
              ["タックスライン", "超えるとラグジュアリータックスを支払う"],
              ["1st Apron", "超えると一部の補強手段が使えなくなる（このページ）"],
              ["2nd Apron", "さらに多くの補強手段が使えなくなり、指名権のペナルティもある（このページ）"],
            ]}
          />
          <Bullets
            items={[
              <>
                <b>判定に使う年俸総額：</b>通常の年俸総額をもとに、FA選手の保留額やドラフト1巡目指名権の保留額を除くなどの調整をした額（Apron Team Salary）で判定します。
              </>,
              <>
                <b>基準額は毎年改定：</b>1st Apronと2nd Apronは、サラリーキャップと同じ伸び率で毎年見直されます。
              </>,
            ]}
          />
          <SystemLevelsTable highlight={["apron1", "apron2"]} />
        </Section>

        {/* 3. サラリーキャップ・ラグジュアリータックスとの違い */}
        <Section kicker="Differences" title="サラリーキャップ・ラグジュアリータックスとの違い">
          <p>
            3つの仕組みはどれも年俸総額に関するルールですが、<b>超えたときに起きること</b>と<b>判定のタイミング</b>が異なります。
          </p>
          {/* PC: 表 / スマホ: 縦並び */}
          <div className="hidden border border-line sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
                  <th scope="col" className="w-[200px] px-4 py-2.5">仕組み</th>
                  <th scope="col" className="px-4 py-2.5">超えると何が起きるか</th>
                  <th scope="col" className="w-[250px] px-4 py-2.5">判定のタイミング</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.name} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 text-left align-top font-bold">
                      {row.name}
                    </th>
                    {/* 1〜2文字だけの行ができないよう、行の長さを整えて折り返す(text-pretty) */}
                    <td className="px-4 py-3 align-top text-pretty">{row.effect}</td>
                    <td className="px-4 py-3 align-top text-pretty text-muted">{row.timing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="border border-line sm:hidden">
            {COMPARISON.map((row) => (
              <div key={row.name} className="border-b border-line px-4 py-3 last:border-b-0">
                <dt className="font-bold">{row.name}</dt>
                <dd className="mt-1">{row.effect}</dd>
                <dd className="mt-1 text-xs text-muted">判定：{row.timing}</dd>
              </div>
            ))}
          </dl>
          <p>
            ラグジュアリータックスは「お金を払えば超えてよい」仕組みですが、Apronは「超える結果になる取引はできない」制限です。お金では解決できない点が、Apronの大きな特徴です。
          </p>
          <RelatedGuideLink href={GUIDE_PAGES["ラグジュアリータックス"]} label="NBAラグジュアリータックスとは？（税率の考え方・チーム編成への影響）" />
        </Section>

        {/* 4. 1st Apronを超えると */}
        <Section kicker="First Apron" title="1st Apronを超えると何が変わるか">
          <p>
            取引をした直後の年俸総額が1st Apronを超えることになる場合、次の補強手段は使えません。
          </p>
          <Bullets
            items={[
              "Bi-annual Exceptionを使った選手の契約・獲得",
              "通常のMLE（Non-Taxpayer MLE）を使った選手の契約・獲得",
              "サイン・アンド・トレードでの選手の獲得",
              "シーズン中に契約を解除された選手のうち、解除前の年俸が通常のMLEの額を上回っていた選手との、同じレギュラーシーズン中の契約",
              "Expanded Traded Player Exception（受け入れられる年俸の上限が広がるトレード例外）を使った獲得",
              "前の年度以前に生じたTraded Player Exceptionを使った獲得",
            ]}
          />
          <h3 className="pt-2 font-bold">一度使うと、その年度の上限になる</h3>
          <Bullets
            items={[
              "上のいずれかの手段を使ったチームは、その年度（7月1日〜翌年6月30日）が終わるまで、年俸総額を1st Apron以下に保つ必要があります。",
              "Taxpayer MLEを使ったチームも、その年度は上の手段を使えなくなります。",
            ]}
          />
          <h3 className="pt-2 font-bold">トレードの上乗せ枠がなくなる</h3>
          <Bullets
            items={[
              "標準的なトレード例外では、放出した選手の年俸に25万ドルを上乗せした額まで受け入れられます。ただし、取引後の年俸総額が1st Apronを超える場合、この25万ドルの上乗せはなくなります。",
            ]}
          />
        </Section>

        {/* 5. 2nd Apronを超えると */}
        <Section kicker="Second Apron" title="2nd Apronを超えると何が変わるか">
          <p>
            1st Apronの制限に加えて、取引をした直後の年俸総額が2nd Apronを超えることになる場合、次の手段も使えません。
          </p>
          <Bullets
            items={[
              "複数選手の年俸を合算して使うトレード例外（Aggregated Standard Traded Player Exception）での獲得",
              "トレードでの現金の支払い",
              "サイン・アンド・トレードで放出した選手から生じたTraded Player Exceptionを使った獲得",
              "Taxpayer MLEを使った選手の契約",
            ]}
          />
          <p>上のいずれかの手段を使ったチームは、その年度が終わるまで、年俸総額を2nd Apron以下に保つ必要があります。</p>

          <h3 className="pt-2 font-bold">ドラフト1巡目指名権へのペナルティ</h3>
          <Bullets
            items={[
              <>
                <b>指名権の凍結：</b>レギュラーシーズン最終戦の開始時点で2nd Apronを超えていると、7年後のドラフト1巡目指名権がトレードできなくなります。
              </>,
              <>
                <b>1巡目の最後へ移動：</b>その後の4シーズンのうち2シーズン以上で再び2nd Apronを超えると、凍結された指名権は1巡目の最後の順位に回され、引き続きトレードできません。
              </>,
              <>
                <b>凍結の解除：</b>反対に、その後の4シーズンのうち3シーズン以上で2nd Apron以下に収めると、凍結は解除されます。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 制限の対象となる取引の細かな条件や例外は、ここでは省略しています。詳細は下の公式資料（CBA・CBA 101）を参照してください。
          </p>
        </Section>

        {/* 6. チーム編成・トレードへの影響 */}
        <Section kicker="Team building" title="チーム編成・トレードに与える影響">
          <Bullets
            items={[
              <>
                <b>FAでの補強が限られる：</b>1st Apronを超えるチームは通常のMLEやBi-annual Exceptionを使えないため、他チームのFA選手に提示できる条件が限られます。
              </>,
              <>
                <b>トレードの組み方が変わる：</b>2nd Apronを超えるチームは、複数選手の年俸をまとめて1人の選手と交換する形のトレード例外を使えず、トレードで現金を出すこともできません。
              </>,
              <>
                <b>シーズン中の補強にも影響：</b>1st Apronを超えるチームは、シーズン中に契約を解除された高年俸の選手を獲得できないなど、シーズン途中の補強手段も限られます。
              </>,
              <>
                <b>将来の指名権を取引材料にしにくい：</b>2nd Apronを超えると7年後の1巡目指名権が凍結されるため、その指名権をトレードに使えなくなります。
              </>,
              <>
                <b>オフシーズン前のトレードは翌年度でも判定：</b>レギュラーシーズン終了から6月30日までの一部のトレードは、翌年度の年俸総額と基準額でもApronを超えないかが判定されます。
              </>,
              <>
                <b>年俸総額を抑える判断：</b>こうした制限を避けるため、Apronを下回るように年俸総額を調整するかどうかが、編成上の大きな判断材料になります。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ"]} label="NBAサラリーキャップとは？（基本の仕組み・例外）" />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーマッチング"]} label="NBAのサラリーマッチングとは？（トレードで送る年俸と受け取る年俸）" />
        </Section>

        {/* 7. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 8. 公式一次資料 */}
        <OfficialSourcesSection />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
