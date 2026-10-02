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
  title: "NBAのRFAとUFAとは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAの制限付きフリーエージェント（RFA）と無制限フリーエージェント（UFA）の違い、クオリファイング・オファー、オファーシート、マッチングの仕組みを初心者向けに解説します。",
};

// 解説文は CBA と NBA作成の「CBA 101」をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所:
//   - CBA 第1条(Article I)の定義: Free Agent / Restricted Free Agent / Unrestricted Free Agent
//   - CBA 第11条(Article XI) Section 1(交渉・契約の時期)、Section 2(個別のマッチ権の禁止)、Section 4(クオリファイング・オファー)、Section 5(制限付きFA)
//   - CBA 101 II.N(1) 交渉と契約の時期、II.N(2) 制限付きFA(条件・クオリファイング・オファー・オファーシート・マッチング)、
//     II.B(2)(c) Non-Birdの上限(制限付きFAのクオリファイング・オファー額)
// 選手個人の事例、推測、未確認の例外、金額の例は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第1条（Article I）：Free Agent・Restricted Free Agent・Unrestricted Free Agent の定義／第11条（Article XI）：フリーエージェント（交渉の時期、クオリファイング・オファー、制限付きFA）",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "II.N「Free Agency」：交渉と契約の時期、制限付きFAの条件、クオリファイング・オファー、オファーシートとマッチング",
  },
];

// RFAとUFAの違い
const COMPARISON: { item: string; rfa: string; ufa: string }[] = [
  {
    item: "他球団との交渉",
    rfa: "できる",
    ufa: "できる",
  },
  {
    item: "元のチームのマッチ権",
    rfa: "ある（他球団のオファーシートと同じ条件で引き留められる）",
    ufa: "ない",
  },
  {
    item: "成立の条件",
    rfa: "在籍年数などの条件を満たす選手に、元のチームがクオリファイング・オファーを提示する",
    ufa: "マッチ権の対象にならないFA選手",
  },
  {
    item: "他球団と合意したとき",
    rfa: "オファーシートを元のチームに示し、元のチームがマッチするかどうかを決める",
    ufa: "そのまま他球団と契約できる",
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "RFA（制限付きフリーエージェント）",
    description: "元のチームがマッチ権（Right of First Refusal）を持つFA選手。CBAでは Restricted Free Agent。",
  },
  {
    term: "UFA（無制限フリーエージェント）",
    description: "どのチームのマッチ権の対象にもならないFA選手。CBAでは Unrestricted Free Agent。",
  },
  {
    term: "クオリファイング・オファー（QO）",
    description:
      "元のチームが選手に提示する1年契約のオファー。これを提示することで、元のチームはマッチ権を得る。選手はこのオファーに署名して、1年契約で残ることもできる。",
  },
  {
    term: "オファーシート（Offer Sheet）",
    description:
      "RFAの選手と他球団が合意した契約条件をまとめ、元のチームに示す書面。原則として2シーズン以上（オプション年を除く）の契約でなければならない。",
  },
  {
    term: "マッチング（Right of First Refusal）",
    description:
      "元のチームが、オファーシートと同じ条件で選手と契約する権利。期限内にマッチすれば元のチームとの契約になり、マッチしなければ他球団との契約になる。",
  },
  {
    term: "モラトリアム期間",
    description: "FA交渉は始められるが、多くの契約はまだ結べない期間。7月6日の午後0時1分（米東部時間）に終わる。",
  },
  {
    term: "Years of Service（在籍年数）",
    description: "NBAでの経験年数。RFAになれるかどうかの条件の1つ（3年以下）に使われる。",
  },
  {
    term: "Bird Rights",
    description: "自チームのFA選手と、キャップを超えていても再契約できる仕組み。RFAかUFAかとは別の基準で決まる。",
    href: GUIDE_PAGES["Bird Rights"],
  },
];

