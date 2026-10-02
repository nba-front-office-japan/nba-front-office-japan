import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "NBAサラリーキャップとは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのサラリーキャップの仕組み、チーム編成への影響、ラグジュアリータックス・1st Apron・2nd Apronとの関係を初心者向けに解説します。",
};

// 数値は NBA 公式発表(2026年6月30日)の値だけを使う。発表文の数値をそのまま転記し、推測で補わない。
// 解説文は CBA と NBA作成の「CBA 101」をもとにした独自の要約で、条文の転載・全文翻訳ではない。
const SYSTEM_LEVELS_2026_27: { label: string; note: string; usd: string; ja: string }[] = [
  {
    label: "最低総年俸（Minimum Team Salary）",
    note: "チームが最低限払わなければならない年俸総額",
    usd: "$148.465M",
    ja: "1億4,846万5,000ドル",
  },
  {
    label: "サラリーキャップ（Salary Cap）",
    note: "キャップスペースの計算に使う基準額",
    usd: "$164.961M",
    ja: "1億6,496万1,000ドル",
  },
  {
    label: "タックスライン（Tax Level）",
    note: "超えるとラグジュアリータックスの対象",
    usd: "$200.428M",
    ja: "2億42万8,000ドル",
  },
  {
    label: "1st Apron（First Apron Level）",
    note: "超えると一部の補強手段が使えない",
    usd: "$209.015M",
    ja: "2億901万5,000ドル",
  },
  {
    label: "2nd Apron（Second Apron Level）",
    note: "さらに厳しい制限とドラフト指名権のペナルティ",
    usd: "$221.686M",
    ja: "2億2,168万6,000ドル",
  },
];

const RELATED_TERMS: { term: string; description: string }[] = [
  {
    term: "BRI（Basketball Related Income）",
    description: "放映権料やチケット収入など、NBAのバスケットボール関連収入。サラリーキャップ額の計算のもとになる。",
  },
  {
    term: "キャップスペース",
    description: "サラリーキャップからチームの年俸総額を引いた残り。この範囲なら、FA選手と自由に契約できる。",
  },
  {
    term: "ソフトキャップ",
    description: "例外を使えば上限を超えて契約できる方式。NBAはこの方式で、上限を一切超えられないハードキャップとは異なる。",
  },
  {
    term: "ラグジュアリータックス",
    description: "年俸総額がタックスラインを超えたチームが支払う税金。超過額が大きいほど税率が上がる。",
  },
  {
    term: "1st Apron / 2nd Apron",
    description: "タックスラインより上に設定された2つの基準額。超えると使える補強手段が段階的に減る。",
  },
  {
    term: "Bird Rights",
    description: "自チームのFA選手と、キャップを超えていても再契約できる権利。条件を満たすと最大で選手の最高年俸まで出せる。",
  },
  {
    term: "MLE（ミッドレベル例外）",
    description: "キャップを超えたチームでも、一定額までの契約で他チームの選手を獲得できる例外。チームの年俸水準で使える種類が変わる。",
  },
  {
    term: "サラリーマッチング",
    description: "キャップを超えたチームがトレードをするとき、出す年俸と受け取る年俸をおおむね釣り合わせる必要があるというルール。",
  },
  {
    term: "ミニマム契約",
    description: "経験年数ごとに決まった最低年俸での契約。キャップを超えていても結べる。",
  },
];

const OFFICIAL_SOURCES: { title: string; publisher: string; date: string; href: string; note: string }[] = [
  {
    title: "NBA sets Salary Cap for 2026-27 season at $164.961 million",
    publisher: "NBA Communications（pr.nba.com）",
    date: "2026年6月30日公開",
    href: "https://pr.nba.com/2026-27-salary-cap/",
    note: "このページの2026-27シーズンの数値の出典",
  },
  {
    title: "NBA sets salary cap for 2026-27 season at $164.961 million",
    publisher: "NBA.com",
    date: "2026年6月30日公開",
    href: "https://www.nba.com/news/nba-salary-cap-2026-27-season",
    note: "同じ発表のNBA.com掲載記事",
  },
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "NBAとNBPA（選手会）の労使協定の原文",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "NBAによる労使協定の要点まとめ。このページの仕組みの解説の根拠",
  },
];

