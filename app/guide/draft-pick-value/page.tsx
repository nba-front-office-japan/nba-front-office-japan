import type { ReactNode } from "react";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import {
  BackToGuide,
  GlossarySection,
  GuideHeader,
  GuideTitle,
  HEADING_WRAP,
  OfficialSourcesSection,
  RelatedGuideLink,
  Section,
  SummarySection,
} from "@/components/guide-article";
import { GUIDE_PAGES, type OfficialSource } from "@/lib/guide-official";

export const metadata: Metadata = {
  title: "NBAドラフト指名権の価値とは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのドラフト指名権の価値がどのような要素で変わり得るかを、制度上の事実と一般的な見方に分けて初心者向けに解説します。公式の価格や評価基準はありません。",
};

// 解説文は公式資料をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 「制度・事実」は一次資料で確認した内容だけを書き、「一般的な見方」とはっきり分けて表示する。
// 確認した箇所:
//   - CBA 第7条(Article VII) Section 2(f)：Draft Pick Penalty(2nd Apronを超えた場合の1巡目指名権の凍結)
//   - CBA 第8条(Article VIII) Section 1(b)(i)：ルーキー・スケールの金額は指名順位で決まる
//   - CBA 101 II.B(e)(f)：Rookie Scale Exception・Second Round Pick Exception／II.F：Draft Pick Penalty
//   - NBA定款・細則(2018年10月版) 第7.03条：1巡目指名権の売却禁止・2年連続で1巡目指名権を持たなくなるトレードの禁止
//   - NBA.com(2017年9月28日)：現行ロッタリーの導入と最下位チームの最低順位
//   - NBA Communications(2026年5月28日)と3-2-1 LotteryのPDF：2027〜2029年の新制度、プロテクトの制限、連続上位指名の制限
// 指名権の公式な価格・順位・換算表は存在しないため載せない。
// 金額換算、独自スコア、特定のチーム・選手・過去のトレードの評価、将来予測は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第7条（Article VII）Section 2(f)：2nd Apronによる1巡目指名権の凍結／第8条（Article VIII）Section 1(b)：ルーキー・スケールの金額は指名順位で決まる",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "II.B：1巡目・2巡目で指名した選手との契約の決まり／II.F「Draft Pick Penalty」：1巡目指名権の凍結",
  },
  {
    title: "National Basketball Association Constitution and By-Laws（PDF・英語）",
    publisher: "NBA",
    date: "2018年10月版",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2018/10/NBA-Constitution-By-Laws-October-2018.pdf",
    note: "第7.03条：1巡目指名権の売却・トレードの制限。NBA公式サイトで公開されている版で、その後の改定は反映されていない可能性があります",
  },
  {
    title: "NBA Board of Governors approves changes to draft lottery system",
    publisher: "NBA.com",
    date: "2017年9月28日公開",
    href: "https://www.nba.com/news/nba-board-governors-approves-changes-draft-lottery-system",
    note: "現行のロッタリー制度（2019年のドラフトから）",
  },
  {
    title: "NBA Board of Governors approves new Draft Lottery system to address tanking",
    publisher: "NBA Communications（pr.nba.com）",
    date: "2026年5月28日公開",
    href: "https://pr.nba.com/nba-board-of-governors-approves-new-draft-lottery-system-to-address-tanking/",
    note: "2027〜2029年のドラフトの新制度「3-2-1 Lottery」、プロテクトの制限",
  },
  {
    title: "3-2-1 Lottery（PDF・英語）",
    publisher: "NBA",
    date: "2026年5月公開",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/46/2026/05/NBA-3-2-1-Draft-Lottery.pdf",
    note: "対象チーム、指名順の下限、連続した上位指名の制限、プロテクトの制限",
  },
];

const VIEW_NOTE = "これは取引価値を考える際の一般的な見方であり、公式の評価基準ではありません。";

type Factor = {
  title: string;
  facts: ReactNode[];
  views: ReactNode[];
};

