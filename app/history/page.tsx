import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "NBAはなぜルールを変え始めたのか | NBA Front Office Japan",
  description:
    "24秒ショットクロック、ペイントエリア、チェンバレン対策。NBAが競技を変えてきた1950〜60年代のルール史を、資料館のような年表でたどります。",
};

const exhibits = [
  {
    era: "1950.11.22",
    title: "19-18が突きつけた、止まる試合という問題",
    body: "ショットクロックのない時代、リードしたチームはシュートを打たず、ボールを持ち続けることができた。フォートウェイン対ミネアポリスの19-18は、バスケットボールの試合そのものが止まりうることを象徴する一戦として残っている。",
    facts: ["NBA史上最低得点の試合", "両チーム合計 37得点", "マイカンは18得点中15得点"],
    label: "ARCHIVE 01",
    kind: "archive" as const,
  },
  {
    era: "1951 → 1964",
    title: "支配的なセンターが、コートの形を変えた",
    body: "ジョージ・マイカンの支配に対応して、制限区域は6フィートから12フィートへ拡大された。さらにウィルト・チェンバレンの登場後、1964-65シーズンから現在の16フィートへ。NBAのコートには、二人のビッグマンの足跡が残っている。",
    facts: ["〜1950-51：幅6ft", "1951-52〜：幅12ft", "1964-65〜：幅16ft"],
    label: "COURT EVOLUTION",
    kind: "image" as const,
  },
  {
    era: "1954-55",
    title: "24秒は、48分の試合から逆算された",
    body: "48分は2,880秒。両チーム合計120本程度のシュートが生まれるテンポを基準に、2,880を120で割って24秒が導かれた。ショットクロックは、速さのためだけでなく、試合を商品として成立させるための設計だった。",
    facts: ["48分 × 60秒 = 2,880秒", "2,880 ÷ 120本 = 24秒", "平均得点 79.5 → 93.1"],
    label: "THE 24-SECOND CLOCK",
    kind: "clock" as const,
  },
  {
    era: "1959 → 1964",
    title: "チェンバレンの存在は、ルールの外側まで届いた",
    body: "ルーキーイヤーから圧倒的な数字を残したウィルト・チェンバレンは、1961-62シーズンに平均50.4得点、1962年には1試合100得点を記録した。ペイントの拡大だけでなく、ゴール周辺やフリースローをめぐる規則を考える契機にもなった。",
    facts: ["1961-62：平均50.4得点", "1962.03.02：1試合100得点", "1964-65：ペイントを16ftへ"],
    label: "WILT'S ERA",
    kind: "archive" as const,
  },
  {
    era: "1967 → 1977",
    title: "ダンク禁止と、スカイフックへの道",
    body: "大学バスケットボールでは、ルー・アルシンダーが活躍した時代にダンクが禁止された。NBAのルール変更ではないが、圧倒的な才能が競技のルールや戦術に影響を与えるという時代の空気をよく表している。後のカリームは、別の止められない武器を完成させていった。",
    facts: ["NCAAのダンク禁止：9シーズン", "のちのカリーム・アブドゥル＝ジャバー", "スカイフックという回答"],
    label: "THE NEXT ANSWER",
    kind: "clock" as const,
  },
];