// 見出しの折り返し: 文節の途中で切らず(word-break: auto-phrase)、行の長さをそろえて
// 「は？」「み」だけの行ができないようにする(text-wrap: balance)。
const HEADING_WRAP = "text-balance [word-break:auto-phrase]";

function Section({ kicker, title, children }: { kicker: string; title: ReactNode; children: ReactNode }) {
  return (
    <section className="border border-line bg-surface p-5 sm:p-7">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">{kicker}</p>
      <h2 className={`mb-4 text-xl font-semibold tracking-tight ${HEADING_WRAP}`}>{title}</h2>
      <div className="space-y-3 text-sm leading-7">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="mt-[11px] h-1.5 w-1.5 flex-none bg-gold" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SalaryCapGuidePage() {
  return (
    <PageShell>
      <nav aria-label="パンくずリスト" className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <Link href="/guide" className="font-semibold text-blue hover:underline">
          NBAガイド
        </Link>
        <span aria-hidden>›</span>
        <span>NBA制度</span>
        <span aria-hidden>›</span>
        <span className="font-semibold text-foreground">サラリーキャップ</span>
      </nav>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="inline-block bg-[#eaf1ff] px-1.5 py-1 text-[11px] font-extrabold text-[#2457b7]">NBA制度</span>
        <span className="inline-block border border-line px-1.5 py-1 text-[11px] font-extrabold text-muted">
          サラリーキャップ
        </span>
      </div>
      <h1 className={`mb-3 text-[30px] font-semibold leading-tight tracking-tight sm:text-[36px] ${HEADING_WRAP}`}>
        {/* 狭い画面では「NBAサラリーキャップ」と「とは？」の間でだけ改行する */}
        <span className="inline-block">NBAサラリーキャップ</span>
        <span className="inline-block">とは？</span>
      </h1>
      <p className="mb-8 text-sm text-muted">
        数値は2026-27シーズン（2026年7月1日から適用）のNBA公式発表にもとづきます。仕組みの解説は公式資料をもとにした当サイト独自の要約です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <section className="border-l-4 border-gold bg-navy p-5 text-white sm:p-7">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-[#84b0ff]">Summary</p>
          <h2 className="mb-3 text-xl font-semibold">まず結論</h2>
          <ul className="space-y-2 text-sm leading-7 text-slate-200">
            <li>・サラリーキャップは、1チームが選手に払う年俸総額の「基準となる上限」です。</li>
            <li>・NBAは例外を使えば上限を超えて契約できる「ソフトキャップ」なので、多くのチームが上限を超えています。</li>
            <li>・ただし超えるほど、ラグジュアリータックスやApronの制限で使える補強手段が減っていきます。</li>
          </ul>
        </section>

        {/* 2. 基本的な仕組み */}
        <Section kicker="How it works" title="サラリーキャップの基本的な仕組み">
          <Bullets
            items={[
              <>
                <b>1年単位で決まる：</b>毎年7月1日から翌年6月30日までを1つの「サラリーキャップ年度」として、金額が設定されます。
              </>,
              <>
                <b>リーグの収入に連動：</b>サラリーキャップは、NBAのバスケットボール関連収入（BRI）の見込みをもとに毎年計算されます。タックスラインや2つのApronも、キャップと同じ伸び率で毎年上がります。
              </>,
              <>
                <b>急な変動は抑えられる：</b>各基準額は前年より下がらず、前年から10%を超えて上がることもない決まりです。
              </>,
              <>
                <b>キャップスペースがあれば自由に補強：</b>年俸総額がキャップを下回るチームは、その差額（キャップスペース）の範囲で、FA選手との契約やトレードでの年俸の受け入れができます。
              </>,
              <>
                <b>例外を使えば上限を超えられる：</b>自チームの選手との再契約（Bird Rights）、ミッドレベル例外（MLE）、ミニマム契約、ドラフト指名選手のルーキー契約などは、キャップを超えていても結べます。
              </>,
              <>
                <b>下限もある：</b>年俸総額が最低総年俸を下回るチームは、不足分を支払う必要があります。
              </>,
            ]}
          />

          <div className="pt-2">
            <h3 className="mb-2 text-sm font-bold">2026-27シーズンの基準額</h3>
            {/* PC: 表 / スマホ: 縦並び */}
            <div className="hidden border border-line sm:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
                    <th scope="col" className="px-4 py-2.5">項目</th>
                    <th scope="col" className="px-4 py-2.5 text-right">金額（公式発表）</th>
                    <th scope="col" className="px-4 py-2.5 text-right">日本語表記</th>
                  </tr>
                </thead>
                <tbody>
                  {SYSTEM_LEVELS_2026_27.map((level) => (
                    <tr key={level.label} className="border-b border-line last:border-b-0">
                      <th scope="row" className="px-4 py-3 text-left align-top font-bold">
                        {level.label}
                        <span className="mt-0.5 block text-xs font-normal text-muted">{level.note}</span>
                      </th>
                      <td className="whitespace-nowrap px-4 py-3 text-right align-top font-bold">{level.usd}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right align-top text-muted">{level.ja}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="border border-line sm:hidden">
              {SYSTEM_LEVELS_2026_27.map((level) => (
                <div key={level.label} className="border-b border-line px-4 py-3 last:border-b-0">
                  <dt className="font-bold">{level.label}</dt>
                  <dd className="text-xs text-muted">{level.note}</dd>
                  <dd className="mt-1 font-bold">
                    {level.usd}
                    <span className="ml-2 text-xs font-normal text-muted">{level.ja}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs leading-6 text-muted">
              出典：NBA Communications「NBA sets Salary Cap for 2026-27 season at $164.961 million」（2026年6月30日公開）。
              2026年7月1日 午前0時1分（米東部時間）から適用。$1M＝100万ドル。当サイトでの確認日：2026年10月2日。
            </p>
          </div>
        </Section>

        {/* 3. チーム編成への影響 */}
        <Section kicker="Team building" title="なぜチーム編成に影響するのか">
          <p>
            サラリーキャップは「いくらまで払えるか」だけでなく、<b>どの方法で選手を集められるか</b>を左右します。
          </p>
          <Bullets
            items={[
              <>
                <b>キャップスペースがあるチーム：</b>他チームのFA選手に大型契約を提示できます。若手中心のチームや、大型契約が満了したチームがこの立場になりやすいです。
              </>,
              <>
                <b>キャップを超えているチーム：</b>他チームのFA選手を獲るには、主にMLEやミニマム契約などの例外に頼ることになり、提示できる金額に限りがあります。そのため、自チームの選手との再契約（Bird Rights）とトレードが補強の中心になります。
              </>,
              <>
                <b>トレードでは年俸の釣り合いが必要：</b>キャップを超えたチームは、出す年俸と受け取る年俸をおおむね合わせる必要があり（サラリーマッチング）、欲しい選手がいても簡単には獲得できません。
              </>,
              <>
                <b>長期契約は将来の枠を使う：</b>複数年契約の年俸は翌年以降の年俸総額にも残るため、今の補強が数年先の自由度を左右します。
              </>,
            ]}
          />
        </Section>

        {/* 4. タックス・Apronとの関係 */}
        <Section
          kicker="Tax & Aprons"
          title={
            <>
              ラグジュアリータックス・<span className="whitespace-nowrap">1st Apron</span>・
              <span className="whitespace-nowrap">2nd Apronとの関係</span>
            </>
          }
        >
          <p>
            キャップの上には、さらに3つの基準額があります。年俸総額が上の段に進むほど、支払う税金が増え、使える補強手段が減っていきます。
          </p>
          <ol className="space-y-2">
            {[
              ["サラリーキャップ", "ここを下回っていれば、キャップスペースで自由に補強できる"],
              ["タックスライン", "超えるとラグジュアリータックスを支払う"],
              ["1st Apron", "超えると一部の補強手段が使えなくなる"],
              ["2nd Apron", "さらに厳しい制限と、ドラフト指名権へのペナルティ"],
            ].map(([name, text], i) => (
              <li key={name} className="flex items-start gap-3 border border-line px-3 py-2.5">
                <span className="grid h-6 w-6 flex-none place-items-center bg-navy text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>
                  <b>{name}</b>
                  <span className="block text-muted sm:inline sm:before:content-['：']">{text}</span>
                </span>
              </li>
            ))}
          </ol>

          <h3 className="pt-2 font-bold">ラグジュアリータックス</h3>
          <Bullets
            items={[
              "レギュラーシーズン最終日の時点で年俸総額がタックスラインを超えていると、超えた額に応じて税金を支払います。",
              "税率は段階式で、超過額が大きいほど高くなります。",
              "直近5シーズンのうち4シーズン以上（その年を含む）で支払っているチームは「リピーター」として、さらに高い税率になります。",
              "集まった税金の一部は、タックスを払っていないチームに分配されることがあります。",
            ]}
          />

          <h3 className="pt-2 font-bold">1st Apron</h3>
          <Bullets
            items={[
              "取引の結果、年俸総額が1st Apronを超える場合は、その取引ができません。",
              "対象になる主な補強手段：通常のMLE（Non-Taxpayer MLE）、Bi-annual Exception、サイン・アンド・トレードでの選手獲得など。",
              "これらを一度使うと、そのシーズンは年俸総額を1st Apron以下に保つ必要があります。",
            ]}
          />

          <h3 className="pt-2 font-bold">2nd Apron</h3>
          <Bullets
            items={[
              "1st Apronの制限に加えて、トレードで複数選手の年俸を合算して受け入れる、トレードで現金を支払う、Taxpayer MLEで契約する、といった手段も使えなくなります。",
              "シーズン最終戦の開始時点で2nd Apronを超えていると、7年後のドラフト1巡目指名権がトレードできなくなります（指名権の凍結）。",
              "その後4シーズンのうち2シーズン以上で再び超えると、凍結された指名権は1巡目の最後の順位に回されます。",
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 条件の細部には例外や追加のルールがあります。正確な条件は下の公式資料（CBA）を確認してください。
          </p>
        </Section>

        {/* 5. 関連用語 */}
        <Section kicker="Glossary" title="関連用語">
          <dl className="divide-y divide-line border-y border-line">
            {RELATED_TERMS.map((t) => (
              <div key={t.term} className="py-3 sm:grid sm:grid-cols-[290px_1fr] sm:gap-4">
                <dt className="font-bold">{t.term}</dt>
                <dd className="text-muted">{t.description}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted">各用語の詳しいガイドは準備中です。</p>
        </Section>

        {/* 6. 公式一次資料 */}
        <Section kicker="Official sources" title="公式一次資料">
          <ul className="divide-y divide-line border-y border-line">
            {OFFICIAL_SOURCES.map((s) => (
              <li key={s.href} className="py-3">
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="break-words font-semibold text-blue hover:underline"
                >
                  {s.title} ↗
                </a>
                <p className="mt-0.5 text-xs text-muted">
                  <span className="whitespace-nowrap">{s.publisher}</span> ・{" "}
                  <span className="whitespace-nowrap">{s.date}</span>
                </p>
                <p className="text-xs text-muted">{s.note}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-6 text-muted">
            このページは上記の公式資料をもとにした当サイト独自の解説です。協定の条文を転載・翻訳したものではありません。
          </p>
        </Section>
      </div>

      <Link href="/guide" className="mt-8 inline-block text-sm font-extrabold text-blue">
        ← NBAガイド一覧に戻る
      </Link>
    </PageShell>
  );
}
