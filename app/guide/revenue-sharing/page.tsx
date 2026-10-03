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
  title: "NBAのRevenue Sharingとは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのRevenue Sharing（収益分配）とは何か、なぜ必要なのか、市場規模や競争バランスとの関係、サラリーキャップ・ラグジュアリータックスとの違いを初心者向けに解説します。",
};

// 解説文は公式資料をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認できた事実は次の3つの資料にあるものだけ:
//   - NBA Communications(2011年12月8日): Board of Governors が新しい収益分配計画を承認、チーム間で分ける資金は従来の4倍、目的は競争バランス
//   - 2023 CBA 第7条(Article VII) Section 1(a)(2)(vii): チーム間の収益分配はBRIに含めない / 1(a)(8): 全国放映権契約にもとづく収益分配金の扱い
//   - CBA 101: 選手の取り分(Designated Share)はBRIの49〜51% / タックス収入の最大50%は非支払チームに分配できる
// 分配の拠出・受け取りの条件や計算方法、分配額は公式資料で確認できないため書かない。仮の金額・実在チームの事例も載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "NBA Board of Governors ratifies 10-year CBA",
    publisher: "NBA Communications（pr.nba.com）",
    date: "2011年12月8日公開",
    href: "https://pr.nba.com/nba-cba-ratify/",
    note: "チーム間の新しい収益分配計画の承認（分配する資金が従来の4倍、目的は競争バランス）の出典",
  },
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第7条（Article VII）Section 1：チーム間の収益分配をBRIに含めないこと、全国放映権契約にもとづく収益分配金の扱い",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "選手の取り分（BRIの49〜51%）、ラグジュアリータックス収入の分配の出典",
  },
];

