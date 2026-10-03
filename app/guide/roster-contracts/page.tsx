import type { ReactNode } from "react";
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
  title: "NBAのロスター契約・短期契約とは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのTwo-Way契約（2-way契約）、Exhibit 10、10日間契約、ハードシップによる10日間契約の対象者・契約期間・ロスター枠との関係を、通常の契約（Standard NBA Contract）との違いとあわせて初心者向けに解説します。",
};

// 解説文は公式資料をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所:
//   - CBA 第1条(Article I)：Standard NBA Contract(Two-Way Contract以外の契約)・Active List・Inactive List・Two-Way Contractの定義
//   - CBA 第2条(Article II) Section 3(s)・Section 11(h)：Exhibit 10(ボーナス、2-way契約への変更、保証額)
//   - CBA 第2条 Section 9：10日間契約(1月5日以降、同じ選手とは1シーズン2回まで、ロスター人数に応じた上限、ハードシップの場合)
//   - CBA 第2条 Section 10：シーズン残りの契約(Rest-of-Season Contract)
//   - CBA 第2条 Section 11：Two-Way Contract(NBAチームとGリーグ・チームの両方で役務を提供する契約、年俸)
//   - CBA 第29条(Article XXIX) Section 1・2：ロスター人数(14〜15人、12〜13人の例外、オフシーズン21人、ハードシップで15人超)
//   - CBA 101 II.O(ロスター人数)、III.A〜C(Gリーグへの派遣、Two-Way Contract、Exhibit 10)
// 2026-27シーズン固有の金額(Two-Way契約の年俸、Exhibit 10のボーナス上限など)は、一次資料で確認できた範囲が
// 2023-24・2024-25の金額までのため、このページには載せない。
// ハードシップの承認条件はNBAのハードシップ・ルールで決まり、確認したCBA・CBA 101には具体的な条件が書かれていないため載せない。
// 選手やチームの事例、推測、未確認の例外は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第1条：用語の定義／第2条 Section 3(s)・11(h)：Exhibit 10、Section 9：10日間契約、Section 10：シーズン残りの契約、Section 11：Two-Way契約／第29条 Section 1・2：ロスター人数",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "II.O：ロスター人数／III.A：Gリーグへの派遣、III.B：Two-Way契約、III.C：Exhibit 10",
  },
];

type ContractItem = { label: string; body: ReactNode };

const STANDARD_ITEMS: ContractItem[] = [
  {
    label: "対象者",
    body: "CBAでは、Two-Way契約以外の選手契約を「Standard NBA Contract」と呼びます。10日間契約も、Two-Way契約ではないため、この中に含まれます。",
  },
  {
    label: "契約期間・扱い",
    body: "契約期間や年俸は、MAX契約・ミニマム契約・各種の例外など、それぞれのルールの範囲で決まります。",
  },
  {
    label: "ロスター枠との関係",
    body: "レギュラーシーズン中は、アクティブ・リストとインアクティブ・リストの合計で14人または15人を保つ必要があります（12人・13人は、連続2週間まで・合計28日まで）。",
  },
  {
    label: "Gリーグとの関係",
    body: "在籍年数2年以下の選手は、チームがGリーグへ派遣できます。2年を超える選手は、本人と選手会の同意があれば派遣できます。派遣中もNBAの年俸が支払われ、NBAチームのロスターに含まれます。",
  },
];

const TWO_WAY_ITEMS: ContractItem[] = [
  {
    label: "対象者",
    body: "契約期間中のどこかで在籍年数が4年以上になる（可能性がある）選手は、原則として結べません。また、同じチームとのTwo-Way契約は、合計で3シーズン（サラリーキャップ年度）を超えられません。",
  },
  {
    label: "契約期間・扱い",
    body: "期間は1シーズンまたは2シーズンで、オプション年は付けられません。NBAチームとGリーグ・チームの両方でプレーする契約で、年俸は在籍年数0年の選手の最低年俸の50%です（シーズン途中の契約は日割り）。",
  },
  {
    label: "ロスター枠との関係",
    body: "各チームは、Standard NBA Contractの最大15人とは別に、最大3人と結べます。レギュラーシーズンでアクティブ・リストに入れるのは50試合まで（シーズン途中の契約は日割り）で、プレーオフ・プレーインのロスターには入れません。",
  },
  {
    label: "主な用途",
    body: "チームは、Two-Way契約の選手とStandard NBA Contractを結ぶ独占交渉権を持ち、同じ期間のStandard NBA Contract（その選手の最低年俸）に変更（コンバート）することもできます。",
  },
];

