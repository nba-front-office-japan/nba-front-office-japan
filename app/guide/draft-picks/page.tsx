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
  title: "NBAのドラフト指名権とは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのドラフト指名権（1巡目・2巡目）の基本、自球団・他球団から取得した指名権・将来指名権の考え方、指名権のトレードに関する基本ルールを初心者向けに解説します。",
};

// 解説文は公式資料をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所:
//   - CBA 第10条(Article X) Section 3(2巡制・各巡はチーム数と同じ指名数・保有する指名権はすべて行使)、Section 4(指名した選手との独占交渉権)
//   - CBA 101 II.F(2nd Apronを超えた場合の1巡目指名権の凍結)
//   - NBA定款・細則(2018年10月版) 第7.03条(1巡目指名権の売却禁止と、2年連続で1巡目指名権を持たなくなるトレードの禁止)、細則4.01(指名権のトレード)
//   - NBA Communications(2026年5月28日): 新たにトレードされる指名権に「トップ12〜15」のプロテクトを付けられない
// プロテクテッド指名権・繰り越し・スワップ権は、CBA・定款に一般的な定義が見当たらないため、用語の概要にとどめる。
// 具体的なトレード事例、選手個人の事例、指名権の金額評価、推測、未確認の例外は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第10条（Article X）Section 3：ドラフトの巡数と指名数／Section 4：指名した選手との交渉権",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "II.F「Draft Pick Penalty」：2nd Apronを超えた場合の1巡目指名権の凍結",
  },
  {
    title: "National Basketball Association Constitution and By-Laws（PDF・英語）",
    publisher: "NBA",
    date: "2018年10月版",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2018/10/NBA-Constitution-By-Laws-October-2018.pdf",
    note: "第7.03条：1巡目指名権の売却・トレードの制限／細則4.01：指名権のトレード。NBA公式サイトで公開されている版で、その後の改定は反映されていない可能性があります",
  },
  {
    title: "NBA Board of Governors approves new Draft Lottery system to address tanking",
    publisher: "NBA Communications（pr.nba.com）",
    date: "2026年5月28日公開",
    href: "https://pr.nba.com/nba-board-of-governors-approves-new-draft-lottery-system-to-address-tanking/",
    note: "新たにトレードされる指名権に付けられるプロテクトの制限",
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "ドラフト指名権（Draft Choice / Draft Pick）",
    description: "NBAドラフトで選手を指名する権利。1巡目・2巡目にそれぞれある。球団が保有し、トレードの対象にもなる。",
  },
  {
    term: "指名した選手の交渉権（Draft Rights）",
    description:
      "ドラフトで指名した選手と、次のドラフトまで独占的に交渉・契約できる権利。指名権そのものとは別に、トレードの対象になる。",
  },
  {
    term: "将来指名権（Future Pick）",
    description: "今後のシーズンのドラフトで使う指名権。現在のシーズンより先のドラフトの指名権もトレードできる。",
  },
  {
    term: "プロテクテッド指名権（Protected Pick）",
    description:
      "指名順位が一定の範囲に入った場合は相手球団に渡さない、といった条件を付けてトレードされる指名権の呼び名。条件は取引ごとに決まる。",
  },
  {
    term: "指名権の繰り越し",
    description:
      "プロテクトの条件などで、その年に相手球団へ渡らなかった指名権の扱いを、別の年のドラフトに移すことの呼び名。扱いは取引ごとに決まる。",
  },
  {
    term: "スワップ権（Pick Swap）",
    description:
      "ある年のドラフトで、自球団と相手球団の指名権を入れ替えられる権利の呼び名。条件は取引ごとに決まる。",
  },
  {
    term: "指名権の凍結",
    description: "2nd Apronを超えた球団の、7年後のドラフト1巡目指名権がトレードできなくなるペナルティ。",
    href: GUIDE_PAGES["1st Apron / 2nd Apron"],
  },
];

