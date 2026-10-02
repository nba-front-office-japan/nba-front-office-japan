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

export const metadata: Metadata = {
  title: "NBAラグジュアリータックスとは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのラグジュアリータックスの仕組み、税額が増える考え方、チーム編成への影響、サラリーキャップ・1st Apron・2nd Apronとの関係を初心者向けに解説します。",
};

// 解説文は CBA と NBA作成の「CBA 101」をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 2026-27シーズンの数値は lib/guide-official.ts の公式発表の値だけを使う。
// 税率は CBA 101 の「2025-26シーズン以降」の値。2026-27シーズンの区分の幅(Tax Bracket Amount)は
// 確認した公式発表に記載が無いため、金額は載せない。

// 超過額の区分ごとの税率(超過額1ドルあたりの税額、2025-26シーズン以降)
const TAX_RATES: { bracket: string; standard: string; repeater: string }[] = [
  { bracket: "1区分目（0〜1区分）", standard: "1.00ドル", repeater: "3.00ドル" },
  { bracket: "2区分目（1〜2区分）", standard: "1.25ドル", repeater: "3.25ドル" },
  { bracket: "3区分目（2〜3区分）", standard: "3.50ドル", repeater: "5.50ドル" },
  { bracket: "4区分目（3〜4区分）", standard: "4.75ドル", repeater: "6.75ドル" },
  { bracket: "5区分目以降", standard: "1区分ごとに0.50ドルずつ上がる", repeater: "1区分ごとに0.50ドルずつ上がる" },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "タックスライン（Tax Level）",
    description: "ラグジュアリータックスがかかり始める年俸総額の基準。サラリーキャップと同じ伸び率で毎年改定される。",
  },
  {
    term: "Tax Team Salary",
    description: "タックスの判定と計算に使う年俸総額。通常の年俸総額から、FA選手の保留額などを除くといった調整をした額。",
  },
  {
    term: "Tax Bracket Amount（区分の幅）",
    description: "超過額を区切る1区分の金額。区分が上がるごとに税率が上がる。サラリーキャップと同じ伸び率で毎年増える。",
  },
  {
    term: "リピーター",
    description: "直近5シーズンのうち4シーズン以上（その年を含む）でタックスを支払っているチーム。通常より高い税率になる。",
  },
  {
    term: "サラリーキャップ",
    description: "1チームが選手に払う年俸総額の基準となる上限。例外を使えば超えて契約できるソフトキャップ。",
    href: GUIDE_PAGES["サラリーキャップ"],
  },
  {
    term: "1st Apron / 2nd Apron",
    description: "タックスラインより上に設定された2つの基準額。超えると使える補強手段が段階的に減る。",
    href: GUIDE_PAGES["1st Apron / 2nd Apron"],
  },
  {
    term: "Non-Taxpayer MLE / Taxpayer MLE",
    description:
      "キャップを超えたチームが使えるミッドレベル例外。1st Apronを超えると、金額の小さいTaxpayer MLEしか使えず、2nd Apronを超えるとそれも使えない。",
  },
];

