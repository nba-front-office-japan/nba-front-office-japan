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
  title: "NBAのウェイブ（Waive）とは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのウェイブ（Waive）を初心者向けに解説します。ウェイバーの手続き、他球団によるクレームと優先順位、契約終了後の扱い、年俸総額への影響とStretch、トレード・Buyoutとの違いを公式資料をもとに整理しました。",
};

// 解説文は公式資料をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所:
//   - CBA 付属書A(Uniform Player Contract) 第16条(f)：ウェイバーの手続き(申請は取り消せない、他球団のクレーム、クレームがなければ契約終了)
//   - CBA 第1条(Article I)：「Free Agent」の定義(ウェイバーの手続きで契約が終わったベテラン選手を含む)
//   - CBA 第2条(Article II) Section 9(f)：10日間契約はウェイバーの手続きではなく書面の通知で終了できる
//   - CBA 第7条(Article VII) Section 4(a)(1)(i)：ウェイバーの手続きで契約が終わった選手に支払う年俸もTeam Salaryに含む
//   - CBA 第7条 Section 7(d)(6)：Team Salaryの計算上、ウェイブした選手の年俸を複数年に割り振る(stretch)選択
//   - CBA 第27条(Article XXVII)：Set-off
//   - NBA定款・細則(2018年10月版) 細則5.01〜5.05：ウェイバーの権利・手続き・期間(48時間、土日祝日を含む)・優先順位
//   - CBA 101 II.B(2)(獲得には例外が必要)／II.K(1)／II.L(Stretch)／II.M(Set-off)／VI.A(ウェイバーの期間48時間)
// 再契約の制限、プレーオフ出場資格、特定の期限、特定の選手・チーム・過去事例・金額例・推測・評価は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第1条：Free Agentの定義／第2条 Section 9(f)：10日間契約の終了／第7条 Section 4(a)(1)(i)：Team Salary、Section 7(d)(6)：Stretch／第27条：Set-off／付属書A 第16条(f)：ウェイバーの手続き",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "II.B(2)：例外／II.K(1)：Team Salary／II.L：Stretch／II.M：Set-off／VI.A：ウェイバーの期間",
  },
  {
    title: "National Basketball Association Constitution and By-Laws（PDF・英語）",
    publisher: "NBA",
    date: "2018年10月版",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2018/10/NBA-Constitution-By-Laws-October-2018.pdf",
    note: "細則5.01〜5.05：ウェイバーの権利・手続き・期間・優先順位。NBA公式サイトで公開されている版で、その後の改定は反映されていない可能性があります",
  },
];