function ExhibitVisual({ exhibit }: { exhibit: (typeof exhibits)[number] }) {
  if (exhibit.kind === "image") {
    return (
      <figure className="overflow-hidden rounded-2xl border border-[#d2b98f] bg-[#f3e7d1] p-2 shadow-[0_14px_34px_rgba(53,37,17,.16)]">
        <Image
          src="/history/paint-area-evolution.jpg"
          alt="NBAペイントエリアの変遷。6フィート、12フィート、16フィートを比較した図"
          width={1440}
          height={1080}
          className="h-auto w-full rounded-xl"
          priority
        />
        <figcaption className="px-2 pb-1 pt-3 text-xs leading-5 text-[#604b2a]">
          資料：ペイントエリアの変遷。6ftから12ft、そして現在の16ftへ。
        </figcaption>
      </figure>
    );
  }

  if (exhibit.kind === "clock") {
    return (
      <div className="relative grid min-h-[300px] place-items-center overflow-hidden rounded-2xl border border-[#b89454] bg-[#152539] p-6 text-center text-[#f7e5bd] shadow-[0_14px_34px_rgba(20,28,35,.2)]">
        <span className="absolute inset-4 rounded-full border border-[#b89454]/40" aria-hidden />
        <span className="absolute inset-10 rounded-full border border-[#b89454]/20" aria-hidden />
        <div className="relative">
          <p className="font-serif text-xs tracking-[.28em] text-[#dcb86c]">ARCHIVE DISPLAY</p>
          <p className="mt-3 font-serif text-7xl font-bold tracking-tight sm:text-8xl">24</p>
          <p className="mt-2 text-sm font-bold tracking-[.22em]">SECONDS</p>
          <span className="mx-auto mt-6 block h-px w-24 bg-[#dcb86c]" />
          <p className="mt-4 text-xs leading-5 text-[#d8c9a7]">試合を動かすために生まれた時間の規則</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-2xl border border-[#b89454] bg-[#ece0ca] p-6 text-[#1a2635] shadow-[0_14px_34px_rgba(53,37,17,.16)]">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#947a4a_0.7px,transparent_0.7px)] [background-size:5px_5px]" aria-hidden />
      <div className="relative">
        <p className="font-serif text-xs font-bold tracking-[.24em] text-[#765627]">{exhibit.label}</p>
        <span className="mt-5 block h-px w-full bg-[#9c7a42]" />
      </div>
      <p className="relative font-serif text-5xl font-bold tracking-tight text-[#213b58]">{exhibit.era}</p>
      <p className="relative max-w-[18rem] border-l-2 border-[#9c7a42] pl-3 text-sm leading-6 text-[#58472c]">
        NBAのルールは、試合が抱えた課題と、突出した才能への応答として変化してきた。
      </p>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <PageShell>
      <nav aria-label="パンくずリスト" className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <Link href="/guide" className="font-semibold text-blue hover:underline">NBAガイド</Link>
        <span aria-hidden>›</span>
        <span className="font-semibold text-foreground">NBAの歴史</span>
      </nav>

      <section className="overflow-hidden rounded-2xl border border-[#3c4d62] bg-[#13233a] text-[#f6efdE] shadow-[0_18px_45px_rgba(18,35,58,.18)]">
        <div className="border-b border-[#cda657] px-6 py-3 text-center text-[11px] font-extrabold tracking-[.22em] text-[#e1bb71] sm:px-10">
          NBA HISTORY ARCHIVES
        </div>
        <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:gap-12 lg:py-14">
          <div>
            <p className="mb-3 text-[11px] font-extrabold tracking-[.22em] text-[#e1bb71]">RULES, STARS &amp; THE GAME</p>
            <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              NBAはなぜ<br />ルールを変え始めたのか
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#d8d4c9] sm:text-[15px]">
              24秒、制限区域、チェンバレン対策まで。試合が停滞した時、そして一人の選手が圧倒的すぎた時、NBAはルールそのものを変えてきた。
            </p>
          </div>
          <div className="border-l-2 border-[#cda657] pl-5 text-sm leading-7 text-[#e8dfca]">
            <p className="font-serif text-lg font-bold text-white">1950s–1960s</p>
            <p className="mt-2">競技を「見たい」と思わせるために、NBAが最初の大きな改革を重ねた時代。</p>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-5xl">
        <section className="rounded-2xl border border-[#d7c6a7] bg-[#f9f2e5] p-5 text-[#283446] sm:p-7">
          <p className="text-[11px] font-extrabold tracking-[.2em] text-[#87652d]">CURATOR&apos;S NOTE</p>
          <p className="mt-2 font-serif text-xl font-bold leading-8 sm:text-2xl">
            このページは、NBAのルールが「選手に適応するだけ」のものではなく、競技そのものを成立させるために変わってきた歴史をたどる展示です。
          </p>
        </section>

        <div className="mt-10 space-y-12 sm:space-y-16">
          {exhibits.map((exhibit, index) => {
            const reverse = index % 2 === 1;
            return (
              <section key={exhibit.title} className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-12">
                <div className={reverse ? "lg:order-2" : ""}>
                  <ExhibitVisual exhibit={exhibit} />
                </div>
                <div className={reverse ? "lg:order-1" : ""}>
                  <p className="text-[11px] font-extrabold tracking-[.2em] text-[#9a7030]">{exhibit.era}</p>
                  <h2 className="mt-2 font-serif text-2xl font-bold leading-tight tracking-tight text-[#17263a] sm:text-3xl">{exhibit.title}</h2>
                  <p className="mt-4 text-[15px] leading-8 text-[#4a5564]">{exhibit.body}</p>
                  <ul className="mt-5 divide-y divide-[#d9c9ae] border-y border-[#d9c9ae] text-sm text-[#443c31]">
                    {exhibit.facts.map((fact) => (
                      <li key={fact} className="py-2.5 pl-4 before:mr-3 before:text-[#b98a38] before:content-['◆']">{fact}</li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-14 border-t-2 border-[#283b53] py-8 text-center">
          <p className="text-[11px] font-extrabold tracking-[.22em] text-[#9a7030]">NEXT EXHIBITION</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-[#17263a]">3ポイントはNBAをどう変えたのか</h2>
          <p className="mt-3 text-sm leading-7 text-muted">距離によってシュートの価値を変えた、次の大きなルール革命へ。</p>
        </section>
      </div>

      <Link href="/guide" className="selection-button selection-blue mt-8 inline-block rounded-lg px-2 py-1 text-sm font-extrabold text-blue underline underline-offset-4 hover:no-underline">
        ← NBAガイド一覧に戻る
      </Link>
    </PageShell>
  );
}
