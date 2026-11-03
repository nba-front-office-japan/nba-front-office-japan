import type { Metadata } from "next";
import Link from "next/link";
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
  title: "NBAのネットレーティングとは？計算方法と目安 | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのネットレーティング（Net Rating）を初心者向けに解説します。100ポゼッション当たりの得失点差という考え方、オフェンシブ・ディフェンシブ・レーティングとの関係、計算例、数値の目安、選手のネットレーティングを見るときの注意点をまとめました。",
  alternates: { canonical: "/guide/net-rating" },
};

// 定義は NBA.com Stats Glossary(NetRtg / OffRtg / DefRtg / POSS)にもとづく当サイト独自の解説。
// 歴代の得失点差は NBA.com「5 standout stats from the 2024-25 season」の表から転記(1試合平均)。
// 「数値の目安」は公式の基準ではなく、当サイトの目安であることを本文に明記する。

const SOURCES: OfficialSource[] = [
  {
    title: "NBA Stats Glossary（英語）",
    publisher: "NBA.com",
    date: "当サイトでの確認日：2026年11月3日",
    href: "https://www.nba.com/stats/help/glossary",
    note: "NetRtg・OffRtg・DefRtg・POSS（ポゼッション）の定義",
  },
  {
    title: "5 standout stats from the 2024-25 season（英語）",
    publisher: "NBA.com",
    date: "2025年4月公開",
    href: "https://www.nba.com/news/5-standout-stats-2024-25-season",
    note: "歴代チームの1試合平均の得失点差（1995-96ブルズ +12.2、2016-17ウォリアーズ +11.6 など）",
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "ポゼッション（Possession）",
    description: "1回の攻撃の機会。シュート成功、相手のディフェンスリバウンド、ターンオーバーなどで相手に攻撃が移るまでを1回と数える。",
  },
  {
    term: "オフェンシブ・レーティング（OffRtg / ORtg）",
    description: "100ポゼッション当たりの得点。攻撃の効率を表す。",
  },
  {
    term: "ディフェンシブ・レーティング（DefRtg / DRtg）",
    description: "100ポゼッション当たりの失点。小さいほど守備がよい。",
  },
  {
    term: "ペース（Pace）",
    description: "48分当たりのポゼッション数。試合の速さを表す。",
  },
  {
    term: "PER",
    description: "選手個人の、ボックススコア上の1分当たりの貢献を表す指標。",
    href: GUIDE_PAGES["PER"],
  },
];

// 計算例(ペースが違う2チーム)
const EXAMPLES: { team: string; score: string; poss: string; ortg: string; drtg: string; net: string }[] = [
  { team: "チームA（速い展開）", score: "110 − 105", poss: "100", ortg: "110.0", drtg: "105.0", net: "+5.0" },
  { team: "チームB（遅い展開）", score: "99 − 94", poss: "90", ortg: "110.0", drtg: "104.4", net: "+5.6" },
];

// 数値の目安(チーム・シーズン通算)。公式の基準ではなく当サイトの目安
const LEVELS: [string, string][] = [
  ["+10以上", "歴史的に強いチームの水準"],
  ["+5〜+10", "優勝候補に入ってくる水準"],
  ["0〜+5", "リーグ平均より上。プレーオフ争いに加わる水準"],
  ["0", "リーグ平均（リーグ全体の合計はほぼ0になる）"],
  ["マイナス", "リーグ平均より下。失点が得点を上回っている"],
];