// トレード・Buyout・ウェイブ・Stretchの比較:列 = 手続き、行 = 観点
const COMPARE_COLUMNS = ["トレード", "Buyout", "ウェイブ", "Stretch"] as const;
const COMPARE_ROWS: { label: string; values: [string, string, string, string] }[] = [
  {
    label: "何をするか",
    values: [
      "球団どうしの合意で、選手の契約などを相手の球団に移す",
      "球団と選手が合意して契約を修正し、そのうえでウェイバーを申請する",
      "球団がウェイバーを申請し、契約を手放す",
      "ウェイブした選手の年俸を、年俸総額の上でどう計上するかを選ぶ",
    ],
  },
  {
    label: "判断・合意",
    values: [
      "トレードする球団どうし",
      "球団と選手の双方（コミッショナーの承認も必要）",
      "球団の判断（申請は取り消せない）",
      "球団の選択（条件がある）",
    ],
  },
  {
    label: "契約の行方",
    values: [
      "そのまま相手の球団に移る",
      "ウェイバーを通過して契約が終わると、合意した内容が適用される",
      "クレームがあればその球団に移り、なければ契約が終わる",
      "契約の手続きではない（ウェイブで契約が終わったあとの計上の選択）",
    ],
  },
  {
    label: "年俸総額",
    values: [
      "サラリーキャップや例外のルールの範囲で受け入れる",
      "支払う年俸は元の球団の年俸総額に含まれる",
      "支払う年俸は元の球団の年俸総額に含まれる",
      "元の球団の年俸総額に計上する額を、複数のシーズンに割り振る",
    ],
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "ウェイブ（Waive）",
    description: "球団がウェイバーの手続きをとって、選手との契約を手放すこと。",
  },
  {
    term: "ウェイバー（Waivers）",
    description: "契約を手放す選手を、他の球団が獲得（クレーム）できるようにする手続き。期間は48時間。",
  },
  {
    term: "クレーム（Claim）",
    description: "ウェイバーにかけられた選手の契約を、他の球団が引き取ると申し出ること。申し出は取り消せない。",
  },
  {
    term: "Buyout（バイアウト）",
    description: "球団と選手の合意で、契約を途中で終えることの一般的な呼び名。合意のうえでウェイバーの手続きをとる。",
    href: GUIDE_PAGES["Buyout"],
  },
  {
    term: "Stretch",
    description: "ウェイブした選手の残りの年俸を、年俸総額の上で複数のシーズンに割り振って計上する選択。条件がある。",
  },
  {
    term: "Set-off",
    description: "契約を解除された選手が他の球団と契約した場合に、元の球団の支払い義務の一部が減らされる仕組み。",
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
              <th scope="col" className="w-[110px] px-3 py-2.5">項目</th>
              {COMPARE_COLUMNS.map((col) => (
                <th key={col} scope="col" className="px-3 py-2.5 text-[13px] text-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-line align-top last:border-b-0">
                <th scope="row" className="px-3 py-3 text-left font-bold">
                  {row.label}
                </th>
                {row.values.map((value, i) => (
                  <td key={i} className="px-3 py-3 text-pretty [word-break:auto-phrase]">
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
            <div className="border-b-2 border-foreground px-4 py-2.5 font-bold">{col}</div>
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

export default function WaiveGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="トレード・ロスター移動" current="ウェイブ（Waive）" />
      <GuideTitle subject="NBAのウェイブ（Waive）" />
      <p className="mb-8 text-sm text-muted">
        労使協定（CBA）、NBAが作成した労使協定の要点まとめ（CBA 101）、NBAの定款・細則で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "ウェイブは、球団がウェイバーの手続きをとって、選手との契約を手放すことです。",
            "ウェイバーの期間中は他の球団がその契約を引き取る（クレームする）ことができ、クレームがなければ契約は終わります。",
            "契約が終わっても、支払う年俸は元の球団の年俸総額に含まれます。Stretchは、その年俸の計上方法に関する選択です。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な制度の解説です。個別の契約には、ここで扱っていない条件や例外があります。ルールはCBAや定款・細則の改定で変わる可能性があるため、最新の公式資料を確認してください。
        </p>

        {/* 2. ウェイブとは */}
        <Section kicker="What it is" title="ウェイブとは">
          <Bullets
            items={[
              <>
                <b>契約を手放す手続き：</b>ウェイブは、球団が選手との契約を手放すために、ウェイバー（Waivers）の手続きをとることです。「ウェイバーにかける」とも言います。
              </>,
              <>
                <b>球団の判断で申請：</b>ウェイバーは球団の判断で申請でき、選手の合意は必要ありません。一度申請すると、取り消すことはできません。
              </>,
              <>
                <b>トレード以外の移籍の手続き：</b>NBAの細則では、トレードなどを除き、選手の契約や交渉権を他の球団に移すには、ウェイバーの手続きをとらなければならないとされています。
              </>,
              <>
                <b>10日間契約は別の扱い：</b>10日間契約は、ウェイバーの手続きではなく、選手への書面の通知で終えることができます。
              </>,
            ]}
          />
        </Section>

        {/* 3. 手続きの流れ */}
        <Section kicker="How it works" title="ウェイバーの手続きの流れ">
          <ol className="space-y-3">
            {[
              ["球団が申請する", "球団がリーグ（コミッショナーまたはその指名を受けた者）にウェイバーを申請し、リーグが他のすべての球団に通知します。"],
              [
                "他の球団がクレームできる",
                "通知から48時間以内であれば、他の球団はその選手の契約を引き取ると申し出る（クレームする）ことができます。クレームは取り消せません。期間には土日・祝日も含まれます。",
              ],
              ["クレームがあった場合", "契約は、クレームした球団に移ります。選手はその球団に合流します。"],
              [
                "クレームがなかった場合",
                "ウェイバーの期間が終わると、契約は終わります。CBAでは、こうして契約が終わったベテラン選手は「フリーエージェント」とされています。",
              ],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center bg-navy text-xs font-bold text-white">{i + 1}</span>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="text-pretty text-muted [word-break:auto-phrase]">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-xs leading-6 text-muted">
            ※ ウェイバーの期間が終わるまで、選手はウェイバーにかけた球団の財政上の責任のもとにあります。クレームする球団も、サラリーキャップの余裕や例外の範囲で契約を引き取る必要があります。
          </p>
        </Section>

        {/* 4. 優先順位 */}
        <Section kicker="Claim priority" title="クレームの優先順位">
          <Bullets
            items={[
              <>
                <b>成績の低い球団が優先：</b>複数の球団がクレームした場合は、ウェイバーが申請された時点で順位（成績）が最も低い球団が、その選手を獲得します。
              </>,
              <>
                <b>シーズン終了後の一定期間：</b>レギュラーシーズン終了後の一定期間に申請された場合は、前のシーズンの最終的な成績が使われます。
              </>,
              <>
                <b>成績が同じ場合：</b>勝率が同じ球団どうしでは、その球団どうしの対戦成績で決め、それでも決まらない場合はコイントスで決めます。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 優先順位は、NBAの定款・細則（2018年10月版）で確認しました。その後の改定は反映されていない可能性があります。
          </p>
        </Section>

        {/* 5. Buyoutとの違い */}
        <Section kicker="Waive vs. buyout" title="Buyoutとの違い">
          <Bullets
            items={[
              <>
                <b>ウェイブ：</b>球団の判断だけで申請できます。契約で保証された年俸があれば、契約が終わっても球団の支払い義務が残ります。
              </>,
              <>
                <b>Buyout：</b>球団と選手が合意して契約を修正し（コミッショナーの承認が必要）、そのうえで球団がウェイバーを申請します。保証された年俸の減額・取り消しや、Set-offの変更を合意できます。
              </>,
              <>
                <b>共通点：</b>どちらもウェイバーの手続きをとるため、他の球団がクレームできる点は同じです。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["Buyout"]} label="NBAのBuyout（バイアウト）とは？（合意による契約の途中終了）" />
        </Section>

        {/* 6. 年俸総額とStretch */}
        <Section kicker="Team salary & stretch" title="契約終了後の年俸総額への影響とStretch">
          <Bullets
            items={[
              <>
                <b>年俸総額に残る：</b>ウェイバーの手続きで契約が終わった選手に支払う、または支払う予定の年俸は、元の球団の年俸総額（Team Salary）に含まれます。そのため、契約が終わったあとも、元の球団の年俸総額に影響し得ます。
              </>,
              <>
                <b>Set-off：</b>球団の支払い義務が残る選手が他の球団と契約すると、その収入に応じて、元の球団の支払い義務の一部が減らされます。
              </>,
              <>
                <b>Stretchは計上方法の選択：</b>Stretchは、ウェイブした選手の残りの年俸を、年俸総額の上で複数のシーズンに割り振って計上することを、球団が選ぶ仕組みです。CBAでは、年俸総額（Team Salary）を計算するためのルールとして定められています。
              </>,
              <>
                <b>Stretchには条件がある：</b>Stretchを選べる時期や、ウェイブした選手の年俸として計上できる額の上限などの条件があります。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ Stretchの具体的な計算方法や条件は、このページでは扱っていません。正確な条件は下の公式資料（CBA・CBA 101）を確認してください。
          </p>
          <RelatedGuideLink href={GUIDE_PAGES["サラリーマッチング"]} label="NBAのサラリーマッチングとは？（トレードで送る年俸と受け取る年俸）" />
        </Section>

        {/* 7. 比較表 */}
        <Section kicker="Comparison" title="トレード・Buyout・ウェイブ・Stretchの違い">
          <p>
            トレード・Buyout・ウェイブは<b>契約の移籍や終了</b>に関わる手続き、Stretchは<b>ウェイブしたあとの年俸の計上方法</b>に関する選択です。
          </p>
          <CompareTable />
        </Section>

        {/* 8. 関連ガイド */}
        <Section kicker="Related" title="関連ガイド">
          <p>トレードの仕組みや、ロスター枠と契約の種類は、次のガイドで解説しています。</p>
          <RelatedGuideLink href={GUIDE_PAGES["トレードの基本"]} label="NBAトレードの基本（トレードで扱われるもの・時期・ウェイブとの違い）" />
          <RelatedGuideLink href={GUIDE_PAGES["Buyout"]} label="NBAのBuyout（バイアウト）とは？（合意による契約の途中終了）" />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーマッチング"]} label="NBAのサラリーマッチングとは？（トレードで送る年俸と受け取る年俸）" />
          <RelatedGuideLink href={GUIDE_PAGES["ロスター契約・短期契約"]} label="NBAのロスター契約・短期契約とは？（ロスター枠と契約の種類）" />
        </Section>

        {/* 9. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 10. 公式一次資料 */}
        <OfficialSourcesSection sources={SOURCES} />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
