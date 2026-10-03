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
  title: "NBAのBuyout（バイアウト）とは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAで「Buyout（バイアウト）」と呼ばれる、球団と選手の合意による契約の途中終了を初心者向けに解説します。双方の合意、契約終了後の選手の扱い、残る支払い、年俸総額上の扱い、トレード・ウェイブとの違いを公式資料をもとに整理しました。",
};

// 解説文は公式資料をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所:
//   - CBA 第1条(Article I)：「Free Agent」の定義(ウェイバーの手続きで契約が終わったベテラン選手を含む)
//   - CBA 第2条(Article II) Section 3(p)：既存の契約を期間満了前に終えるための修正(コミッショナーの承認後にウェイバーを申請、
//     ウェイバーを通過して契約が終わった場合に保証額の減額・取り消し、Set-offの変更・取り消し)
//   - CBA 第7条(Article VII) Section 4(a)(1)(i)：ウェイバーの手続きで契約が終わった選手に支払う年俸もTeam Salaryに含む(stretchを選んだ場合は配分後の額)
//   - CBA 第27条(Article XXVII) Section 1・4：Set-off(他球団での収入による支払い義務の減額)と、合意による変更
//   - CBA 付属書A(Uniform Player Contract) 第16条(f)：ウェイバーの手続き
//   - CBA 101 II.D・II.E(タックス・ApronはTeam Salaryをもとに計算)／II.K(1)(ウェイブした選手の年俸もTeam Salaryに含む)／
//     II.L(stretch)／II.M(Set-off)／VI.A(ウェイバーの期間48時間)
// 「Buyout」はCBAで定義された言葉ではないため、CBA 第2条 Section 3(p)の手続きとして説明する。
// ウェイブの詳しい手続き・再契約の制限・プレーオフ出場資格・期限などは、確認できない内容を補わず、今後の「ウェイブ」ガイドへ誘導する。
// 特定の選手・チーム・過去事例・金額例・推測・評価は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第1条：Free Agentの定義／第2条 Section 3(p)：合意による契約の途中終了／第7条 Section 4(a)(1)(i)：Team Salaryの計算／第27条：Set-off／付属書A 第16条(f)：ウェイバーの手続き",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "II.D・II.E：タックス・Apronの判定／II.K(1)：Team Salary／II.L：Stretch／II.M：Set-off／VI.A：ウェイバーの期間",
  },
];

// トレード・ウェイブ・Buyoutの比較:列 = 手続き、行 = 観点
const COMPARE_COLUMNS = ["トレード", "ウェイブ（Waive）", "Buyout（バイアウト）"] as const;
const COMPARE_ROWS: { label: string; values: [string, string, string] }[] = [
  {
    label: "何をするか",
    values: [
      "球団どうしの合意で、選手の契約などを相手の球団に移す",
      "球団がウェイバー（他球団への公示）を申請し、契約を手放す",
      "球団と選手が合意して契約を修正し、そのうえで球団がウェイバーを申請する",
    ],
  },
  {
    label: "必要な合意",
    values: [
      "トレードする球団どうし（リーグへの申告も必要）",
      "球団の判断で申請できる（申請は取り消せない）",
      "球団と選手の双方（契約の修正にはコミッショナーの承認が必要）",
    ],
  },
  {
    label: "契約の行方",
    values: [
      "契約はそのまま相手の球団に移る",
      "他球団が獲得を申し出れば、その球団に契約が移る。申し出がなければ契約は終わる",
      "ウェイバーの手続きを通過して契約が終わると、合意した内容が適用される",
    ],
  },
  {
    label: "選手のその後",
    values: [
      "相手の球団の選手になる",
      "契約が終わったベテラン選手は、フリーエージェントになる",
      "ウェイブと同じく、契約が終わったベテラン選手はフリーエージェントになる",
    ],
  },
  {
    label: "残る支払い",
    values: [
      "トレードのルール（サラリーマッチングなど）に従う",
      "保証された年俸があれば、契約が終わっても支払い義務が残る",
      "保証された年俸の減額・取り消しや、Set‑offの変更・取り消しを合意できる",
    ],
  },
  {
    label: "年俸総額",
    values: [
      "サラリーキャップや例外のルールの範囲で受け入れる",
      "支払う年俸は、元の球団の年俸総額に含まれる",
      "ウェイブと同じく、支払う年俸は元の球団の年俸総額に含まれる",
    ],
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "Buyout（バイアウト）",
    description:
      "球団と選手の合意で契約を途中で終えることの一般的な呼び名。CBAで定義された言葉ではなく、CBA 第2条 Section 3(p)の手続きにあたる。",
  },
  {
    term: "ウェイバー（Waivers）",
    description: "契約を手放す選手を、他の球団が獲得できるようにする手続き。期間は48時間。",
  },
  {
    term: "保証された年俸（Compensation protection）",
    description: "契約が途中で終わっても支払われることが契約で決められている年俸。",
  },
  {
    term: "Set-off",
    description: "契約を解除された選手が他の球団と契約した場合に、元の球団の支払い義務の一部が減らされる仕組み。",
  },
  {
    term: "Stretch",
    description: "ウェイブした選手の残りの年俸を、サラリーキャップ上で複数のシーズンに分けて計上する選択。条件がある。",
  },
  {
    term: "年俸総額（Team Salary）",
    description: "サラリーキャップと比べる、チームの選手の年俸などの合計。ウェイブした選手に支払う年俸も含まれる。",
    href: GUIDE_PAGES["サラリーキャップ"],
  },
];