const EXHIBIT10_ITEMS: ContractItem[] = [
  {
    label: "対象者",
    body: "チームと選手の合意で、選手契約に「Exhibit 10」という付属書を付けます。Two-Way契約に変更した場合は、Two-Way契約のルールが適用されます。",
  },
  {
    label: "契約期間・扱い",
    body: "1シーズンだけの契約で、年俸の保証は付けられません。レギュラーシーズン開幕前に解除され、選手がそのチームのGリーグ提携チームで60日間続けてプレーするなどの条件を満たすと、ボーナス（5,000ドル以上、上限あり）を受け取れます。",
  },
  {
    label: "ロスター枠との関係",
    body: "1チームが同時にExhibit 10付きの契約を結べるのは6人までです。Two-Way契約ではないため、Standard NBA Contractとして扱われ、Two-Way契約に変更した場合は、Two-Way契約の別枠に移ります。",
  },
  {
    label: "主な用途",
    body: "チームは開幕前までに、この契約をTwo-Way契約に変更できます。変更した場合や、開幕前に解除しなかった場合は、ボーナスのかわりに同じ額の年俸保証が付きます。",
  },
];

const TEN_DAY_ITEMS: ContractItem[] = [
  {
    label: "対象者",
    body: "Two-Way契約ではない選手契約として結びます。同じチームが同じ選手と10日間契約を結べるのは、1シーズンに2回までです。",
  },
  {
    label: "契約期間・扱い",
    body: "毎シーズン1月5日から結べます。期間は「10日間」と「そのチームの3試合分」の長いほうです。年俸はその選手の最低年俸を、契約の日数に応じて日割りにした額です。レギュラーシーズン最終戦の日以降にかかる10日間契約は結べません。",
  },
  {
    label: "ロスター枠との関係",
    body: "アクティブ・リストとインアクティブ・リストに入り、同時に結べる人数はロスターの人数（Two-Way契約の選手を除く）で決まります：12人なら0人、13人なら1人、14人なら2人、15人なら3人まで。",
  },
  {
    label: "主な用途",
    body: "10日間契約の期間中に、同じ選手と、期間満了の翌日から始まるシーズン残りの契約（Rest-of-Season Contract）を結ぶことができます。チームは書面の通知で契約を終了でき、通常のウェイバー（Waive）の手続きはとりません。",
  },
];

const HARDSHIP_ITEMS: ContractItem[] = [
  {
    label: "対象者",
    body: "NBAがハードシップ・ルールにもとづいて契約を認めた場合に結べます。承認の条件はNBAのルールで決まります。",
  },
  {
    label: "契約期間・扱い",
    body: "いつ結んでも10日間契約として扱われ、1月5日より前でも結べます。期間がレギュラーシーズン最終戦の日以降にかかる場合は、シーズン終了までの残り日数が期間になります。",
  },
  {
    label: "ロスター枠との関係",
    body: "通常はアクティブ・リストとインアクティブ・リストの合計が15人までですが、ハードシップで契約を認められた場合は15人を超えられます。",
  },
  {
    label: "主な用途",
    body: "ロスターの人数を通常の上限を超えて確保するための、NBAの承認にもとづく10日間契約です。",
  },
];