export default function NetRatingGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="スタッツの見方" current="ネットレーティング" />
      <GuideTitle subject="NBAのネットレーティング" />
      <p className="mb-8 text-sm text-muted">
        NBA.comのスタッツ用語集（NBA Stats Glossary）の定義をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "ネットレーティングは「100ポゼッション（攻撃の回数）当たりの得失点差」です。",
            "オフェンシブ・レーティング（100ポゼッション当たりの得点）から、ディフェンシブ・レーティング（100ポゼッション当たりの失点）を引いて出します。",
            "0がリーグ平均で、プラスが大きいほど相手を上回っています。試合のペース（速さ）の違いをならして比べられるのが強みです。",
          ]}
        />

        {/* 2. とは */}
        <Section kicker="What it is" title="ネットレーティングとは">
          <Bullets
            items={[
              <>
                <b>100ポゼッション当たりの得失点差：</b>NBA.comでは「100ポゼッション当たりの、チームの得失点差」と定義されています。英語では Net Rating、略して NetRtg と書かれます。
              </>,
              <>
                <b>攻撃と守備の差：</b>オフェンシブ・レーティング（OffRtg）− ディフェンシブ・レーティング（DefRtg）で計算します。攻撃がよいのか、守備がよいのかは、2つの内訳を見ると分かります。
              </>,
              <>
                <b>なぜ「1試合平均の得失点差」ではないのか：</b>速い展開のチームは攻撃回数が多く、得点も失点も大きくなりがちです。100ポゼッション当たりにそろえることで、ペースの違うチーム同士を同じ物差しで比べられます。
              </>,
            ]}
          />
        </Section>

        {/* 3. 計算の考え方 */}
        <Section kicker="How it works" title="計算の考え方">
          <ol className="space-y-2">
            {[
              ["ポゼッションを数える", "1回の攻撃の機会を1ポゼッションとします。オフェンスリバウンドを取っても新しいポゼッションにはならず、同じ攻撃が続いていると数えます。"],
              ["オフェンシブ・レーティング", "得点 ÷ ポゼッション × 100"],
              ["ディフェンシブ・レーティング", "失点 ÷ ポゼッション × 100"],
              ["ネットレーティング", "オフェンシブ・レーティング − ディフェンシブ・レーティング"],
            ].map(([name, text], i) => (
              <li key={name} className="flex items-start gap-3 border border-line px-3 py-2.5">
                <span className="grid h-6 w-6 flex-none place-items-center bg-navy text-xs font-bold text-white">{i + 1}</span>
                <span>
                  <b>{name}</b>
                  <span className="block text-muted sm:inline sm:before:content-['：']">{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="text-xs leading-6 text-muted">
            ※ ポゼッションはボックススコアから推定することが多く、代表的な推定式は「フィールドゴール試投数 ＋ 0.44 × フリースロー試投数 − オフェンスリバウンド ＋ ターンオーバー」です。推定方法はサイトによって少しずつ違うため、同じチームでもサイトによって値が0.数点ずれることがあります。
          </p>

          <h3 className="pt-2 text-sm font-bold">計算例：得失点差はどちらも+5点</h3>
          <div className="hidden border border-line sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
                  <th scope="col" className="px-4 py-2.5">チーム</th>
                  <th scope="col" className="px-4 py-2.5 text-right">スコア</th>
                  <th scope="col" className="px-4 py-2.5 text-right">ポゼッション</th>
                  <th scope="col" className="px-4 py-2.5 text-right">OffRtg</th>
                  <th scope="col" className="px-4 py-2.5 text-right">DefRtg</th>
                  <th scope="col" className="px-4 py-2.5 text-right">NetRtg</th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLES.map((e) => (
                  <tr key={e.team} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 text-left font-bold">{e.team}</th>
                    <td className="whitespace-nowrap px-4 py-3 text-right">{e.score}</td>
                    <td className="px-4 py-3 text-right">{e.poss}</td>
                    <td className="px-4 py-3 text-right">{e.ortg}</td>
                    <td className="px-4 py-3 text-right">{e.drtg}</td>
                    <td className="px-4 py-3 text-right font-bold">{e.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="border border-line sm:hidden">
            {EXAMPLES.map((e) => (
              <div key={e.team} className="border-b border-line px-4 py-3 last:border-b-0">
                <dt className="font-bold">{e.team}</dt>
                <dd className="text-xs text-muted">
                  スコア {e.score} ／ ポゼッション {e.poss} ／ OffRtg {e.ortg} ／ DefRtg {e.drtg}
                </dd>
                <dd className="mt-1 font-bold">NetRtg {e.net}</dd>
              </div>
            ))}
          </dl>
          <p>
            どちらも5点差の勝ちで、攻撃の効率（OffRtg）も同じ110.0です。ただしチームBは少ない攻撃回数で同じ点差をつけている（守備の効率がよい）ため、ネットレーティングはチームBの方が高くなります。
          </p>
        </Section>

        {/* 4. 数値の目安 */}
        <Section kicker="Benchmarks" title="数値の目安（チームのシーズン通算）">
          <ol className="space-y-2">
            {LEVELS.map(([value, text]) => (
              <li key={value} className="flex items-start gap-3 border border-line px-3 py-2.5">
                <span className="w-[84px] flex-none font-bold">{value}</span>
                <span className="text-muted">{text}</span>
              </li>
            ))}
          </ol>
          <p>
            参考として、1試合平均の得失点差では、1995-96シーズンのブルズが+12.2、2016-17シーズンのウォリアーズが+11.6と、歴代でもトップクラスの数字です（NBA.com）。NBAの1試合のポゼッションはおよそ100前後のため、ネットレーティングも得失点差に近い値になります。
          </p>
          <p className="text-xs leading-6 text-muted">
            ※ この目安は当サイトによる大まかな基準で、NBAの公式な基準ではありません。シーズンの途中や、選手個人の値には当てはまりません。
          </p>
        </Section>

        {/* 5. 選手のネットレーティング */}
        <Section kicker="Player Net Rating" title="選手のネットレーティング">
          <p>
            選手のネットレーティングは、<b>その選手がコートにいる間の、チームの100ポゼッション当たりの得失点差</b>です。選手個人の得点ではなく、出場中のチーム全体の成績を表します。
          </p>
          <Bullets
            items={[
              <>
                <b>一緒に出ている選手の影響が大きい：</b>強いスターターと一緒に出る選手は高く、控え中心のメンバーで出る選手は低くなりやすい傾向があります。
              </>,
              <>
                <b>オン/オフで比べる：</b>選手がコートにいる時（オン）といない時（オフ）の差を見ると、その選手がいる時にチームがどれだけ変わるかの手がかりになります。
              </>,
              <>
                <b>出場時間が短いとブレる：</b>数十分しか出ていない選手は、数本のシュートで値が大きく動きます。
              </>,
            ]}
          />
        </Section>

        {/* 6. 見方の注意点 */}
        <Section kicker="Caution" title="見るときの注意点">
          <Bullets
            items={[
              <>
                <b>シーズン序盤は極端な値が出やすい：</b>10試合程度では対戦相手の偏りや好不調の影響が大きいため、試合数が増えてから判断するのがおすすめです。
              </>,
              <>
                <b>対戦相手の強さは考慮されない：</b>弱いチームとの対戦が続くと、実力以上に高く出ることがあります。
              </>,
              <>
                <b>点差が開いた時間帯（ガベージタイム）も含まれる：</b>勝敗が決まった後の時間帯の得失点も数字に入ります。
              </>,
              <>
                <b>内訳を見る：</b>同じ+5でも「攻撃が強い」のか「守備が強い」のかで、チームの特徴は大きく違います。
              </>,
            ]}
          />
        </Section>

        {/* 7. サイト内で確認する */}
        <Section kicker="On this site" title="当サイトで確認できるデータ">
          <p>
            当サイトでは、ネットレーティングの数値そのものはまだ掲載していません。チームの成績や、計算の材料になるボックススコアは次のページで確認できます。
          </p>
          <Bullets
            items={[
              <>
                <Link href="/standings" className="font-semibold text-blue hover:underline">順位表</Link>：各チームの勝敗
              </>,
              <>
                <Link href="/games" className="font-semibold text-blue hover:underline">試合結果・ボックススコア</Link>：試合ごとの得点、シュート試投数、リバウンド、ターンオーバー
              </>,
              <>
                <Link href="/stats" className="font-semibold text-blue hover:underline">選手スタッツ</Link>：選手ごとの出場時間や得点などの成績
              </>,
            ]}
          />
        </Section>

        {/* 8. 関連ガイド */}
        <Section kicker="Related" title="関連ガイド">
          <RelatedGuideLink href={GUIDE_PAGES["PER"]} label="NBAのPERとは？（選手の効率を1つの数字で表す指標）" />
          <RelatedGuideLink href={GUIDE_PAGES["スタッツ・指標"]} label="用語一覧：スタッツ・指標" />
        </Section>

        {/* 9. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 10. 出典 */}
        <OfficialSourcesSection
          sources={SOURCES}
          kicker="Sources"
          title="出典"
          note="このページは上記の資料をもとにした当サイト独自の解説です。計算例の数字は説明のために作った架空の例です。"
        />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