// Revenue Sharing と、似た「お金の流れ」に関する仕組みの違い
const COMPARISON: { name: string; between: string; role: string; basis: string; href?: string }[] = [
  {
    name: "Revenue Sharing（収益分配）",
    between: "チーム同士",
    role: "チームごとの収入の差を和らげる",
    basis: "リーグ（オーナー会議）が決める計画",
  },
  {
    name: "選手の取り分（Designated Share）",
    between: "リーグ・チームと選手全体",
    role: "選手全体が受け取る総額を、BRIの49〜51%に保つ",
    basis: "労使協定（CBA）",
  },
  {
    name: "サラリーキャップ",
    between: "（各チームの年俸総額の基準）",
    role: "どの方法で選手と契約できるかの基準になる",
    basis: "労使協定（CBA）",
    href: GUIDE_PAGES["サラリーキャップ"],
  },
  {
    name: "ラグジュアリータックス",
    between: "高額年俸のチーム → リーグ",
    role: "タックスラインを超えたチームが税金を支払う。一部は支払っていないチームに分配できる",
    basis: "労使協定（CBA）",
    href: GUIDE_PAGES["ラグジュアリータックス"],
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "BRI（Basketball Related Income）",
    description:
      "NBAのバスケットボール関連の収入。選手の取り分やサラリーキャップの計算のもとになる。CBAでは、チーム間の収益分配はBRIに含めない。",
  },
  {
    term: "Designated Share（選手の取り分）",
    description: "選手全体が受け取る報酬の総額。CBAでBRIの49〜51%の範囲になるよう定められている。",
  },
  {
    term: "Board of Governors（オーナー会議）",
    description: "NBAの各チームの代表で構成される会議。2011年に新しい収益分配計画を承認した。",
  },
  {
    term: "競争バランス（Competitive Balance）",
    description: "どのチームにも勝つチャンスがある状態。2011年の収益分配計画の目的として公式に挙げられている。",
  },
  {
    term: "市場規模（スモールマーケット / ビッグマーケット）",
    description: "本拠地の都市の人口や経済規模のこと。チケットやスポンサー、地元向けの放送などの収入に差が出る要因になる。",
  },
  {
    term: "最低総年俸（Minimum Team Salary）",
    description: "全チームが最低限支払わなければならない年俸総額。収入の少ないチームにも一定以上の年俸負担がある。",
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

export default function RevenueSharingGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="NBA制度" current="Revenue Sharing" />
      <GuideTitle subject="NBAのRevenue Sharing" />
      <p className="mb-8 text-sm text-muted">
        NBAの公式発表と労使協定（CBA）、NBAが作成した労使協定の要点まとめ（CBA 101）で確認できる内容をもとにした、当サイト独自の解説です。公式資料で確認できない分配の条件や金額は掲載していません。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "Revenue Sharing（収益分配）は、NBAのチーム同士で収入の一部を分け合う仕組みです。",
            "チームごとの収入の差を和らげ、リーグ全体の競争バランスを保つことが目的とされています。",
            "選手の年俸の基準であるサラリーキャップや、税金であるラグジュアリータックスとは別の仕組みです。",
          ]}
        />

        {/* 2. Revenue Sharingとは何か */}
        <Section kicker="What it is" title="Revenue Sharingとは何か">
          <Bullets
            items={[
              <>
                <b>リーグが決める仕組み：</b>2011年12月、NBAのBoard of Governors（オーナー会議）が、新しい収益分配計画を承認しました。チーム間で分け合う資金を、それまでの4倍にする内容と発表されています。
              </>,
              <>
                <b>選手会との労使協定とは別：</b>この計画はチーム同士の取り決めです。労使協定（CBA）では、チーム間の収益分配は、選手の取り分やサラリーキャップの計算のもとになるBRI（バスケットボール関連収入）に含めない収入として扱われています。
              </>,
            ]}
          />
          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
            <div className="border border-line px-4 py-3">
              <p className="mb-1 text-xs font-bold text-muted">公式資料で確認できること</p>
              <ul className="space-y-1 text-sm">
                <li>・2011年に新しい計画が承認されたこと</li>
                <li>・分け合う資金が従来の4倍になること</li>
                <li>・目的が競争バランスの改善であること</li>
                <li>・チーム間の分配はBRIに含めないこと</li>
              </ul>
            </div>
            <div className="border border-line bg-background px-4 py-3">
              <p className="mb-1 text-xs font-bold text-muted">このページで扱わないこと</p>
              <ul className="space-y-1 text-sm">
                <li>・どのチームがいくら拠出・受け取るか</li>
                <li>・分配額の計算方法や対象となる条件</li>
                <li>・その後の見直しを含む現在の詳細</li>
              </ul>
              <p className="mt-2 text-xs text-muted">確認した公式資料に記載が無いため、推測では書いていません。</p>
            </div>
          </div>
        </Section>

        {/* 3. なぜ必要か */}
        <Section kicker="Why it exists" title="なぜ収益分配が必要なのか">
          <p>
            2011年の公式発表では、収益分配の改善によって<b>リーグの競争バランスを良くする</b>ことが目的として挙げられています。その背景には、次のような構造があります。
          </p>
          <Bullets
            items={[
              <>
                <b>収入はチームごとに違う：</b>チケット、スポンサー、地元向けの放送などの収入は、本拠地の市場規模や人気によって差が出ることがあります。
              </>,
              <>
                <b>年俸のルールは全チーム共通：</b>サラリーキャップやタックスラインなどの基準額は、全チームに同じ金額が適用されます。最低総年俸も全チームに共通で、収入が少ないチームにも一定以上の年俸負担があります。
              </>,
              <>
                <b>差を和らげる役割：</b>収入の差が大きいままだと、同じルールの中でも使えるお金に余裕の差が生まれます。チーム間で収入の一部を分け合うことで、その差を和らげるのが収益分配の考え方です。
              </>,
            ]}
          />
        </Section>

        {/* 4. 競争力と市場規模 */}
        <Section kicker="Market size" title="チーム間の競争力と市場規模との関係">
          <Bullets
            items={[
              <>
                <b>市場規模の違い：</b>人口や経済規模の大きい都市を本拠地にするチーム（ビッグマーケット）と、そうでないチーム（スモールマーケット）では、地元で得られる収入に差が出やすくなります。
              </>,
              <>
                <b>リーグ全体の収入も分配される：</b>労使協定には、全国向けの放映権契約にもとづいてチームが受け取る収益分配金の扱いについての規定もあります。リーグ全体で得た収入をチームに分ける流れは、チーム間の収益分配計画とは別にも存在します。
              </>,
              <>
                <b>戦力の均衡を支える仕組みは他にもある：</b>サラリーキャップ、ラグジュアリータックス、1st Apron・2nd Apron、最低総年俸など、労使協定の仕組みも、チーム間の差が広がりすぎないように働きます。収益分配は、その中の「お金の面」を支える仕組みの1つです。
              </>,
              <>
                <b>勝敗を直接決めるものではない：</b>収益分配はチームの財政を支える仕組みで、強いチームを作れるかどうかは、ドラフトやトレード、契約などの編成の判断にかかっています。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["1st Apron / 2nd Apron"]} label="NBAの1st Apronと2nd Apronとは？（高額年俸チームへの制限）" />
        </Section>

        {/* 5. サラリーキャップ・ラグジュアリータックスとの違い */}
        <Section kicker="Differences" title="サラリーキャップ、ラグジュアリータックスとの違い">
          <p>
            どれも「お金」に関する仕組みですが、<b>誰と誰の間のお金か</b>と<b>何のための仕組みか</b>が異なります。
          </p>
          {/* PC: 表 / スマホ: 縦並び */}
          <div className="hidden border border-line sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
                  <th scope="col" className="w-[230px] px-4 py-2.5">仕組み</th>
                  <th scope="col" className="w-[210px] px-4 py-2.5">誰と誰の間のお金か</th>
                  <th scope="col" className="px-4 py-2.5">役割</th>
                  <th scope="col" className="w-[190px] px-4 py-2.5">決めているもの</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.name} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 text-left align-top font-bold">
                      {row.name}
                    </th>
                    {/* 単語の途中で改行しないよう、文節の区切りで折り返す */}
                    <td className="px-4 py-3 align-top text-pretty [word-break:auto-phrase]">{row.between}</td>
                    <td className="px-4 py-3 align-top text-pretty [word-break:auto-phrase]">{row.role}</td>
                    <td className="px-4 py-3 align-top text-pretty text-muted [word-break:auto-phrase]">{row.basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="border border-line sm:hidden">
            {COMPARISON.map((row) => (
              <div key={row.name} className="border-b border-line px-4 py-3 last:border-b-0">
                <dt className="font-bold">{row.name}</dt>
                <dd className="mt-1 text-xs text-muted">お金の流れ：{row.between}</dd>
                <dd className="mt-1">{row.role}</dd>
                <dd className="mt-1 text-xs text-muted">決めているもの：{row.basis}</dd>
              </div>
            ))}
          </dl>
          <Bullets
            items={[
              <>
                <b>収益分配は年俸の基準を変えない：</b>チーム間の収益分配はBRIに含めないため、分配金のやり取りがサラリーキャップの計算に直接入ることはありません。
              </>,
              <>
                <b>タックスの分配とは別のもの：</b>ラグジュアリータックスで集まった税金のうち最大50%は、タックスを支払っておらず最低総年俸も下回っていないチームに分配できます。これは労使協定で決められた仕組みで、チーム間の収益分配計画とは別です。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ BRIの範囲、選手の取り分、タックス収入の分配の詳細な条件は、公式CBAを参照してください。
          </p>
          <RelatedGuideLink href={GUIDE_PAGES["ラグジュアリータックス"]} label="NBAラグジュアリータックスとは？（税率の考え方・税金の行き先）" />
        </Section>

        {/* 6. ファン向けのポイント */}
        <Section kicker="For fans" title="ファンが知っておくと理解しやすいポイント">
          <Bullets
            items={[
              <>
                <b>「分配金があれば補強し放題」ではない：</b>分配金を受け取っても、サラリーキャップなどの基準額は全チーム共通で変わりません。補強のルールはどのチームも同じです。
              </>,
              <>
                <b>選手の取り分は別に決まっている：</b>選手全体が受け取る報酬は、労使協定でBRIの49〜51%の範囲に保たれます。チーム間の分け方とは別の話です。
              </>,
              <>
                <b>「お金の流れ」を分けて考える：</b>ニュースで「分配」という言葉が出たときは、チーム同士の収益分配なのか、タックスの分配なのか、全国放映権料の分配なのかを区別すると理解しやすくなります。
              </>,
              <>
                <b>具体的な金額は出典を確認する：</b>チームごとの分配額などは公式に公表されていない部分があります。報道で数字を見たときは、どの資料にもとづく数字かを確認するのがおすすめです。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ"]} label="NBAサラリーキャップとは？（基本の仕組み・BRIとの関係）" />
          <RelatedGuideLink href={GUIDE_PAGES["放映権"]} label="NBAの放映権とは？（全国放映権契約・収入の分配）" />
          <RelatedGuideLink href={GUIDE_PAGES["チーム資産価値"]} label="NBAのチーム資産価値とは？（推計値の見方）" />
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