const FACTORS: Factor[] = [
  {
    title: "想定される指名順位",
    facts: [
      "1巡目の上位の順番はロッタリー（抽選）で、それ以外は主にレギュラーシーズンの成績で決まります。",
      "1巡目で指名した選手と結ぶルーキー・スケール契約の金額は、指名順位ごとに決められています（CBA 第8条）。",
    ],
    views: [
      "上位で指名できる見込みがある指名権ほど、一般に重視されやすいとされます。",
      "ただし、順位は抽選や成績が確定するまで決まらず、年ごとの候補選手の顔ぶれによっても受け止め方は変わり得ます。",
    ],
  },
  {
    title: "1巡目か2巡目か",
    facts: [
      "1巡目で指名した選手とは、2年契約＋球団側のオプション2年のルーキー・スケール契約を結べます。",
      "2巡目で指名した選手とは、2〜3年契約＋球団側のオプション1年の契約を、専用の例外（Second Round Pick Exception）で結べます。",
      "売却の禁止や、2年続けて持たなくなるトレードの禁止（NBA定款 第7.03条）は、1巡目指名権についての決まりです。",
    ],
    views: [
      "一般に1巡目指名権のほうが重視されやすいとされますが、2巡目指名権も取引の調整などに使われることがあります。",
      "契約の決まりの違いが、指名権の受け止め方に影響する場合があります。",
    ],
  },
  {
    title: "何年後の指名権か",
    facts: [
      "現在のシーズンより先のドラフトの指名権（将来指名権）もトレードできます。",
      "1巡目指名権は、2年連続のドラフトで持たなくなる可能性があるトレードはできません（NBA定款 第7.03条）。",
      "ロッタリーの「3-2-1 Lottery」は2027〜2029年のドラフトで使われ、2030年以降のルールはオーナー会議の投票で決めるとされています。",
    ],
    views: [
      "先の年の指名権ほど、元の球団の成績や制度がどうなるかの不確実性が大きいと考えられます。",
      "不確実性は、価値を高く見る理由にも低く見る理由にもなり得るため、一律に「将来の指名権ほど価値が低い」とは言えません。",
    ],
  },
  {
    title: "プロテクトの有無と条件",
    facts: [
      "プロテクト（指名順位が一定の範囲なら相手に渡さない、などの条件）は、確認したCBAや定款に一般的な定義が見当たらず、条件は取引ごとに決まります。",
      "NBAは2026年5月、新たにトレードされる指名権に「トップ12〜15」のプロテクトを付けられなくすることを発表しました。",
    ],
    views: [
      "プロテクトがあると、受け取る側が上位の指名を得られる場面が限られるため、価値の見方に影響し得ます。",
      "渡す側にとっては、上位の指名を失うリスクを抑える意味を持つ場合があります。影響の大きさは条件の内容によって変わります。",
    ],
  },
  {
    title: "繰り越し条件",
    facts: [
      "プロテクトなどで渡らなかった指名権を別の年に移す「繰り越し」も、一般的な定義は見当たらず、扱いは取引ごとに決まります。",
    ],
    views: [
      "繰り越しがあると、いつ・どの順位の指名権が渡るかが読みにくくなり、価値を考える難しさが増すことがあります。",
      "最終的に何も渡らない、または別の形に変わる条件が付く場合もあり、条件の細部が重視されます。",
    ],
  },
  {
    title: "スワップ権か、指名権そのものか",
    facts: [
      "スワップ権（ある年の自球団と相手球団の指名権を入れ替えられる権利）も、一般的な定義は見当たらず、条件は取引ごとに決まります。",
    ],
    views: [
      "スワップ権は、指名権を1つ追加で得る権利ではなく、入れ替えを選べる権利として考えられます。",
      "そのため、2つの指名権の順位の差が大きいほど意味を持ちやすく、入れ替える利点がなければ使われないこともあります。",
    ],
  },
  {
    title: "ロッタリー対象になる可能性",
    facts: [
      "現行制度では、プレーオフに進めなかった14チームが対象で、1〜4位を抽選で決めます。最も成績が低いチームでも5位より下にはなりません。",
      "2027〜2029年の「3-2-1 Lottery」では、対象が16チームに広がり、1〜16位を抽選で決めます。成績が最も低い3チームは12位より下になりません。",
      "3-2-1 Lotteryでは、同じチームの指名権が2年続けて1位、または3年続けてトップ5になることはできません。トレードで他のチームが持っている場合も同じです。",
    ],
    views: [
      "ロッタリーの対象になる可能性がある指名権は、上位の指名を得る機会がある一方、抽選による振れ幅もあると考えられます。",
      "制度によって確率や順位の下限が異なるため、どの年のドラフトの指名権かが見方に影響し得ます。",
    ],
  },
  {
    title: "2nd Apronによる凍結など、制度上の制約",
    facts: [
      "2nd Apronを超えた球団は、7年後のドラフトの1巡目指名権がトレードできなくなります（凍結）。",
      "その後の4シーズンのうち2シーズン以上で再び2nd Apronを超えると、凍結された指名権は1巡目の最後に移されます。4シーズンのうち3シーズンで2nd Apron以下なら、凍結は解除されます。",
      "1巡目指名権は、現金やそれに相当するものと引き換えに売ることはできません（NBA定款 第7.03条）。",
    ],
    views: [
      "トレードできない指名権や、使い方が限られる指名権は、取引の材料としての柔軟性が小さくなると考えられます。",
      "球団がどの指名権を取引に使えるかは、こうした制約の組み合わせで変わることがあります。",
    ],
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "ドラフト指名権（Draft Pick）",
    description: "NBAドラフトで選手を指名する権利。1巡目・2巡目にそれぞれあり、トレードの対象になる。",
    href: GUIDE_PAGES["ドラフト指名権"],
  },
  {
    term: "ドラフト・ロッタリー",
    description: "1巡目の上位の指名順を抽選で決める仕組み。",
    href: GUIDE_PAGES["ロッタリー"],
  },
  {
    term: "ルーキー・スケール契約",
    description: "1巡目で指名した選手と結ぶ契約。金額は指名順位ごとに決められている。",
  },
  {
    term: "プロテクテッド指名権（Protected Pick）",
    description: "指名順位が一定の範囲に入った場合は相手球団に渡さない、といった条件が付いた指名権の呼び名。条件は取引ごとに決まる。",
  },
  {
    term: "スワップ権（Pick Swap）",
    description: "ある年のドラフトで、自球団と相手球団の指名権を入れ替えられる権利の呼び名。条件は取引ごとに決まる。",
  },
  {
    term: "指名権の凍結",
    description: "2nd Apronを超えた球団の、7年後のドラフト1巡目指名権がトレードできなくなるペナルティ。",
    href: GUIDE_PAGES["1st Apron / 2nd Apron"],
  },
];

