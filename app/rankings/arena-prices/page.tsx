import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { ArenaPricesTable } from "@/components/arena-prices-table";
import { ARENA_PRICES, ARENA_PRICES_SOURCE } from "@/lib/arena-prices";

const DATA_NOTES = [
  "チケットは、各チームのホーム試合（最大25試合）で、最も安い単席の価格を平均した値。SeatGeekの手数料を含み、売上税は含まない（2026年9月30日時点）。",
  "家族4人の合計は、チケット4枚、駐車場1台、ビール2杯（16オンス）、ソフトドリンク2杯（20オンス）、ホットドッグ4本の合計。",
  "飲食の価格は、Bookies.comのメニュー価格で、2026-27シーズン向けには再計測されていない。",
  "駐車場は、SeatGeekで事前購入できる最安のパス料金。キャバリアーズ、ペリカンズ、ラプターズ、ジャズは、Bookies.comの数値。",
  "転売市場の価格は日々変わる。ここに載せたのは、ある時点の目安。",
  "金額はすべて米ドル。",
  `出典：${ARENA_PRICES_SOURCE.name}「${ARENA_PRICES_SOURCE.title}」（${ARENA_PRICES_SOURCE.publishedOn}公開）`,
];

// 解説文「数字から見える、5つの特徴」(本文の数字は ARENA_PRICES から計算した値)
const POINTS: { heading: string; paragraphs: string[] }[] = [
  {
    heading: "1. ニックスだけが、別の世界にいる",
    paragraphs: [
      "最安席の1席あたりの価格は、ニックスが294ドルで、30チームの1位。2位のレイカーズ（115ドル）の約2.5倍、30チームの中央値（約49ドル）の約6倍になる。最安席が100ドルを超えるのは、ニックス、レイカーズ、76ersの3チームだけだ。",
      "家族4人の合計では、ニックスは1,277ドルで、最も安いペリカンズ（168ドル）の約7.6倍。ニックスの合計のうち、チケット代が92%を占める。30チーム全体では、チケット代は約74%だ。",
    ],
  },
  {
    heading: "2. 飲食で、順位が入れ替わる",
    paragraphs: [
      "ビール1杯は、セルティックスが18.3ドルで1位。ウォリアーズが17.9ドル、ネッツが16.3ドルと続く。ホットドッグは、スパーズが12.5ドルで1位、ウォリアーズが11.0ドルで2位だ。",
      "ビール2杯、ソフトドリンク2杯、ホットドッグ4本の合計は、ウォリアーズが約101ドルで最も高い。最安席の順位は7位だが、スタンドでの出費は、30チームで最大になる。",
    ],
  },
  {
    heading: "3. いちばん「やさしい」のは、サンダーとホークス",
    paragraphs: [
      "ビール1杯が最も安いのは、サンダーの7.2ドル。次いで、ホークスが8.0ドルだ。飲食の合計が最も安いのは、ホークスの約38ドル。最も高いウォリアーズ（約101ドル）の、約2.7分の1にあたる。",
      "ホットドッグは、サンズが2.0ドル、ホークスが3.2ドルと、他のチームを大きく下回る。",
    ],
  },
  {
    heading: "4. 駐車場も、アリーナで差がつく",
    paragraphs: [
      "駐車場が最も高いのは、76ersの51ドル。クリッパーズ（41ドル）、スパーズ（39ドル）が続く。最も安いのは、ペリカンズの8ドルで、ジャズ（10ドル）が次に安い。",
    ],
  },
  {
    heading: "5. 2025年の王者は、いちばん「手が届く」",
    paragraphs: [
      "2025年に優勝したサンダーは、最安席が30チーム中17位の49ドル。ビールは、30チームで最も安い。強いチームを、手頃な値段で見られる、数少ないアリーナだ。",
    ],
  },
];

export const metadata: Metadata = {
  title: "NBAアリーナ別 価格比較 | NBA Front Office Japan",
  description: "NBA全30チームの本拠地アリーナで、最安席のチケット、ビールなどの飲食、駐車場、家族4人の観戦費用を比べたランキングです。",
  alternates: { canonical: "/rankings/arena-prices" },
};

export default function ArenaPricesPage() {
  return (
    <PageShell>
      <nav aria-label="パンくずリスト" className="mb-4 text-xs text-muted">
        <Link href="/rankings" className="hover:text-blue">
          ランキング
        </Link>
        <span aria-hidden className="mx-1.5">›</span>
        <span aria-current="page">アリーナ別 価格比較</span>
      </nav>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Rankings · Arena Prices</p>
      <h1 className="mb-3 text-[36px] font-semibold tracking-tight">NBAアリーナ別 価格比較</h1>
      <p className="mb-6 text-sm text-muted">
        NBA全30チームの本拠地アリーナで、観戦にかかる費用を比べました。チケットは各チームで最も安い席の価格、飲食は定番の3品です。
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">順位表</h2>
        <ArenaPricesTable rows={ARENA_PRICES} />
        <p className="mt-2 text-xs text-muted">ボタンで並べ替えできます。どの並びも1位が最も高く、同額は同順位です。</p>
      </section>

      <section className="mb-8 border border-line bg-surface p-4 sm:p-6">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Points</p>
        <h2 className="mb-3 text-base font-semibold">数字から見える、5つの特徴</h2>
        <p className="mb-5 text-sm leading-relaxed">同じNBAでも、観戦の値段は、アリーナによって大きく違う。</p>
        <div className="space-y-5">
          {POINTS.map((point) => (
            <div key={point.heading}>
              <h3 className="mb-1.5 text-sm font-bold">{point.heading}</h3>
              <div className="space-y-2 text-sm leading-relaxed text-muted">
                {point.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted">ここでの価格は、ある時点の目安で、公式販売の価格や、試合ごとの価格とは異なる。</p>
      </section>

      <section className="border border-line bg-surface p-4 text-xs text-muted sm:p-6">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Notes</p>
        <h2 className="mb-3 text-base font-semibold text-foreground">データについて</h2>
        <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
          {DATA_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
