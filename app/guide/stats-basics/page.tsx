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
  title: "NBAスタッツ表の見方｜PTS・TRB・AST・TS%などの意味と目安（初心者向け） | NBAガイド | NBA Front Office Japan",
  description:
    "NBAの成績表に並ぶPOS・G・MP・PTS・ORB・DRB・TRB・AST・STL・BLK・FG%・3P%・FT%・TS%・TOV・PFの意味を初心者向けに1つずつ解説。2025-26シーズンのリーグ平均とリーダーの数字をもとに、良い数字の目安も紹介します。",
  alternates: { canonical: "/guide/stats-basics" },
};

// 目安の数字は Basketball-Reference の次のページにもとづく(確認日:2026年11月6日)。
// ・リーグ平均(チームの1試合平均):NBA League Averages - Per Game の 2025-26 行
// ・リーダー:2025-26 NBA Leaders(規定を満たした選手)
// ・20点以上の人数など:2025-26 NBA Player Stats: Per Game(移籍選手は合計行で数える。出場試合数の条件なし)
// 「目安」の言葉(エース級など)は当サイトの解説で、公式の基準ではない。
// 進行中のシーズン(2026-27)は試合数が少なく値が大きく動くため、目安の根拠にしない。

const SOURCES: OfficialSource[] = [
  {
    title: "NBA League Averages - Per Game（英語）",
    publisher: "Basketball-Reference",
    date: "当サイトでの確認日：2026年11月6日",
    href: "https://www.basketball-reference.com/leagues/NBA_stats_per_game.html",
    note: "2025-26シーズンのリーグ平均（チームの1試合平均、FG%・3P%・FT%・TS%）",
  },
  {
    title: "2025-26 NBA Leaders（英語）",
    publisher: "Basketball-Reference",
    date: "当サイトでの確認日：2026年11月6日",
    href: "https://www.basketball-reference.com/leagues/NBA_2026_leaders.html",
    note: "得点・リバウンド・アシスト・スティール・ブロック・各成功率のリーダー",
  },
  {
    title: "2025-26 NBA Player Stats: Per Game（英語）",
    publisher: "Basketball-Reference",
    date: "当サイトでの確認日：2026年11月6日",
    href: "https://www.basketball-reference.com/leagues/NBA_2026_per_game.html",
    note: "平均20得点以上の選手数など",
  },
];

type StatItem = {
  abbr: string;
  en: string;
  ja: string;
  meaning: string;
  guide?: string;
};