function FactorCard({ index, factor }: { index: number; factor: Factor }) {
  return (
    <section className="border border-line bg-surface p-5 sm:p-7">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Factor {index}</p>
      <h3 className={`mb-4 text-lg font-semibold tracking-tight ${HEADING_WRAP}`}>
        {index}. {factor.title}
      </h3>
      <div className="grid grid-cols-1 gap-3 text-sm leading-7 md:grid-cols-2">
        <div className="border-l-4 border-navy bg-[#f3f6fb] px-4 py-3 dark:bg-white/[.04]">
          <p className="mb-1 text-xs font-extrabold text-navy dark:text-[#84b0ff]">制度・事実</p>
          <ul className="space-y-1.5">
            {factor.facts.map((item, i) => (
              <li key={i} className="pl-[1em] -indent-[1em] text-pretty">・{item}</li>
            ))}
          </ul>
        </div>
        <div className="border border-dashed border-line px-4 py-3">
          <p className="mb-1 text-xs font-extrabold text-muted">一般的な見方（公式の評価基準ではありません）</p>
          <ul className="space-y-1.5">
            {factor.views.map((item, i) => (
              <li key={i} className="pl-[1em] -indent-[1em] text-pretty">・{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function DraftPickValueGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="ドラフト" current="指名権の価値" />
      <GuideTitle subject="NBAドラフト指名権の価値" />
      <p className="mb-8 text-sm text-muted">
        労使協定（CBA）、NBAが作成した労使協定の要点まとめ（CBA 101）、NBAの定款・細則、NBAの公式発表で確認できる制度をもとに、指名権の価値を考えるための見方を整理した、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "ドラフト指名権には、公式の固定価格・公式ランキング・共通の換算表はありません。",
            "指名権の価値の受け止め方は、指名順位の見込み、巡、年、付いている条件、制度上の制約など、複数の要素で変わり得ます。",
            "このページは価値を考えるための見方の解説で、特定の指名権や取引を評価・予測するものではありません。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>これは一般的な解説であり、個別の取引判断の材料ではありません。個別の取引には、ここで扱っていない条件や例外があります。制度は将来変更される場合があるため、最新の公式発表を確認してください。
        </p>

        {/* 2. 公式の価格はない */}
        <Section kicker="No official price" title="指名権に公式の価格や順位はない">
          <p>
            NBAの労使協定（CBA）や定款・細則には、指名権の取り扱いのルールは定められていますが、<b>指名権の価格や価値の順位、ほかの資産との換算表は定められていません</b>。
          </p>
          <p>
            指名権がどう評価されるかは、取引に関わる球団それぞれの判断によります。このため、同じような指名権でも、状況や相手によって受け止め方が異なることがあります。
          </p>
        </Section>

        {/* 3. 読み方 */}
        <Section kicker="How to read" title="このページの読み方">
          <p>以下の8つの要素は、それぞれ2つに分けて書いています。</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border-l-4 border-navy bg-[#f3f6fb] px-4 py-3 dark:bg-white/[.04]">
              <p className="mb-1 font-bold">制度・事実</p>
              <p className="text-pretty text-muted [word-break:auto-phrase]">CBA、NBAの定款・細則、NBAの公式発表で確認できる内容。</p>
            </div>
            <div className="border border-dashed border-line px-4 py-3">
              <p className="mb-1 font-bold">一般的な見方</p>
              <p className="text-pretty text-muted [word-break:auto-phrase]">価値を考える際によく挙げられる考え方。公式の基準ではない。</p>
            </div>
          </div>
          <p className="text-xs leading-6 text-muted">※ {VIEW_NOTE}要素の並び順は、重要度の順位ではありません。</p>
        </Section>
      </div>

      {/* 4. 価値に影響し得る8つの要素 */}
      <h2 className={`mb-2 mt-10 text-2xl font-semibold tracking-tight ${HEADING_WRAP}`}>価値の見方に影響し得る8つの要素</h2>
      <p className="mb-5 text-sm leading-7 text-muted">{VIEW_NOTE}</p>
      <div className="space-y-4">
        {FACTORS.map((factor, i) => (
          <FactorCard key={factor.title} index={i + 1} factor={factor} />
        ))}
      </div>

      <div className="mt-5 space-y-5">
        {/* 5. 断定できない理由 */}
        <Section kicker="Keep in mind" title="価値を一律に決められない理由">
          <p>
            これらの要素は互いに影響し合い、どれが重視されるかは取引の状況や球団の考え方によって変わります。そのため、「上位の指名権ほど必ず価値が高い」「将来の指名権ほど必ず価値が低い」といった一律の判断はできません。
          </p>
          <p className="text-xs leading-6 text-muted">※ {VIEW_NOTE}</p>
        </Section>

        {/* 6. 関連ガイド */}
        <Section kicker="Related" title="関連ガイド">
          <p>指名権そのものの基本、指名順が決まる仕組み、指名権の凍結については、次のガイドで解説しています。</p>
          <RelatedGuideLink href={GUIDE_PAGES["ドラフト指名権"]} label="NBAのドラフト指名権とは？（指名権の基本とトレードのルール）" />
          <RelatedGuideLink href={GUIDE_PAGES["ロッタリー"]} label="NBAドラフト・ロッタリーとは？（指名順が決まる仕組み）" />
          <RelatedGuideLink href={GUIDE_PAGES["1st Apron / 2nd Apron"]} label="NBAの1st Apronと2nd Apronとは？（指名権の凍結）" />
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
