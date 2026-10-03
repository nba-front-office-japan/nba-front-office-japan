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
  title: "NBAのサラリーマッチングとは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのトレードで送る年俸と受け取る年俸の関係（サラリーマッチング）を初心者向けに解説します。サラリーキャップ、ラグジュアリータックス、1st Apron・2nd Apronによって使えるトレードの方法がどう変わるかを、公式資料をもとに整理しました。",
};

// 解説文は公式資料をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所:
//   - CBA 第7条(Article VII) Section 2(e)：Apronによる取引の制限(取引直後のApron Team Salaryで判定、以後その年度は超えられない)
//   - CBA 第7条 Section 6(j)：Traded Player Exception(Standard・Aggregated Standard・Expanded)
//   - CBA 第7条 Section 8(a)：トレードでの現金の上限
//   - CBA 101 II.B(1)：キャップの余裕／II.B(2)：例外を使わなければキャップを超えられない／II.B(2)(i)：Traded Player Exceptionの種類と使える時期／
//     II.D：タックスの判定(レギュラーシーズン最終日)／II.E：Apronによる取引の制限
// 「サラリーマッチング」はCBAで定義された言葉ではないため、上記のルールの総称として説明する。
// 受け入れられる額の計算式・割合・金額、トレード例、特定の選手・チーム、架空の取引、推測・評価は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第7条（Article VII）Section 2(e)：Apronによる取引の制限／Section 6(j)：Traded Player Exception／Section 8(a)：トレードでの現金",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "II.B(1)・(2)：キャップの余裕と例外／II.B(2)(i)：Traded Player Exception／II.D：タックスの判定／II.E：Apronによる取引の制限",
  },
];

// 比較表:列 = 取引直後の年俸総額の位置、行 = トレードの方法
const COMPARE_COLUMNS = ["1st Apron以下（通常）", "1st Apronを超える", "2nd Apronを超える"] as const;
type Mark = "可" | "不可" | string;
const COMPARE_ROWS: { label: string; note?: string; values: [Mark, Mark, Mark] }[] = [
  {
    label: "Standard Traded Player Exception",
    note: "1人の放出に対して受け入れる",
    values: ["可", "可（上乗せ枠なし）", "可（上乗せ枠なし）"],
  },
  {
    label: "前の年度に生じたStandard Traded Player Exception",
    note: "トレードから1年以内なら後日も使える",
    values: ["可", "不可", "不可"],
  },
  {
    label: "Aggregated Standard Traded Player Exception",
    note: "複数の選手の年俸を合算する",
    values: ["可", "可（上乗せ枠なし）", "不可"],
  },
  {
    label: "Expanded Traded Player Exception",
    note: "受け入れられる額の上限が広がる",
    values: ["可", "不可", "不可"],
  },
  {
    label: "サイン・アンド・トレードでの獲得",
    values: ["可", "不可", "不可"],
  },
  {
    label: "サイン・アンド・トレードで放出した選手から生じたException",
    values: ["可", "可", "不可"],
  },
  {
    label: "トレードでの現金の支払い",
    note: "年度ごとの上限の範囲内",
    values: ["可", "可", "不可"],
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "サラリーマッチング",
    description: "トレードで送る年俸と受け取る年俸の関係を、ルールの範囲に収めること。CBAで定義された言葉ではなく、関連するルールの総称。",
  },
  {
    term: "年俸総額（Team Salary）",
    description: "サラリーキャップと比べる、チームの選手の年俸などの合計。Apronやタックスの判定には、それぞれ調整した額を使う。",
  },
  {
    term: "Traded Player Exception",
    description: "サラリーキャップを超えているチームが、トレードで放出した選手の年俸をもとに、別の選手を受け入れるための例外。",
  },
  {
    term: "サイン・アンド・トレード",
    description: "フリーエージェントの選手が元のチームと契約し、そのまま別のチームへトレードされる取引。",
  },
  {
    term: "サラリーキャップ",
    description: "チームの年俸総額の基準となる上限。例外を使わない限り、これを超える契約や獲得はできない。",
    href: GUIDE_PAGES["サラリーキャップ"],
  },
  {
    term: "ラグジュアリータックス",
    description: "年俸総額が基準額を超えたチームが支払う税。レギュラーシーズン最終日の年俸総額で判定される。",
    href: GUIDE_PAGES["ラグジュアリータックス"],
  },
  {
    term: "1st Apron / 2nd Apron",
    description: "タックスの基準額より上に設けられた2つの基準額。超えると使えるトレードや契約の方法が制限される。",
    href: GUIDE_PAGES["1st Apron / 2nd Apron"],
  },
];

