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
  title: "NBAトレードの基本 | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのトレードの仕組みを初心者向けに解説します。トレードで扱われるもの（選手の契約・指名権・現金など）、トレードできる時期、主な制限の概要、ウェイブやBuyoutとの違いを、公式資料をもとに整理しました。",
};

// 解説文は公式資料をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所:
//   - NBA定款・細則(2018年10月版) 細則4.01(トレードできるもの・時期)、4.02(リーグとの電話会議「Trade Call」と成立の条件)、第7.03条(将来の連続する2年の1巡目指名権をトレードで手放せない原則)
//   - CBA 第2条(Article II) Section 3(g)(トレードを禁止・制限する条項)、Section 3(p)(合意による契約の途中終了)
//   - CBA 第7条(Article VII) Section 8：トレードのルール(現金の上限=サラリーキャップの5.15%、1年契約の選手の同意、
//     契約最終シーズンの選手はトレード期限後にトレードできない など)
//   - CBA 第27条(Article XXVII)：Set-off(契約解除後の支払い義務の減額)
//   - CBA 付属書A(Uniform Player Contract) 第16条：契約の解除とウェイバーの手続き
//   - CBA 101 II.B(2)(i)：Traded Player Exception／II.E：Apronによる制限／II.F：指名権の凍結／
//     II.J：トレードのルール(現金、選手の同意、契約直後の待機期間)／VI.A：ウェイバーの期間(48時間)
// 「Buyout」はCBAで定義された言葉ではないため、CBA 第2条 Section 3(p)の手続きとして説明する。
// 特定の選手・チーム・過去の取引事例、推測、評価、金額例は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第2条 Section 3(g)・3(p)：トレードを制限する条項・合意による契約の途中終了／第7条 Section 8：トレードのルール／第27条：Set-off／付属書A 第16条：契約の解除とウェイバー",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "II.B(2)(i)：Traded Player Exception／II.E：Apronによる制限／II.F：指名権の凍結／II.J：トレードのルール／VI.A：ウェイバーの期間",
  },
  {
    title: "National Basketball Association Constitution and By-Laws（PDF・英語）",
    publisher: "NBA",
    date: "2018年10月版",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2018/10/NBA-Constitution-By-Laws-October-2018.pdf",
    note: "細則4.01：トレードできるもの・時期／細則4.02：トレードの手続き／第7.03条：1巡目指名権。NBA公式サイトで公開されている版で、その後の改定は反映されていない可能性があります",
  },
];

const ASSETS: [string, string][] = [
  [
    "選手の契約",
    "選手と球団の契約を、別の球団に移します。Two-Way契約の選手も、契約から30日を過ぎればトレードの対象になります。",
  ],
  [
    "指名した選手の交渉権",
    "ドラフトで指名したものの、まだ契約していない選手と交渉・契約できる権利（Draft Rights）も、トレードの対象になります。",
  ],
  ["ドラフト指名権", "今後のドラフトで選手を指名する権利です。1巡目指名権には、NBAの定款による制限があります。"],
  [
    "現金",
    "トレードにあわせて現金を支払ったり受け取ったりできます。1シーズン（サラリーキャップ年度）の上限は、支払い・受け取りそれぞれでサラリーキャップの5.15%です。",
  ],
];