export default function RfaUfaGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="契約" current="RFA / UFA" />
      <GuideTitle subject="NBAのRFAとUFA" />
      <p className="mb-8 text-sm text-muted">
        労使協定（CBA）と、NBAが作成した労使協定の要点まとめ（CBA 101）で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "RFA（制限付きフリーエージェント）は、他球団と交渉できるものの、元のチームが同じ条件で引き留められる（マッチできる）FA選手です。",
            "UFA（無制限フリーエージェント）は、どの球団とも自由に契約でき、元のチームにマッチ権がないFA選手です。",
            "RFAは、元のチームがクオリファイング・オファー（QO）を提示することで成立します。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な制度の解説であり、個別の契約の判断材料ではありません。個別の契約には、ここで扱っていない例外や条件があります。
        </p>

        {/* 2. RFAとUFAの違い */}
        <Section kicker="RFA vs. UFA" title="RFAとUFAの違い">
          <p>
            どちらも他球団と交渉できるFA選手ですが、<b>元のチームにマッチ権（Right of First Refusal）があるかどうか</b>が大きな違いです。
          </p>
          {/* PC: 表 / スマホ: 縦並び */}
          <div className="hidden border border-line sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
                  <th scope="col" className="w-[190px] px-4 py-2.5">項目</th>
                  <th scope="col" className="px-4 py-2.5">RFA（制限付き）</th>
                  <th scope="col" className="px-4 py-2.5">UFA（無制限）</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.item} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 text-left align-top font-bold">{row.item}</th>
                    <td className="px-4 py-3 align-top text-pretty [word-break:auto-phrase]">{row.rfa}</td>
                    <td className="px-4 py-3 align-top text-pretty [word-break:auto-phrase]">{row.ufa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="border border-line sm:hidden">
            {COMPARISON.map((row) => (
              <div key={row.item} className="border-b border-line px-4 py-3 last:border-b-0">
                <dt className="font-bold">{row.item}</dt>
                <dd className="mt-1">
                  <span className="text-xs font-bold text-muted">RFA：</span>
                  {row.rfa}
                </dd>
                <dd className="mt-1">
                  <span className="text-xs font-bold text-muted">UFA：</span>
                  {row.ufa}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* 3. RFAの成立とQO */}
        <Section kicker="Qualifying offer" title="RFAになる条件とクオリファイング・オファー（QO）">
          <p>
            契約を終えた選手がRFAになるのは、<b>選手側の条件</b>を満たし、さらに<b>元のチームがQOを提示した場合</b>です。
          </p>
          <Bullets
            items={[
              <>
                <b>選手側の条件：</b>在籍年数が3年以下、ルーキー契約（Rookie Scale Contract）を終える、Two-Way契約を終える、のいずれかに当てはまる選手が対象です。ただし、ルーキー契約の3年目・4年目のチームオプションが行使されなかった1巡目指名選手は除かれます。
              </>,
              <>
                <b>QOの提示が必要：</b>元のチームがQOを提示して、初めてRFAになります。条件を満たしていても、QOが提示されなければマッチ権は生まれません。
              </>,
              <>
                <b>QOは1年契約のオファー：</b>QOは、元のチームが選手に示す1年契約のオファーです。選手はQOに署名して、1年契約で元のチームに残ることもできます。
              </>,
              <>
                <b>QOの年俸の決まり方：</b>QOの年俸は、選手の前年の年俸や最低年俸などをもとに、CBAで決められた方法で計算されます。ルーキー契約を終える1巡目指名選手と、それ以外の選手では決め方が異なります。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ ルーキー契約を終える選手やTwo-Way契約の選手のQOには、成績などによる別の決まりがあります。詳細な条件は公式CBA・CBA 101を参照してください。
          </p>
        </Section>

        {/* 4. オファーシートとマッチング */}
        <Section kicker="Offer sheet & matching" title="オファーシートとマッチングの流れ">
          <p>RFAの選手が他球団と条件で合意したときは、次の流れで所属先が決まります。</p>
          <ol className="space-y-2">
            {[
              ["他球団と合意", "RFAの選手が、他球団から受け入れたい契約のオファーを受ける。"],
              ["オファーシートを提出", "選手と他球団は、その契約条件をオファーシートとして元のチームに示す。オファーシートは原則として2シーズン以上（オプション年を除く）の契約でなければならない。"],
              ["元のチームが判断", "元のチームは、決められた期限までに、同じ条件で契約するか（マッチ）どうかを決める。"],
              ["所属先が決まる", "マッチすれば元のチームとオファーシートの条件で契約したことになり、マッチしなければ他球団との契約になる。"],
            ].map(([name, text], i) => (
              <li key={name} className="flex items-start gap-3 border border-line px-3 py-2.5">
                <span className="grid h-6 w-6 flex-none place-items-center bg-navy text-xs font-bold text-white">{i + 1}</span>
                <span>
                  <b>{name}</b>
                  <span className="block text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <Bullets
            items={[
              <>
                <b>マッチの期限：</b>オファーシートが正午（米東部時間）より前に示された場合は翌日の午後11時59分まで、正午以降なら2日後の午後11時59分までです。モラトリアム期間中に示されたオファーシートは、7月6日の正午より前に示されたものとして扱われます。
              </>,
              <>
                <b>マッチは同じ条件で：</b>元のチームが引き留める場合は、オファーシートに書かれた条件のまま契約することになります。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 元のチームが最高年俸のQOもあわせて提示した場合など、オファーシートの年数には別の決まりがあります。詳細な条件は公式CBA・CBA 101を参照してください。
          </p>
        </Section>

        {/* 5. UFA */}
        <Section kicker="Unrestricted" title="UFA（無制限フリーエージェント）とは">
          <Bullets
            items={[
              <>
                <b>マッチ権の対象にならないFA：</b>CBAでは、どのチームのマッチ権の対象にもならないFA選手をUFAと定めています。
              </>,
              <>
                <b>どの球団とも自由に契約できる：</b>UFAは、FAの交渉期間が始まればどの球団とも交渉でき、モラトリアム期間が終われば契約を結べます。
              </>,
              <>
                <b>元のチームにマッチ権はない：</b>他球団のオファーに対して、元のチームが同じ条件で引き留める権利はありません（元のチームがBird Rightsなどの例外を使って再契約できる場合はあります）。また、個別の契約の中に、契約終了後のマッチ権などの移籍制限を盛り込むことはCBAで認められていません。
              </>,
            ]}
          />
        </Section>

        {/* 6. Bird Rightsとの関係 */}
        <Section kicker="Bird rights" title="Bird Rightsとの関係">
          <Bullets
            items={[
              <>
                <b>決まり方の基準が違う：</b>RFAかUFAかは、在籍年数や契約の種類とQOの提示で決まります。一方、Bird・Early Bird・Non-Birdのどれを使えるかは、同じチームで何シーズン続けてプレーしたかで決まります。両者は別の基準です。
              </>,
              <>
                <b>Non-Birdの上限とQO：</b>BirdにもEarly Birdにも当たらない自チームのFA選手（Non-Bird）と再契約する場合、1年目の年俸の上限を決める比較の対象には、その選手がRFAならQOの額も含まれます。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["Bird Rights"]} label="NBAのBird Rightsとは？（自チームのFA選手との再契約）" />
          <RelatedGuideLink href={GUIDE_PAGES["MAX契約"]} label="NBAのMAX契約とは？（最高年俸・契約年数・昇給率）" />
        </Section>

        {/* 7. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 8. 公式一次資料 */}
        <OfficialSourcesSection sources={SOURCES} />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