function CompareTable() {
  return (
    <>
      {/* PC: 表 / スマホ: 手続きごとの縦並び */}
      <div className="hidden border border-line md:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
              <th scope="col" className="w-[140px] px-4 py-2.5">項目</th>
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
                <th scope="row" className="px-4 py-3 text-left font-bold">
                  {row.label}
                </th>
                {row.values.map((value, i) => (
                  <td key={i} className="px-4 py-3 text-pretty [word-break:auto-phrase]">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {COMPARE_COLUMNS.map((col, ci) => (
          <dl key={col} className="border border-line">
            <div className="border-b-2 border-foreground px-4 py-2.5 font-bold [word-break:auto-phrase]">{col}</div>
            {COMPARE_ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-[96px_1fr] gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
                <dt className="text-xs font-bold text-muted">{row.label}</dt>
                <dd className="text-pretty [word-break:auto-phrase]">{row.values[ci]}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </>
  );
}

export default function BuyoutGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="トレード・ロスター移動" current="Buyout（バイアウト）" />
      <GuideTitle subject="NBAのBuyout（バイアウト）" />
      <p className="mb-8 text-sm text-muted">
        労使協定（CBA）と、NBAが作成した労使協定の要点まとめ（CBA 101）で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "Buyout（バイアウト）は、球団と選手が合意して、契約を期間の途中で終えることの一般的な呼び名です。",
            "CBAで定義された制度名ではなく、CBAでは「契約を途中で終えるための契約の修正」として定められています。",
            "球団と選手の双方の合意が必要で、そのうえでウェイバーの手続きをとります。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な制度の解説です。個別の契約には、ここで扱っていない条件や例外があります。ルールはCBAの改定などで変わる可能性があるため、最新の公式資料を確認してください。
        </p>

        {/* 2. Buyoutとは */}
        <Section kicker="What it is" title="Buyoutとは">
          <Bullets
            items={[
              <>
                <b>一般的な呼び名：</b>「Buyout」は、球団と選手の合意で契約を期間の途中で終えることを指して使われる言葉です。
              </>,
              <>
                <b>CBAの制度名ではない：</b>「Buyout」という言葉は、CBAで定義されていません。CBA 第2条 Section 3(p)では、すでにある契約を期間満了前に終えるために、球団と選手が契約に加えられる修正の内容が定められています。
              </>,
              <>
                <b>ウェイブとの関係：</b>この修正は、球団がウェイバーの手続きをとることを前提にしています。つまりBuyoutは、ウェイブの手続きの前に、球団と選手が支払いなどの条件を合意しておくものです。
              </>,
            ]}
          />
        </Section>

        {/* 3. 双方の合意 */}
        <Section kicker="Mutual agreement" title="球団と選手の双方の合意が必要">
          <p>CBAで定められている修正の内容は、次のとおりです。</p>
          <Bullets
            items={[
              <>
                <b>契約の修正：</b>球団と選手が合意して、すでにある契約に修正を加えます。この修正には、コミッショナーの承認が必要です。
              </>,
              <>
                <b>ウェイバーの申請：</b>修正がコミッショナーに承認されると、球団はすぐにウェイバーを申請します。
              </>,
              <>
                <b>合意した内容の適用：</b>選手がウェイバーの手続きを通過して契約が終わった場合、契約で保証されていた年俸の減額・取り消しや、球団のSet-offの権利の変更・取り消しが適用されます。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 球団だけの判断でできるウェイブと違い、Buyoutは選手の合意がなければ成り立ちません。
          </p>
        </Section>

        {/* 4. 契約終了後 */}
        <Section kicker="After the contract ends" title="契約終了後の選手の扱いと残る支払い">
          <Bullets
            items={[
              <>
                <b>選手の扱い：</b>CBAでは、ウェイバーの手続きで契約が終わったベテラン選手は「フリーエージェント」とされています。
              </>,
              <>
                <b>残る支払い：</b>契約で保証された年俸があれば、契約が終わったあとも球団の支払い義務が残ります。Buyoutでは、その保証額を減らしたり、なくしたりすることを合意できます。
              </>,
              <>
                <b>Set-off：</b>球団の支払い義務が残る選手が他の球団と契約すると、その収入に応じて、元の球団の支払い義務の一部が減らされます。Buyoutでは、このSet-offの権利を変更したり、なくしたりすることも合意できます。
              </>,
            ]}
          />
        </Section>

        {/* 5. キャップ・タックス上の扱い */}
        <Section kicker="Cap & tax" title="サラリーキャップ・タックス上の扱い">
          <Bullets
            items={[
              <>
                <b>年俸総額に含まれる：</b>ウェイバーの手続きで契約が終わった選手に支払う、または支払う予定の年俸は、元の球団の年俸総額（Team Salary）に含まれます。Buyoutもウェイバーの手続きをとるため、同じ扱いになります。
              </>,
              <>
                <b>Stretch：</b>球団は条件を満たせば、ウェイブした選手の残りの年俸を、サラリーキャップ上で複数のシーズンに分けて計上することを選べます。
              </>,
              <>
                <b>タックス・Apron：</b>ラグジュアリータックスやApronの判定に使う年俸総額も、このTeam Salaryをもとに計算されます（それぞれ一部の調整があります）。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 具体的な計算方法やStretchの条件は、このページでは扱っていません。正確な条件は下の公式資料（CBA・CBA 101）を確認してください。
          </p>
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ"]} label="NBAサラリーキャップとは？（基本の仕組み・例外）" />
        </Section>

        {/* 6. 比較表 */}
        <Section kicker="Trade vs. waive vs. buyout" title="トレード・ウェイブとの違い">
          <p>
            トレードは<b>相手の球団との取引</b>、ウェイブは<b>球団の判断で契約を手放す手続き</b>、Buyoutは<b>球団と選手の合意で契約を終える手続き</b>です。
          </p>
          <CompareTable />
          <p className="border-l-4 border-line bg-[#f3f6fb] px-4 py-2.5 text-xs leading-6 text-muted dark:bg-white/[.04]">
            ウェイブの詳しい手続き、再契約の制限、プレーオフの出場資格、期限などは、今後の個別ガイド「ウェイブ」で解説する予定です（準備中）。
          </p>
        </Section>

        {/* 7. 関連ガイド */}
        <Section kicker="Related" title="関連ガイド">
          <p>トレードの仕組みや、ロスター枠と契約の種類は、次のガイドで解説しています。</p>
          <RelatedGuideLink href={GUIDE_PAGES["トレードの基本"]} label="NBAトレードの基本（トレードで扱われるもの・時期・ウェイブとの違い）" />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーマッチング"]} label="NBAのサラリーマッチングとは？（トレードで送る年俸と受け取る年俸）" />
          <RelatedGuideLink href={GUIDE_PAGES["ロスター契約・短期契約"]} label="NBAのロスター契約・短期契約とは？（ロスター枠と契約の種類）" />
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