// トレード・ウェイブ・Buyoutの比較:列 = 手続き、行 = 観点
const COMPARE_COLUMNS = ["トレード", "ウェイブ（Waive）", "Buyout（合意による契約の途中終了）"] as const;
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
      "球団と選手（契約の修正にはコミッショナーの承認が必要）",
    ],
  },
  {
    label: "契約の行方",
    values: [
      "契約はそのまま相手の球団に移る",
      "他球団が獲得を申し出れば、その球団に契約が移る。申し出がなければ契約は終わる",
      "ウェイバーの手続きをとり、申し出がなく契約が終わると、合意した内容が適用される",
    ],
  },
  {
    label: "支払いの扱い",
    values: [
      "トレードのルール（サラリーキャップや例外など）に従う",
      "保証された年俸があれば、契約が終わっても支払い義務が残ることがある",
      "保証された年俸の減額・取り消しや、Set‑offの変更を合意できる",
    ],
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "トレード・デッドライン（トレード期限）",
    description: "シーズン中にトレードができる最後の日時。これを過ぎると、レギュラーシーズンが終わるまでトレードはできない。",
  },
  {
    term: "Trade Call",
    description: "トレードする球団どうしが、取引の条件をリーグ事務局に申告する電話会議。申告していない条件は無効になる。",
  },
  {
    term: "Traded Player Exception",
    description: "サラリーキャップを超えている球団が、トレードで出した選手の年俸をもとに、選手を受け入れるための例外。",
  },
  {
    term: "ウェイバー（Waivers）",
    description: "契約を手放す選手を、他の球団が獲得できるようにする手続き。期間は48時間。",
  },
  {
    term: "Set-off",
    description: "球団が契約を解除した選手が他球団と契約した場合に、元の球団の支払い義務の一部が減らされる仕組み。",
  },
  {
    term: "ドラフト指名権",
    description: "NBAドラフトで選手を指名する権利。トレードの対象になり、1巡目指名権のトレードにはNBAの定款やCBAによる制限がある。",
    href: GUIDE_PAGES["ドラフト指名権"],
  },
  {
    term: "指名権の凍結",
    description: "2nd Apronを超えた球団の将来の1巡目指名権が、トレードできなくなる仕組み。",
    href: GUIDE_PAGES["1st Apron / 2nd Apron"],
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

// 今後の個別ガイドへの案内(ページができたらリンクに置き換える)
function UpcomingGuideNote({ topic }: { topic: string }) {
  return (
    <p className="border-l-4 border-line bg-[#f3f6fb] dark:bg-white/[.04] px-4 py-2.5 text-xs leading-6 text-muted">
      詳しい条件は、今後の個別ガイド「{topic}」で解説する予定です（準備中）。
    </p>
  );
}

export default function TradeBasicsGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="トレード・ロスター移動" current="トレードの基本" />
      <GuideTitle subject="NBAトレードの基本" suffix="" />
      <p className="mb-8 text-sm text-muted">
        労使協定（CBA）、NBAが作成した労使協定の要点まとめ（CBA 101）、NBAの定款・細則で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "トレードは、球団どうしの合意で、選手の契約やドラフト指名権などを相手の球団に移す取引です。",
            "選手の契約、指名した選手の交渉権、ドラフト指名権、上限の範囲内の現金を扱えます。",
            "トレードできる時期や、年俸の釣り合い（サラリーマッチング）、指名権などに決まりがあり、ウェイブやBuyoutとは別の手続きです。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な制度の解説です。個別のトレードには、ここで扱っていない条件や例外があります。制度は将来変更される場合があるため、最新の公式資料を確認してください。
        </p>

        {/* 2. トレードとは */}
        <Section kicker="What it is" title="NBAのトレードとは">
          <Bullets
            items={[
              <>
                <b>球団どうしの取引：</b>NBAの細則では、球団が選手の契約、指名した選手の交渉権、ドラフト指名権を、他の球団に移すことができると定められています。
              </>,
              <>
                <b>CBAのルールに従う：</b>トレードは、労使協定（CBA）のトレードに関するルールをすべて満たす必要があります。
              </>,
              <>
                <b>リーグへの申告：</b>トレードする球団は、リーグ事務局との電話会議（Trade Call）で、金銭や指名権を含むすべての条件を申告します。申告していない条件は無効になります。
              </>,
              <>
                <b>成立のタイミング：</b>申告した条件がすべて満たされ、リーグ事務局から書面で確認の通知を受けた時点で、トレードが成立します。
              </>,
            ]}
          />
        </Section>

        {/* 3. トレードで扱われるもの */}
        <Section kicker="What can be traded" title="トレードで扱われるもの">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ASSETS.map(([name, text]) => (
              <div key={name} className="border border-line px-4 py-3">
                <p className="mb-1 font-bold">{name}</p>
                <p className="text-pretty text-muted [word-break:auto-phrase]">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-6 text-muted">
            ※ 現金の上限は、支払った額と受け取った額を相殺せず、それぞれ別に数えます。トレードの直後に年俸総額（Apronの計算方法によるもの）が2nd Apronを超えることになる球団は、トレードで現金を支払えません。
          </p>
        </Section>

        {/* 4. トレードできる時期 */}
        <Section kicker="Timing" title="トレードできる時期">
          <Bullets
            items={[
              <>
                <b>シーズン中：</b>シーズン開始からトレード・デッドライン（トレード期限）まではトレードできます。期限を過ぎると、レギュラーシーズンが終わるまでトレードはできません。
              </>,
              <>
                <b>レギュラーシーズン終了後：</b>最終戦の翌日から、再びトレードできます。ただし、プレーオフに出ている球団は、敗退するまでプレーオフのロスターの選手をトレードできません。
              </>,
              <>
                <b>モラトリアム期間：</b>オフシーズンの「モラトリアム期間」（CBAで定められた期間）中は、トレードできません。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ トレード期限の具体的な日時は、NBAの細則の定めにもとづいて毎シーズン決まります。細則は2018年10月版で確認したため、その後の改定は反映されていない可能性があります。最新の日程は、NBAの公式発表を確認してください。
          </p>
        </Section>

        {/* 5. サラリーマッチング */}
        <Section kicker="Salary matching" title="サラリーマッチング（年俸の釣り合い）の概要">
          <Bullets
            items={[
              <>
                <b>キャップの余裕の範囲で受け入れる：</b>トレード後も年俸総額がサラリーキャップ以下に収まる球団は、キャップの余裕の範囲で選手を受け入れられます。
              </>,
              <>
                <b>キャップを超える場合は例外を使う：</b>トレード後に年俸総額がサラリーキャップを超える球団は、「Traded Player Exception」などの例外を使う必要があり、出した選手の年俸に応じた額までしか受け入れられません。
              </>,
              <>
                <b>Apronを超える球団への制限：</b>1st Apron・2nd Apronを超える球団は、使える例外がさらに限られます。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーマッチング"]} label="NBAのサラリーマッチングとは？（トレードで送る年俸と受け取る年俸）" />
          <RelatedGuideLink href={GUIDE_PAGES["1st Apron / 2nd Apron"]} label="NBAの1st Apronと2nd Apronとは？（Apronを超えた球団への制限）" />
        </Section>

        {/* 6. トレード制限 */}
        <Section kicker="Trade restrictions" title="トレード制限の概要">
          <p>選手の契約の状況によっては、一定の期間トレードできなかったり、選手の同意が必要だったりします。主なものは次のとおりです。</p>
          <Bullets
            items={[
              <>
                <b>契約した直後の選手：</b>ドラフトで指名して契約した選手やTwo-Way契約の選手は契約から30日、フリーエージェントとして契約した選手は原則として3か月後か12月15日の遅いほうまで、トレードできません。
              </>,
              <>
                <b>選手の同意が必要な場合：</b>1年契約の選手のうち、契約を終えると「Bird」などの権利を持つフリーエージェントになる選手は、本人の同意がなければトレードできません（契約時に、この同意の権利をなくす合意もできます）。
              </>,
              <>
                <b>トレードを禁止・制限する条項：</b>CBAの条件を満たせば、球団と選手は、契約にトレードを禁止・制限する条項を入れることができます。
              </>,
              <>
                <b>契約最終シーズンの選手：</b>契約の最終シーズン（オプションによって最終シーズンになりうる場合を含む）の選手は、そのシーズンのトレード期限を過ぎるとトレードできません。
              </>,
            ]}
          />
          <UpcomingGuideNote topic="トレード制限" />
        </Section>

        {/* 7. 指名権の制限 */}
        <Section kicker="Draft pick restrictions" title="指名権に関する制限の概要">
          <Bullets
            items={[
              <>
                <b>連続する年の1巡目指名権：</b>NBAの定款では、トレードの結果、将来の連続する2年のドラフトで1巡目指名権をどちらも持たなくなる可能性がある場合、その1巡目指名権はトレードで手放せないという原則が定められています。
              </>,
              <>
                <b>2nd Apronを超えた球団への制限：</b>CBAでは、2nd Apronを超えた球団の将来の1巡目指名権が、トレードできなくなる場合があると定められています。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">※ このページでは概要だけを紹介しています。指名権の基本や取引のルールは、ドラフト指名権のガイドで解説しています。</p>
          <RelatedGuideLink href={GUIDE_PAGES["ドラフト指名権"]} label="NBAのドラフト指名権とは？（指名権の基本とトレードのルール）" />
        </Section>

        {/* 8. ウェイブ・Buyoutとの違い */}
        <Section kicker="Trade vs. waive vs. buyout" title="ウェイブ・Buyoutとの違い">
          <p>
            トレードは<b>相手の球団との取引</b>ですが、ウェイブとBuyoutは、球団が<b>選手との契約を手放す・終える</b>ための手続きです。
          </p>
          <CompareTable />
          <Bullets
            items={[
              <>
                <b>ウェイバーの期間：</b>ウェイバーの期間は48時間です。他の球団が獲得を申し出なければ、契約は終わります。
              </>,
              <>
                <b>Set-off：</b>球団が契約を解除したあとも支払い義務が残る場合、選手が他の球団と契約すると、元の球団の支払い義務がその一部だけ減ります。
              </>,
              <>
                <b>トレード後のウェイブ：</b>トレードで出した選手が移籍先でウェイブされた場合、元の球団は、一定の期間その選手を再び獲得・契約できません。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 「Buyout」はCBAで定義された言葉ではありません。このページでは、CBA 第2条 Section 3(p)の「球団と選手の合意で契約を途中で終えるための修正」として説明しています。
          </p>
          <RelatedGuideLink href={GUIDE_PAGES["ロスター契約・短期契約"]} label="NBAのロスター契約・短期契約とは？（ロスター枠と契約の種類）" />
          <RelatedGuideLink href={GUIDE_PAGES["Buyout"]} label="NBAのBuyout（バイアウト）とは？（合意による契約の途中終了）" />
          <RelatedGuideLink href={GUIDE_PAGES["Waive"]} label="NBAのウェイブ（Waive）とは？（ウェイバーの手続き・年俸総額への影響）" />
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