// 項目の並びは当サイトの選手スタッツ(/stats)の表と同じ順。
const GROUPS: { id: string; title: string; lead: string; items: StatItem[] }[] = [
  {
    id: "basic",
    title: "基本情報",
    lead: "まずは「どれくらい試合に出ているか」を確認します。",
    items: [
      {
        abbr: "POS",
        en: "Position",
        ja: "ポジション",
        meaning:
          "PG（ポイントガード）、SG（シューティングガード）、SF（スモールフォワード）、PF（パワーフォワード）、C（センター）。G・F・GF・FC のように大まかな分類で書かれることもあります。",
      },
      {
        abbr: "G",
        en: "Games",
        ja: "出場試合数",
        meaning: "そのシーズンに出場した試合の数。レギュラーシーズンは1チーム82試合です。",
        guide: "試合数が少ないと平均が大きくブレます。まずここを見るのがおすすめです。",
      },
      {
        abbr: "MP",
        en: "Minutes Played",
        ja: "出場時間（1試合平均・分）",
        meaning: "1試合に平均何分コートに立ったか。NBAの試合は48分（12分×4クォーター）です。",
        guide: "30分以上ならチームの主力、34分以上は大黒柱クラスが目安です。",
      },
    ],
  },
  {
    id: "production",
    title: "得点・リバウンド・アシスト",
    lead: "試合の流れを作る、いちばん目立つ数字です。",
    items: [
      {
        abbr: "PTS",
        en: "Points",
        ja: "得点",
        meaning: "1試合平均の得点。",
        guide:
          "20点以上でチームのエース級（2025-26は47人）、25点以上はリーグを代表するスコアラー。2025-26の1位はルカ・ドンチッチの33.5点です。",
      },
      {
        abbr: "ORB",
        en: "Offensive Rebounds",
        ja: "オフェンスリバウンド",
        meaning: "味方が外したシュートを拾った数。もう一度攻撃できるので、チームにとって大きなプレーです。",
        guide: "2以上ならゴール下に強い選手。主にセンターやパワーフォワードの数字です。",
      },
      {
        abbr: "DRB",
        en: "Defensive Rebounds",
        ja: "ディフェンスリバウンド",
        meaning: "相手が外したシュートを拾った数。相手の攻撃をそこで終わらせます。",
      },
      {
        abbr: "TRB",
        en: "Total Rebounds",
        ja: "リバウンド合計",
        meaning: "ORB と DRB の合計。",
        guide:
          "10以上で「リバウンドの名手」（2025-26は16人）。1位はニコラ・ヨキッチの12.9。ガードなら5以上でも十分に多い数字です。",
      },
      {
        abbr: "AST",
        en: "Assists",
        ja: "アシスト",
        meaning: "味方の得点につながるパスの数。",
        guide:
          "5以上でチームの司令塔役、8以上はリーグ屈指のパサー（2025-26は7人）。1位はニコラ・ヨキッチの10.7です。",
      },
    ],
  },
  {
    id: "defense",
    title: "守備",
    lead: "守備の数字は表に残りにくいので、あくまで一部です。",
    items: [
      {
        abbr: "STL",
        en: "Steals",
        ja: "スティール",
        meaning: "相手からボールを奪った数。",
        guide: "1.5以上でリーグ上位。2025-26の1位は2.0（オーサー・トンプソン、ダイソン・ダニエルズ）です。",
      },
      {
        abbr: "BLK",
        en: "Blocks",
        ja: "ブロック",
        meaning: "相手のシュートを手で止めた数。",
        guide: "1.5以上でリーグ上位。2025-26はビクター・ウェンバンヤマが3.1で、2位（1.9）を大きく引き離しています。",
      },
    ],
  },
  {
    id: "shooting",
    title: "シュートの成功率",
    lead: "「どれだけ入れたか」ではなく「どれだけ確実に入れたか」を見る数字です。",
    items: [
      {
        abbr: "FG%",
        en: "Field Goal Percentage",
        ja: "フィールドゴール成功率",
        meaning: "フリースロー以外のすべてのシュート（2点・3点）の成功率。",
        guide:
          "2025-26のリーグ平均は47.1%。ゴール下で打つことが多いセンターは60%以上も珍しくなく、3ポイントを多く打つ選手は低めに出ます。",
      },
      {
        abbr: "3P%",
        en: "3-Point Percentage",
        ja: "3ポイント成功率",
        meaning: "3ポイントシュートの成功率。",
        guide: "リーグ平均は36.0%。38%以上なら優秀、40%以上は一流のシューターです。",
      },
      {
        abbr: "FT%",
        en: "Free Throw Percentage",
        ja: "フリースロー成功率",
        meaning: "ファウルを受けて打つフリースロー（1本1点）の成功率。",
        guide: "リーグ平均は78.3%。90%を超えると一流で、70%を切ると試合終盤にわざとファウルされることもあります。",
      },
      {
        abbr: "TS%",
        en: "True Shooting Percentage",
        ja: "真のシュート効率",
        meaning:
          "2点・3点・フリースローをまとめて「1回のシュートでどれだけ効率よく得点したか」を表す数字。得点 ÷（2 ×（FG試投数 + 0.44 × FT試投数））で計算します。",
        guide: "リーグ平均は58.1%。60%を超えると効率の良い選手で、得点の多さとセットで見ると選手の実力がわかりやすくなります。",
      },
    ],
  },
  {
    id: "mistakes",
    title: "ミス・ファウル",
    lead: "少ないほど良い数字です。ただし、ボールを持つ時間が長い選手ほど多くなります。",
    items: [
      {
        abbr: "TOV",
        en: "Turnovers",
        ja: "ターンオーバー",
        meaning: "パスミスやボールを奪われるなどで、シュートを打たずに攻撃権を失った数。",
        guide: "1試合3以上は多め。ただしエースや司令塔はボールに触る回数が多いため、3〜4あっても珍しくありません。AST と比べて見るのがおすすめです。",
      },
      {
        abbr: "PF",
        en: "Personal Fouls",
        ja: "個人ファウル",
        meaning: "1試合平均のファウル数。1試合で6つ目のファウルをすると退場（ファウルアウト）です。",
        guide: "3以上は多め。ポジションの PF（パワーフォワード）と同じ略語なので、表の中の位置で見分けます。",
      },
    ],
  },
];