// 比較表:列 = 契約形態、行 = 観点
const COMPARE_COLUMNS = ["Exhibit 10", "Two-Way契約", "10日間契約"] as const;
const COMPARE_ROWS: { label: string; values: [string, string, string] }[] = [
  {
    label: "契約の種類",
    values: ["選手契約に付ける付属書", "NBAとGリーグの両方でプレーする契約", "Standard NBA Contractの一種"],
  },
  {
    label: "期間",
    values: ["1シーズンのみ", "1シーズンまたは2シーズン", "10日間と3試合分の長いほう"],
  },
  {
    label: "時期の決まり",
    values: ["2-wayへの変更・ボーナスの条件は開幕前の解除が前提", "シーズン途中の契約は年俸と出場上限が日割り", "1月5日から（ハードシップは別）"],
  },
  {
    label: "1チームの上限",
    values: ["同時に6人まで", "同時に3人まで", "ロスター人数に応じて0〜3人"],
  },
  {
    label: "ロスター枠",
    values: ["Standard NBA Contractとして数える", "15人とは別枠", "15人の中に入る"],
  },
  {
    label: "年俸・お金",
    values: ["保証なし。条件を満たすとボーナス", "最低年俸（0年）の50%", "その選手の最低年俸の日割り"],
  },
  {
    label: "Gリーグとの関係",
    values: ["提携チームで60日間プレーがボーナスの条件", "NBAとGリーグの両方でプレー", "このページでは扱っていません"],
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "Standard NBA Contract",
    description: "CBAで、Two-Way契約以外の選手契約を指す言葉。10日間契約も含まれる。",
  },
  {
    term: "Two-Way契約（2-way契約）",
    description: "NBAチームとGリーグ・チームの両方でプレーする契約。各チーム最大3人で、15人のロスター枠とは別。",
  },
  {
    term: "Exhibit 10",
    description: "1シーズンの選手契約に付ける付属書。開幕前の解除後にGリーグでプレーした場合のボーナスや、Two-Way契約への変更を定める。",
  },
  {
    term: "10日間契約（10-Day Contract）",
    description: "1月5日から結べる短期の契約。期間は10日間と3試合分の長いほうで、同じチーム・同じ選手とは1シーズン2回まで。",
  },
  {
    term: "ハードシップ（Hardship）",
    description: "NBAが認めた場合に、15人を超えて選手と10日間契約を結べる仕組み。",
  },
  {
    term: "アクティブ・リスト／インアクティブ・リスト",
    description: "試合に出られる選手の登録と、出られない選手の登録。レギュラーシーズン中は合計14〜15人を保つ。",
  },
  {
    term: "最低年俸",
    description: "在籍年数ごとに決まる年俸の下限。10日間契約やTwo-Way契約の年俸の基準になる。",
    href: GUIDE_PAGES["ミニマム契約"],
  },
];

function ContractBlock({ items }: { items: ContractItem[] }) {
  return (
    <dl className="divide-y divide-line border border-line">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[150px_1fr] sm:gap-4">
          <dt className="font-bold">{item.label}</dt>
          <dd className="text-pretty">{item.body}</dd>
        </div>
      ))}
    </dl>
  );
}