function MarkCell({ value }: { value: Mark }) {
  const ng = value === "不可";
  return (
    <span className={ng ? "font-bold text-[#c03221] dark:text-[#ff8a7a]" : "font-bold"}>
      {ng ? "× 不可" : `○ ${value}`}
    </span>
  );
}

function CompareTable() {
  return (
    <>
      {/* PC: 表 / スマホ: 方法ごとの縦並び */}
      <div className="hidden border border-line md:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
              <th scope="col" className="w-[38%] px-4 py-2.5">トレードの方法</th>
              {COMPARE_COLUMNS.map((col) => (
                <th key={col} scope="col" className="px-4 py-2.5 text-[13px] text-foreground [word-break:auto-phrase]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-line align-top last:border-b-0">
                <th scope="row" className="px-4 py-3 text-left font-bold [word-break:auto-phrase]">
                  {row.label}
                  {row.note && <span className="mt-0.5 block text-xs font-normal text-muted">{row.note}</span>}
                </th>
                {row.values.map((value, i) => (
                  <td key={i} className="px-4 py-3 text-pretty [word-break:auto-phrase]">
                    <MarkCell value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {COMPARE_ROWS.map((row) => (
          <dl key={row.label} className="border border-line">
            <div className="border-b-2 border-foreground px-4 py-2.5">
              <p className="font-bold [word-break:auto-phrase]">{row.label}</p>
              {row.note && <p className="text-xs text-muted">{row.note}</p>}
            </div>
            {COMPARE_COLUMNS.map((col, ci) => (
              <div key={col} className="grid grid-cols-[132px_1fr] gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
                <dt className="text-xs font-bold text-muted [word-break:auto-phrase]">{col}</dt>
                <dd className="[word-break:auto-phrase]">
                  <MarkCell value={row.values[ci]} />
                </dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </>
  );
}

export default function SalaryMatchingGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="トレード・ロスター移動" current="サラリーマッチング" />
      <GuideTitle subject="NBAのサラリーマッチング" />
      <p className="mb-8 text-sm text-muted">
        労使協定（CBA）と、NBAが作成した労使協定の要点まとめ（CBA 101）で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "サラリーマッチングは、トレードで送る年俸と受け取る年俸の関係を、ルールの範囲に収めることです。",
            "トレード後の年俸総額がサラリーキャップを超えるチームは、「Traded Player Exception」などの例外の範囲でしか選手を受け入れられません。",
            "1st Apron・2nd Apronを超えると、使えるトレードの方法がさらに限られます。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な制度の解説です。個別のトレードには、ここで扱っていない条件や例外があります。ルールはシーズンごとの基準額の変更やCBAの改定で変わる可能性があるため、最新の公式資料を確認してください。
        </p>

        {/* 2. とは */}
        <Section kicker="What it is" title="サラリーマッチングとは">
          <Bullets
            items={[
              <>
                <b>送る年俸と受け取る年俸の関係：</b>トレードでは、チームが相手に送る選手の年俸と、相手から受け取る選手の年俸が変わるため、取引後の年俸総額がルールの範囲に収まるように組む必要があります。
              </>,
              <>
                <b>CBAの用語ではない：</b>「サラリーマッチング」はCBAで定義された言葉ではありません。このページでは、トレードで受け入れられる年俸に関するCBAのルールをまとめてこう呼んでいます。
              </>,
            ]}
          />
        </Section>

        {/* 3. なぜ必要か */}
        <Section kicker="Why it matters" title="なぜトレードで必要になるのか">
          <Bullets
            items={[
              <>
                <b>キャップを超えるには例外が必要：</b>CBAでは、チームの年俸総額は、例外を使わない限り、契約や獲得によってサラリーキャップを超えてはならないと定められています。
              </>,
              <>
                <b>キャップ以下に収まる場合：</b>トレード後も年俸総額がサラリーキャップ以下に収まるチームは、キャップの余裕（Room）を使って選手を受け入れられます。
              </>,
              <>
                <b>キャップを超える場合：</b>トレード後に年俸総額がサラリーキャップを超えるチームは、「Traded Player Exception」を使って、放出した選手の年俸をもとにした範囲で選手を受け入れます。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ"]} label="NBAサラリーキャップとは？（基本の仕組み・例外）" />
        </Section>

        {/* 4. 送る額と受け取る額 */}
        <Section kicker="Outgoing vs. incoming" title="送る契約額と受け取る契約額の関係">
          <p>キャップを超えるチームが使うTraded Player Exceptionには、主に次の種類があります。受け入れられる額は、いずれも放出した選手の年俸をもとに決まります。</p>
          <Bullets
            items={[
              <>
                <b>Standard Traded Player Exception：</b>1人の選手の放出に対して、その年俸をもとにした範囲で選手を受け入れます。トレードから1年以内であれば、同じトレードの中だけでなく、後日のトレードでも使えます。
              </>,
              <>
                <b>Aggregated Standard Traded Player Exception：</b>同じトレードで放出する複数の選手の年俸を合算し、その範囲で選手を受け入れます。
              </>,
              <>
                <b>Expanded Traded Player Exception：</b>同じトレードの中で使う例外で、Standardより受け入れられる額の上限が広がります。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 受け入れられる額の計算方法や、保証されていない年俸の扱い、合算の制限などの細かな条件は、このページでは扱っていません。正確な条件は下の公式資料（CBA・CBA 101）を確認してください。
          </p>
        </Section>

        {/* 5. 基準額による違い */}
        <Section kicker="Thresholds" title="サラリーキャップ・タックス・Apronによる違い">
          <Bullets
            items={[
              <>
                <b>サラリーキャップ：</b>トレード後の年俸総額がキャップ以下ならキャップの余裕を、超えるならTraded Player Exceptionを使います。
              </>,
              <>
                <b>ラグジュアリータックス：</b>確認したCBA 101では、トレードで使える方法の制限は、タックスの基準額ではなく、サラリーキャップと1st・2nd Apronを基準に定められています。タックスは、レギュラーシーズン最終日の年俸総額が基準額を超えているかどうかで、税を払うかどうかが決まる仕組みです。
              </>,
              <>
                <b>1st Apron：</b>取引の直後に年俸総額（Apronの計算方法によるもの）が1st Apronを超えることになるチームは、Expanded Traded Player Exceptionなどが使えず、Standard・Aggregatedの例外の小さな上乗せ枠もなくなります。
              </>,
              <>
                <b>2nd Apron：</b>取引の直後に2nd Apronを超えることになるチームは、さらに複数の選手の年俸の合算や、トレードでの現金の支払いもできなくなります。
              </>,
              <>
                <b>その年度は超えられない：</b>Apronに関わる制限の対象となる方法を使ったチームは、その年度の残りの期間、該当するApronを超えることができなくなります。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["ラグジュアリータックス"]} label="NBAラグジュアリータックスとは？（税率の考え方・チーム編成への影響）" />
          <RelatedGuideLink href={GUIDE_PAGES["1st Apron / 2nd Apron"]} label="NBAの1st Apronと2nd Apronとは？（制限の内容・指名権のペナルティ）" />
        </Section>

        {/* 6. 比較表 */}
        <Section kicker="Comparison" title="通常のトレード・1st Apron超過・2nd Apron超過の比較">
          <p>トレードの直後の年俸総額（Apronの計算方法によるもの）が、どの基準額を超えるかによって、使えるトレードの方法が変わります。</p>
          <CompareTable />
          <p className="text-xs leading-6 text-muted">
            ※ 「1st Apron以下（通常）」の列で、Traded Player Exceptionを使うのは、トレード後の年俸総額がサラリーキャップを超えるチームです。「前の年度」は、レギュラーシーズン終了から次のレギュラーシーズン終了までを1年として数えます。上乗せ枠とは、Traded Player Exceptionで受け入れられる額に加えられる小さな枠のことです。ルールはシーズンやCBAの改定で変わる可能性があります。
          </p>
        </Section>

        {/* 7. 関連ガイド */}
        <Section kicker="Related" title="関連ガイド">
          <p>トレードの全体像や、基準額そのものの仕組みは、次のガイドで解説しています。</p>
          <RelatedGuideLink href={GUIDE_PAGES["トレードの基本"]} label="NBAトレードの基本（トレードで扱われるもの・時期・ウェイブとの違い）" />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ"]} label="NBAサラリーキャップとは？（基本の仕組み・例外）" />
          <RelatedGuideLink href={GUIDE_PAGES["ラグジュアリータックス"]} label="NBAラグジュアリータックスとは？（税率の考え方・チーム編成への影響）" />
          <RelatedGuideLink href={GUIDE_PAGES["1st Apron / 2nd Apron"]} label="NBAの1st Apronと2nd Apronとは？（制限の内容・指名権のペナルティ）" />
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