export default function DraftPicksGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="ドラフト" current="ドラフト指名権" />
      <GuideTitle subject="NBAのドラフト指名権" />
      <p className="mb-8 text-sm text-muted">
        労使協定（CBA）、NBAが作成した労使協定の要点まとめ（CBA 101）、NBAの定款・細則、NBAの公式発表で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "NBAドラフトは2巡制で、各球団は原則として1巡目・2巡目の指名権を1つずつ持ちます。",
            "指名権は球団が保有する権利で、トレードで他の球団に渡したり、他の球団から取得したりできます。",
            "ただし、1巡目指名権の売却や、2年続けて1巡目指名権がなくなるトレードは禁止されているなど、取引には決まりがあります。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な制度の解説であり、個別の取引判断の材料ではありません。個別の取引には、ここで扱っていない条件や例外があります。
        </p>

        {/* 2. 1巡目・2巡目 */}
        <Section kicker="Two rounds" title="1巡目・2巡目の指名権">
          <Bullets
            items={[
              <>
                <b>ドラフトは2巡制：</b>NBAドラフトは1巡目と2巡目の2巡で行われます。各巡の指名数は、翌シーズンのNBAの球団数と同じです。
              </>,
              <>
                <b>指名権はすべて行使する：</b>各球団は、それぞれの巡で保有しているすべての指名権を行使しなければなりません。
              </>,
              <>
                <b>指名の順番：</b>1巡目の上位はロッタリー（抽選）で、2巡目は前シーズンの成績の低い順で決まります。ロッタリーの仕組みは別のガイドで扱う予定です（準備中）。
              </>,
              <>
                <b>指名したあとの交渉権：</b>ドラフトで選手を指名した球団は、条件を満たせば、次のドラフトまでその選手と独占的に交渉・契約できます。
              </>,
            ]}
          />
        </Section>

        {/* 3. 保有・トレード */}
        <Section kicker="Ownership & trades" title="指名権は球団が保有し、トレードの対象になる">
          <Bullets
            items={[
              <>
                <b>トレードで渡せる：</b>NBAの細則では、選手の契約や指名した選手の交渉権と並んで、ドラフト指名権もトレードで他の球団に渡せるものとされています。
              </>,
              <>
                <b>トレードできる期間とルール：</b>指名権を含むトレードは、決められた期間に行う必要があり、CBAのルールにも従う必要があります。
              </>,
              <>
                <b>1つの球団が複数の指名権を持つことも：</b>他の球団から取得すれば、同じ巡で複数の指名権を持つことがあります。反対に、トレードで渡せば、その年の指名権を持たない場合もあります。
              </>,
            ]}
          />
        </Section>

        {/* 4. 自球団・他球団・将来 */}
        <Section kicker="Types of picks" title="自球団の指名権・他球団から取得した指名権・将来指名権">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["自球団の指名権", "その球団の成績などをもとに順番が決まる、本来その球団が持つ指名権。"],
              ["他球団から取得した指名権", "トレードで手に入れた、もともと他の球団のものだった指名権。順番は元の球団の成績などで決まる。"],
              ["将来指名権", "今後のシーズンのドラフトで使う指名権。現在より先のドラフトの指名権もトレードできる。"],
            ].map(([name, text]) => (
              <div key={name} className="border border-line px-4 py-3">
                <p className="mb-1 font-bold">{name}</p>
                <p className="text-pretty text-muted [word-break:auto-phrase]">{text}</p>
              </div>
            ))}
          </div>
          <p>
            他球団から取得した指名権は、<b>元の球団の成績</b>によって順番が決まるため、取得した球団自身の成績とは関係なく高い順位や低い順位になることがあります。
          </p>
        </Section>

        {/* 5. トレードの基本ルール・ステピエン・ルール */}
        <Section kicker="Trade rules" title="指名権トレードの基本ルール（ステピエン・ルール）">
          <p>
            一般に「ステピエン・ルール」と呼ばれる決まりは、CBAではなく、<b>NBAの定款・細則（Constitution and By-Laws）</b>の第7.03条に定められています。
          </p>
          <Bullets
            items={[
              <>
                <b>1巡目指名権は売れない：</b>1巡目指名権を、現金やそれに相当するものと引き換えに売ることはできません。
              </>,
              <>
                <b>2年続けて1巡目指名権がなくなるトレードはできない：</b>トレードの結果、将来の2年連続のドラフトで1巡目指名権を持たなくなる可能性がある場合、その1巡目指名権はトレードできません。
              </>,
              <>
                <b>2nd Apronによる凍結：</b>CBAでは、2nd Apronを超えた球団の7年後のドラフト1巡目指名権がトレードできなくなる（凍結される）ペナルティも定められています。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ NBAの定款・細則は、NBA公式サイトで公開されている2018年10月版で確認しました。その後の改定は反映されていない可能性があります。詳細な条件は公式資料を参照してください。
          </p>
          <RelatedGuideLink href={GUIDE_PAGES["1st Apron / 2nd Apron"]} label="NBAの1st Apronと2nd Apronとは？（指名権の凍結）" />
        </Section>

        {/* 6. プロテクト・繰り越し・スワップ */}
        <Section kicker="Pick conditions" title="プロテクテッド指名権・繰り越し・スワップ権（用語の概要）">
          <p>
            指名権のトレードでは、取引ごとにさまざまな条件が付けられることがあります。ここでは代表的な呼び名の概要だけを紹介します。
          </p>
          <Bullets
            items={[
              <>
                <b>プロテクテッド指名権：</b>指名順位が一定の範囲に入った場合は相手球団に渡さない、といった条件が付いた指名権の呼び名です。
              </>,
              <>
                <b>指名権の繰り越し：</b>プロテクトなどの条件で、その年に相手球団へ渡らなかった指名権の扱いを、別の年のドラフトに移すことの呼び名です。
              </>,
              <>
                <b>スワップ権：</b>ある年のドラフトで、自球団と相手球団の指名権を入れ替えられる権利の呼び名です。
              </>,
              <>
                <b>プロテクトの新しい制限：</b>NBAは2026年5月、新たにトレードされる指名権に「トップ12〜15」のプロテクトを付けられなくすることを発表しました。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ プロテクテッド指名権・繰り越し・スワップ権は、確認したCBAやNBAの定款・細則に一般的な定義が見当たらない呼び名です。条件は取引ごとに決まり、このページでは詳細や例外は扱っていません。
          </p>
        </Section>

        {/* 7. ロッタリー・指名権の価値 */}
        <Section kicker="Related" title="ロッタリーと指名権の価値について">
          <p>
            1巡目の指名順を決めるロッタリーの仕組みと、指名権の価値の考え方は、それぞれ別のガイドで扱う予定です（準備中）。このページでは、指名権そのものの基本に絞って解説しています。
          </p>
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