function CompareTable() {
  return (
    <>
      {/* PC: 表 / スマホ: 契約形態ごとの縦並び */}
      <div className="hidden border border-line md:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
              <th scope="col" className="w-[140px] px-4 py-2.5">項目</th>
              {COMPARE_COLUMNS.map((col) => (
                <th key={col} scope="col" className="px-4 py-2.5 text-[13px] text-foreground">
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

export default function RosterContractsGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="契約" current="ロスター契約・短期契約" />
      <GuideTitle subject="NBAのロスター契約・短期契約" />
      <p className="mb-8 text-sm text-muted">
        労使協定（CBA）と、NBAが作成した労使協定の要点まとめ（CBA 101）で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "NBAの選手契約は、Two-Way契約と、それ以外の通常の契約（Standard NBA Contract）に分かれます。",
            "Two-Way契約はNBAとGリーグの両方でプレーする契約で、各チーム最大3人まで、15人のロスター枠とは別に結べます。",
            "Exhibit 10は開幕前の契約に付ける付属書、10日間契約は1月5日から結べる短期の契約で、どちらも細かな上限や条件があります。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な制度の解説です。個別の契約には、ここで扱っていない条件や例外があります。金額は毎シーズン変わるため、具体的な額は最新の公式資料を確認してください。
        </p>

        {/* 2. 比較表 */}
        <Section kicker="Comparison" title="Exhibit 10・Two-Way契約・10日間契約の違い">
          <p>3つの契約形態の主な違いを、一覧にまとめました。詳しい条件は、下の各項目で説明しています。</p>
          <CompareTable />
          <p className="text-xs leading-6 text-muted">
            ※ 「ロスター枠」の15人は、レギュラーシーズン中のアクティブ・リストとインアクティブ・リストの合計人数を指します。開幕前までは、Two-Way契約の選手を含めて最大21人まで契約できます。
          </p>
        </Section>

        {/* 3. Standard NBA Contract・ロスター枠 */}
        <Section kicker="Standard contract & roster" title="通常の契約（Standard NBA Contract）とロスター枠">
          <ContractBlock items={STANDARD_ITEMS} />
          <Bullets
            items={[
              <>
                <b>レギュラーシーズン中：</b>Standard NBA Contractの選手（アクティブ・リストとインアクティブ・リストの合計）を14人または15人にします。
              </>,
              <>
                <b>Two-Way契約は別枠：</b>この15人とは別に、Two-Way契約の選手を最大3人まで持てます。
              </>,
              <>
                <b>オフシーズン・トレーニングキャンプ：</b>レギュラーシーズン開幕前までは、Two-Way契約の選手を含めて最大21人まで契約できます。
              </>,
              <>
                <b>15人を超える場合：</b>NBAがハードシップ・ルールにもとづいて契約を認めた場合などは、15人を超えられます。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["Buyout"]} label="NBAのBuyout（バイアウト）とは？（合意による契約の途中終了）" />
        </Section>

        {/* 4. Two-Way */}
        <Section kicker="Two-Way Contract" title="Two-Way契約（2-way契約）">
          <ContractBlock items={TWO_WAY_ITEMS} />
          <p className="text-xs leading-6 text-muted">
            ※ 在籍年数4年の選手でも、過去にレギュラーシーズンを通してロスターに入りながら試合に出なかったシーズンがある場合は、1シーズンのTwo-Way契約を結べるという例外があります。Two-Way契約の選手は、契約から30日間はトレードできません。
          </p>
        </Section>

        {/* 5. Exhibit 10 */}
        <Section kicker="Exhibit 10" title="Exhibit 10">
          <ContractBlock items={EXHIBIT10_ITEMS} />
          <p className="text-xs leading-6 text-muted">
            ※ ボーナスの上限額は、2023-24シーズンを7万5,000ドルとし、以後はサラリーキャップの伸びに合わせて毎年変わるとCBAに定められています。2026-27シーズンの上限額は、一次資料で確認できなかったため掲載していません。
          </p>
        </Section>

        {/* 6. 10日間契約 */}
        <Section kicker="10-Day Contract" title="10日間契約（10-Day Contract）">
          <ContractBlock items={TEN_DAY_ITEMS} />
        </Section>

        {/* 7. ハードシップ */}
        <Section kicker="Hardship" title="ハードシップによる10日間契約（10-Day Hardship Exception Contract）">
          <ContractBlock items={HARDSHIP_ITEMS} />
          <p className="text-xs leading-6 text-muted">
            ※ ハードシップが認められる具体的な条件は、NBAのハードシップ・ルールで決まります。確認したCBA・CBA 101には具体的な条件が書かれていないため、このページでは扱っていません。
          </p>
        </Section>

        {/* 8. Gリーグとの関係 */}
        <Section kicker="G League" title="Gリーグとの関係">
          <Bullets
            items={[
              <>
                <b>Standard NBA Contractの選手：</b>在籍年数2年以下ならチームの判断で、2年を超える場合は本人と選手会の同意があれば、Gリーグに派遣できます。回数の制限はなく、派遣中もNBAの年俸が支払われます。
              </>,
              <>
                <b>Two-Way契約の選手：</b>NBAチームとGリーグ・チームの両方でプレーする契約です。NBAのアクティブ・リストに入れる試合数には上限があります。
              </>,
              <>
                <b>Exhibit 10の選手：</b>開幕前に契約を解除され、Gリーグと契約してそのチームの提携チームで60日間続けてプレーすることなどが、ボーナスを受け取る条件です。
              </>,
            ]}
          />
        </Section>

        {/* 9. 2026-27シーズンの金額 */}
        <Section kicker="2026-27" title="2026-27シーズンの金額について">
          <p>
            Two-Way契約の年俸やExhibit 10のボーナス上限などの具体的な金額は、毎シーズン変わります。NBAが公表した2026-27シーズンのサラリーキャップ等の発表（NBA Communications・NBA.com）には、これらの金額が記載されていないため（2026年10月3日確認）、このページには載せていません。
          </p>
          <RelatedGuideLink href={GUIDE_PAGES["ミニマム契約"]} label="NBAのミニマム契約とは？（最低年俸の決まり方）" />
        </Section>

        {/* 10. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 11. 公式一次資料 */}
        <OfficialSourcesSection sources={SOURCES} />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