// 2025-26 リーグ平均(チームの1試合平均)
const LEAGUE_AVERAGES: [string, string][] = [
  ["FG%", "47.1%"],
  ["3P%", "36.0%"],
  ["FT%", "78.3%"],
  ["TS%", "58.1%"],
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "ボックススコア（Box score）",
    description: "1試合ごとの選手の成績表。当サイトでは試合結果ページで確認できます。",
  },
  {
    term: "ダブルダブル",
    description: "得点・リバウンド・アシスト・スティール・ブロックのうち2つで10以上を記録すること。3つならトリプルダブル。",
  },
  {
    term: "PER",
    description: "ボックススコアの成績から、選手の1分当たりの貢献を1つの数字にまとめた指標。リーグ平均は15。",
    href: GUIDE_PAGES["PER"],
  },
  {
    term: "ネットレーティング",
    description: "100ポゼッション当たりの得失点差。選手の場合は、その選手の出場中のチームの値。",
    href: GUIDE_PAGES["ネットレーティング"],
  },
];

export default function StatsBasicsGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="スタッツの見方" current="スタッツ表の見方" />
      <GuideTitle subject="NBAスタッツ表の見方" suffix="（初心者向け）" />
      <p className="mb-8 text-sm text-muted">
        Basketball-Reference の2025-26シーズンのデータをもとにした、当サイト独自の解説です。目安の言葉（「エース級」など）は当サイトの解説で、公式の基準ではありません。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "成績表の数字は、ほとんどが「1試合平均」です（％の項目は成功率）。",
            "まず G（出場試合数）と MP（出場時間）で、どれくらい試合に出ているかを確認しましょう。試合数が少ないと数字は大きくブレます。",
            "得点（PTS）は20点以上でエース級、リバウンド（TRB）は10以上、アシスト（AST）は8以上でリーグ屈指が目安です。",
            "得点の多さだけでなく、TS%（シュート効率）もあわせて見ると、選手の実力がわかりやすくなります。",
          ]}
        />

        {/* 2. 早見表(目次) */}
        <Section kicker="Quick view" title="項目の早見表">
          <p>当サイトの選手スタッツの表は、左から次の順に並んでいます。気になる項目をタップすると解説に移動します。</p>
          <div className="flex flex-wrap gap-2">
            {GROUPS.flatMap((g) => g.items).map((item) => (
              <a
                key={item.abbr}
                href={`#stat-${item.abbr.replace("%", "pct").toLowerCase()}`}
                className="inline-flex min-h-9 items-center border border-line px-2.5 text-[13px] hover:border-blue hover:text-blue"
              >
                <b className="mr-1.5">{item.abbr}</b>
                <span className="text-muted">{item.ja.replace(/（.*）/, "")}</span>
              </a>
            ))}
          </div>
          <p className="text-muted">
            選手ページの「Stats」タブでは、同じ項目が「PTS/G」「MPG」のように「/G（1試合当たり）」付きで表示されます。意味は同じです。
          </p>
        </Section>

        {/* 3. 各項目の解説 */}
        {GROUPS.map((group) => (
          <Section key={group.id} kicker="Stats" title={group.title}>
            <p>{group.lead}</p>
            <dl className="divide-y divide-line border-y border-line">
              {group.items.map((item) => (
                <div
                  key={item.abbr}
                  id={`stat-${item.abbr.replace("%", "pct").toLowerCase()}`}
                  className="scroll-mt-24 py-4 sm:grid sm:grid-cols-[180px_1fr] sm:gap-4"
                >
                  <dt>
                    <span className="block text-xl font-extrabold tracking-tight">{item.abbr}</span>
                    <span className="block text-xs text-muted">{item.en}</span>
                    <span className="block font-bold">{item.ja}</span>
                  </dt>
                  <dd className="mt-1 space-y-2 sm:mt-0">
                    <p>{item.meaning}</p>
                    {item.guide && (
                      <p className="border-l-[3px] border-gold bg-[#fff6e0] px-3 py-2 dark:bg-white/[.06]">
                        <b className="mr-1">目安：</b>
                        {item.guide}
                      </p>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        ))}

        {/* 4. リーグ平均 */}
        <Section kicker="League average" title="2025-26シーズンのリーグ平均（成功率）">
          <p>成功率は、リーグ平均より上か下かで判断するのが基本です。</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LEAGUE_AVERAGES.map(([label, value]) => (
              <div key={label} className="border border-line px-3 py-3 text-center">
                <p className="text-xs font-bold text-muted">{label}</p>
                <p className="text-xl font-extrabold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">出典：Basketball-Reference「NBA League Averages - Per Game」2025-26シーズン（2026年11月6日確認）</p>
        </Section>

        {/* 5. 見方の注意点 */}
        <Section kicker="Caution" title="見るときの注意点">
          <Bullets
            items={[
              <>
                <b>シーズン序盤の数字はブレる：</b>数試合だけだと、1試合の大活躍や不調で平均が大きく動きます。G（出場試合数）が少ないうちは参考程度に見ましょう。
              </>,
              <>
                <b>出場時間で数字は変わる：</b>ベンチから15分出る選手と、先発で36分出る選手では、得点やリバウンドの合計に差が出て当然です。MP とセットで見ましょう。
              </>,
              <>
                <b>ポジションで「良い数字」は違う：</b>センターはリバウンドやFG%が高く、ガードはアシストが多くなるのが普通です。同じポジションの選手と比べるのがおすすめです。
              </>,
              <>
                <b>守備は数字に残りにくい：</b>STL と BLK は守備の一部だけです。相手エースを抑える、ヘルプに入るといった貢献は表に出ません。
              </>,
            ]}
          />
        </Section>

        {/* 6. サイト内で確認する */}
        <Section kicker="On this site" title="当サイトで確認できるデータ">
          <Bullets
            items={[
              <>
                <Link href="/stats" className="font-semibold text-blue hover:underline">選手スタッツ</Link>：全選手の成績を項目ごとに並べ替えて比較
              </>,
              <>
                <Link href="/players/featured" className="font-semibold text-blue hover:underline">人気選手ガイド</Link>：主な選手の特徴と成績
              </>,
              <>
                <Link href="/games" className="font-semibold text-blue hover:underline">試合結果・ボックススコア</Link>：試合ごとの選手の成績
              </>,
            ]}
          />
        </Section>

        {/* 7. 関連ガイド */}
        <Section kicker="Related" title="次に読むガイド">
          <RelatedGuideLink href={GUIDE_PAGES["PER"]} label="NBAのPER（選手効率指標）とは？" />
          <RelatedGuideLink href={GUIDE_PAGES["ネットレーティング"]} label="NBAのネットレーティングとは？" />
          <RelatedGuideLink href={GUIDE_PAGES["スタッツ・指標"]} label="用語一覧：スタッツ・指標" />
        </Section>

        {/* 8. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 9. 出典 */}
        <OfficialSourcesSection
          sources={SOURCES}
          kicker="Sources"
          title="出典"
          note="このページは上記のデータをもとにした当サイト独自の解説です。"
        />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