export default function LuxuryTaxGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="NBA制度" current="ラグジュアリータックス" />
      <GuideTitle subject="NBAラグジュアリータックス" />
      <p className="mb-8 text-sm text-muted">
        数値は2026-27シーズン（2026年7月1日から適用）のNBA公式発表、税率はNBAが作成した労使協定の要点まとめ（CBA 101）にもとづきます。仕組みの解説は公式資料をもとにした当サイト独自の要約です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "ラグジュアリータックスは、年俸総額が「タックスライン」を超えたチームがリーグに支払う税金です。",
            "超えた額が大きいほど、また何年も続けて支払っているほど、税率が高くなります。",
            "高額な選手を集めるほど負担が重くなるため、強いチームほど補強のたびにコストとの勝負になります。",
          ]}
        />

        {/* 2. 仕組み */}
        <Section kicker="How it works" title="ラグジュアリータックスの仕組み">
          <Bullets
            items={[
              <>
                <b>基準はタックスライン：</b>2026-27シーズンのタックスラインは<b>$200.428M（2億42万8,000ドル）</b>です。サラリーキャップより上に設定されています。
              </>,
              <>
                <b>判定はシーズン最終日：</b>レギュラーシーズン最終日の時点で、年俸総額がタックスラインを超えているかどうかで決まります。シーズン途中で超えていても、最終日までに下回れば支払いは発生しません。
              </>,
              <>
                <b>計算に使う年俸総額：</b>通常の年俸総額をもとに、FA選手の保留額やドラフト1巡目指名権の保留額を除くなどの調整をした額（Tax Team Salary）で判定します。
              </>,
              <>
                <b>税金の行き先：</b>集まった税金のうち最大50%は、タックスを支払っておらず最低総年俸も下回っていないチームに分配できます。残りはリーグが決める方法で、各チームへの分配やリーグの事業などに使われます。
              </>,
              <>
                <b>基準額は毎年改定：</b>タックスラインはサラリーキャップと同じ伸び率で、毎年見直されます。
              </>,
            ]}
          />
          <SystemLevelsTable highlight="tax" />
        </Section>

        {/* 3. 税額が増える考え方 */}
        <Section kicker="Tax rates" title="税額が増える考え方">
          <p>
            税額は「タックスラインを超えた額」に税率をかけて決まります。ただし税率は一律ではなく、<b>超過額が大きくなるほど高くなる段階式</b>です。
          </p>
          <Bullets
            items={[
              <>
                <b>超過額を区分に分ける：</b>超過額を一定の幅（Tax Bracket Amount）ごとに区切り、区分が上がるたびに税率が上がります。区分の幅はサラリーキャップと同じ伸び率で毎年増えます。
              </>,
              <>
                <b>繰り返すと税率が上がる：</b>直近5シーズンのうち4シーズン以上（その年を含む）で支払っているチームは「リピーター」となり、どの区分でも通常より1ドルあたり2.00ドル高い税率になります。
              </>,
            ]}
          />

          <h3 className="pt-2 font-bold">超過額1ドルあたりの税額（2025-26シーズン以降）</h3>
          {/* PC: 表 / スマホ: 縦並び */}
          <div className="hidden border border-line sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
                  <th scope="col" className="px-4 py-2.5">超過額の区分</th>
                  <th scope="col" className="px-4 py-2.5 text-right">通常のチーム</th>
                  <th scope="col" className="px-4 py-2.5 text-right">リピーター</th>
                </tr>
              </thead>
              <tbody>
                {TAX_RATES.map((rate) => (
                  <tr key={rate.bracket} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 text-left font-bold">{rate.bracket}</th>
                    {/* 通常とリピーターで同じ説明の行は、1つのセルにまとめる */}
                    {rate.standard === rate.repeater ? (
                      <td colSpan={2} className="px-4 py-3 text-right font-bold">
                        通常・リピーターとも、{rate.standard}
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-right font-bold">{rate.standard}</td>
                        <td className="px-4 py-3 text-right font-bold">{rate.repeater}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="border border-line sm:hidden">
            {TAX_RATES.map((rate) => (
              <div key={rate.bracket} className="border-b border-line px-4 py-3 last:border-b-0">
                <dt className="font-bold">{rate.bracket}</dt>
                <dd className="mt-1 flex flex-wrap gap-x-4 text-sm">
                  {rate.standard === rate.repeater ? (
                    <span>
                      通常・リピーターとも、<b>{rate.standard}</b>
                    </span>
                  ) : (
                    <>
                      <span>
                        通常：<b>{rate.standard}</b>
                      </span>
                      <span>
                        リピーター：<b>{rate.repeater}</b>
                      </span>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-xs leading-6 text-muted">
            出典：NBA「CBA 101」（2024年11月作成）の2025-26シーズン以降の税率。2026-27シーズンの区分の幅（Tax Bracket Amount）は、確認した2026-27シーズンの公式発表に記載が無いため掲載していません。
          </p>

          {/* 実在しない金額の例は使わず、区分が上がるしくみだけを説明する */}
          <h3 className="pt-2 font-bold">計算の考え方</h3>
          <div className="border border-line bg-background px-4 py-3">
            <ul className="space-y-1">
              <li>
                <b>超えた分ごとに税率が変わる：</b>超過額のうち1区分目に入る部分には1区分目の税率、それを超えた部分には2区分目の税率、というように、上の区分に入った部分ほど高い税率がかかります。
              </li>
              <li>
                <b>超えるほど税額の増え方が大きくなる：</b>超過額が大きくなるほど上の区分に入る部分が増えるため、支払う税額は超過額の増え方以上に膨らみます。
              </li>
              <li>
                <b>リピーターはさらに重い：</b>どの区分でも税率が上乗せされるため、同じ超過額でも通常のチームより税額が大きくなります。
              </li>
            </ul>
          </div>
        </Section>

        {/* 4. チーム編成への影響 */}
        <Section kicker="Team building" title="チーム編成に与える影響">
          <p>
            ラグジュアリータックスは「払えば超えてよい」仕組みですが、<b>超えるほど1人を加えるコストが年俸以上に膨らむ</b>ため、チームの判断に大きく影響します。
          </p>
          <Bullets
            items={[
              <>
                <b>補強の実際のコストは「年俸＋税金」：</b>上の区分にいるチームが選手を加えると、年俸に加えて、その何倍もの税金がかかることがあります。
              </>,
              <>
                <b>シーズン中の年俸整理：</b>判定はレギュラーシーズン最終日のため、それまでにトレードなどで年俸を減らし、タックスラインを下回ろうとする動きが起こります。
              </>,
              <>
                <b>リピーターを避ける判断：</b>支払いが続くとリピーターの高い税率になるため、数年に一度はタックスラインを下回るシーズンを作ることが重視される場合があります。
              </>,
              <>
                <b>分配金を受け取れない：</b>タックスを支払うチームは、支払っていないチームへの分配を受けられないため、実際の差はさらに広がります。
              </>,
              <>
                <b>最後はオーナーの判断：</b>税金はチームが負担する支出です。どこまで支払って優勝を目指すかは、オーナーの投資判断に左右されます。
              </>,
            ]}
          />
        </Section>

        {/* 5. サラリーキャップ・Apronとの関係 */}
        <Section
          kicker="Cap & Aprons"
          title={
            <>
              サラリーキャップ・<span className="whitespace-nowrap">1st Apron</span>・
              <span className="whitespace-nowrap">2nd Apronとの関係</span>
            </>
          }
        >
          <p>
            タックスラインは、年俸総額の4つの基準額のうち2段目にあたります。ラグジュアリータックスが「超えたら税金を払う」仕組みなのに対し、Apronは「超えるとその補強自体ができない」制限である点が大きな違いです。
          </p>
          <LevelLadder
            highlight="タックスライン"
            steps={[
              ["サラリーキャップ", "ここを下回っていれば、キャップスペースで自由に補強できる"],
              ["タックスライン", "超えるとラグジュアリータックスを支払う（このページ）"],
              ["1st Apron", "税金に加えて、一部の補強手段が使えなくなる"],
              ["2nd Apron", "さらに厳しい制限と、ドラフト指名権へのペナルティ"],
            ]}
          />
          <Bullets
            items={[
              <>
                <b>サラリーキャップとタックスラインの間：</b>キャップは超えていても税金はかかりません。例外（MLEなど）を使って補強します。
              </>,
              <>
                <b>タックスラインと1st Apronの間：</b>税金はかかりますが、補強手段の制限はまだ大きくありません。
              </>,
              <>
                <b>1st Apronを超える：</b>税金に加えて、通常のMLE（Non-Taxpayer MLE）やサイン・アンド・トレードでの獲得などが使えなくなります。
              </>,
              <>
                <b>2nd Apronを超える：</b>トレードでの年俸の合算や現金の支払いもできなくなり、ドラフト1巡目指名権が凍結されるペナルティもあります。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["1st Apron / 2nd Apron"]} label="NBAの1st Apronと2nd Apronとは？（制限の内容・指名権のペナルティ）" />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ"]} label="NBAサラリーキャップとは？（基本の仕組み・Apronの制限）" />
        </Section>

        {/* 6. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 7. 公式一次資料 */}
        <OfficialSourcesSection />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
