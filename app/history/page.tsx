import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "NBAはなぜルールを変え始めたのか | NBA Front Office Japan",
  description:
    "24秒ショットクロック、ペイントエリア、チェンバレン対策。NBAが競技を変えてきた1950〜60年代のルール史を、資料館のような年表でたどります。",
};

type ArchivePhoto = { src: string; alt: string; caption: string };

type Exhibit = {
  era: string;
  title: string;
  body: string;
  details?: string[];
  facts: string[];
  label: string;
  kind: "archive" | "motion" | "clock" | "gallery";
  photos?: ArchivePhoto[];
};

const ruleTimeline = [
  {
    season: "1951-52",
    title: "制限区域を6ftから12ftへ拡大",
    detail: "ジョージ・マイカンのような大型センターの支配を抑え、ゴール下により広い空間をつくった。",
  },
  {
    season: "1954-55",
    title: "24秒ショットクロックを導入",
    detail: "ボール保持による試合の停滞を防ぎ、NBAの試合テンポを根本から変えた。",
  },
  {
    season: "1964-65",
    title: "制限区域を現在の16ftへ拡大",
    detail: "ウィルト・チェンバレンの圧倒的なゴール下支配も背景に、さらに広いペイントエリアになった。",
  },
  {
    season: "1979-80",
    title: "3ポイントラインを導入",
    detail: "遠距離からの成功に追加の1点を与え、コートの横幅と戦術の価値を変えた。",
  },
  {
    season: "2001-02",
    title: "ゾーンディフェンス解禁・ディフェンス3秒",
    detail: "従来の違法ディフェンス規定を改め、ゾーンを認める一方で、守備側のペイント内滞在を制限した。",
  },
  {
    season: "2018-19",
    title: "オフェンスリバウンド後は14秒リセット",
    detail: "リングに当たった後も攻撃側が保持した場合、ショットクロックは24秒ではなく14秒へ。攻防の連続性を高めた。",
  },
  {
    season: "2022-23",
    title: "トランジション・テイクファウルを強化",
    detail: "速攻を意図的なファウルで止める行為に、フリースロー1本と攻撃権を与える扱いを導入した。",
  },
];

const eraFigures = [
  { name: "ビル・ラッセル", note: "守備と勝利の基準を変えたセルティックス王朝の中心。" },
  { name: "ウィルト・チェンバレン", note: "規格外の得点力とサイズで、ルール改変を考えさせた支配者。" },
  { name: "ボブ・クージー", note: "ボールハンドリングとパスで初期NBAのガード像を広げた。" },
  { name: "ジェリー・ウェスト", note: "レイカーズを率い、60年代の大舞台を彩った万能ガード。" },
  { name: "カリーム・アブドゥル＝ジャバー", note: "ルー・アルシンダーから、スカイフックを完成させた次代の象徴。" },
];

const eraMilestones = [
  "1956　ラッセルがドラフト当日のトレードでセルティックスへ加入",
  "1957　ラッセルがセルティックスを球団初優勝へ導く",
  "1962　チェンバレンがニックス戦で1試合100得点を記録",
  "1967　チェンバレンが76ersを優勝へ導く",
  "1969　ラッセルが選手兼HCとしてセルティックスを優勝へ導く",
];

const exhibits: Exhibit[] = [
  {
    era: "1950.11.22",
    title: "19-18が突きつけた、止まる試合という問題",
    body: "ショットクロックのない時代、リードしたチームはシュートを打たず、ボールを持ち続けることができた。フォートウェイン対ミネアポリスの19-18は、バスケットボールの試合そのものが止まりうることを象徴する一戦として残っている。",
    details: [
      "1946年にBAAとして始まり、1949年にNBAとなった当時のプロバスケットボールには、オフェンスの持ち時間がなかった。リードしたチームはシュートを打たず、ボールを保持し続けることができた。",
      "フォートウェインはジョージ・マイカンを擁するレイカーズと通常のペースで戦うことを避けた。成功したフィールドゴールは両チーム4本ずつ、合計8本。レイカーズの18得点のうち15得点をマイカン一人が記録している。",
      "この試合が示したのは、ボールを持ち続ければ試合そのものを止められるという問題だった。NBAは競技を成立させるための解決策を迫られていく。",
    ],
    facts: ["NBA史上最低得点の試合", "両チーム合計 37得点", "成功FGは両軍4本ずつ", "マイカンは18得点中15得点"],
    label: "ARCHIVE 01",
    kind: "gallery",
    photos: [
      { src: "/history/mikan-fort-wayne.png", alt: "ジョージ・マイカンとフォートウェインの選手を写した新聞写真", caption: "フォートウェイン対ミネアポリス、19-18を伝える新聞資料" },
      { src: "/history/fort-wayne-boxscore.png", alt: "ミネアポリスとフォートウェインのボックススコア", caption: "両チーム合計37得点を示す当時のボックススコア" },
      { src: "/history/mikan-layup.png", alt: "ゴール下でシュートを放つジョージ・マイカン", caption: "初期NBAを支配したジョージ・マイカン" },
    ],
  },
  {
    era: "1951 → 1964",
    title: "支配的なセンターが、コートの形を変えた",
    body: "ジョージ・マイカンの支配に対応して、制限区域は6フィートから12フィートへ拡大された。さらにウィルト・チェンバレンの登場後、1964-65シーズンから現在の16フィートへ。NBAのコートには、二人のビッグマンの足跡が残っている。",
    details: [
      "身長208cmのマイカンは、フックシュートとサイズでゴール下を支配し、ミネアポリス・レイカーズを初期NBAの王朝へ導いた。当時の制限区域の幅はわずか6フィートだった。",
      "1951-52シーズンからの拡大により、センターはそれまでよりゴールから離れた位置でプレーする必要が生まれた。突出した才能と競技全体のバランスをどう両立させるかという、NBA初期の大きな問いへの回答だった。",
    ],
    facts: ["〜1950-51：幅6ft", "1951-52〜：幅12ft", "1964-65〜：幅16ft"],
    label: "COURT EVOLUTION",
    kind: "motion",
  },
  {
    era: "1954-55",
    title: "24秒は、48分の試合から逆算された",
    body: "48分は2,880秒。両チーム合計120本程度のシュートが生まれるテンポを基準に、2,880を120で割って24秒が導かれた。ショットクロックは、速さのためだけでなく、試合を商品として成立させるための設計だった。",
    details: [
      "シラキュース・ナショナルズのオーナー、ダニー・バイアソーンとGMのレオ・フェリスが考案し、NBAは1954年に採用。1954-55シーズンから24秒ショットクロックを導入した。",
      "1クォーター12分、4クォーターで48分。48分を秒にすると2,880秒で、テンポのよい試合で両チーム合計120本程度のシュートが打たれると考え、2,880÷120から24秒を導いた。",
      "導入前年の1953-54シーズンに79.5点だった1チーム平均得点は、1954-55シーズンには93.1点へ上昇した。ボールを何分も保持する戦術は不可能になり、NBAの試合そのものが変わった。",
    ],
    facts: ["48分 × 60秒 = 2,880秒", "2,880 ÷ 120本 = 24秒", "平均得点 79.5 → 93.1"],
    label: "THE 24-SECOND CLOCK",
    kind: "clock",
  },
  {
    era: "1959 → 1964",
    title: "チェンバレンの存在は、ルールの外側まで届いた",
    body: "ルーキーイヤーから圧倒的な数字を残したウィルト・チェンバレンは、1961-62シーズンに平均50.4得点、1962年には1試合100得点を記録した。ペイントの拡大だけでなく、ゴール周辺やフリースローをめぐる規則を考える契機にもなった。",
    details: [
      "1959年にNBAへ現れたチェンバレンは、ルーキーシーズンから平均37.6得点、27.0リバウンドを記録。1961-62シーズンには平均50.4得点、1962年3月2日には現在もNBA記録の1試合100得点を残した。",
      "1964-65シーズンから制限区域は12フィートから16フィートへ再び拡大された。現在のNBAコートに残る16フィートのペイントエリアには、マイカンとチェンバレンという二人の支配的なビッグマンの影響が刻まれている。",
      "チェンバレンの跳躍力は、フリースローやゴール周辺の規則を競技としてどう運用するかまで考えさせた。高さという圧倒的な優位を、いかにバスケットボールとして成立させるか。それもNBAが向き合った課題だった。",
    ],
    facts: ["1961-62：平均50.4得点", "1962.03.02：1試合100得点", "1964-65：ペイントを16ftへ"],
    label: "WILT'S ERA",
    kind: "gallery",
    photos: [
      { src: "/history/wilt-100.png", alt: "100点の記録を示すウィルト・チェンバレンの写真", caption: "1962年、現在も残る1試合100得点の記録" },
      { src: "/history/wilt-jump-shot.png", alt: "高い打点からシュートを放つウィルト・チェンバレン", caption: "規格外のサイズと跳躍力はルールを考え直す契機になった" },
    ],
  },
  {
    era: "1967 → 1977",
    title: "ダンク禁止と、ジャバーのスカイフックへの道",
    body: "大学バスケットボールでは、ルー・アルシンダーが活躍した時代にダンクが禁止された。NBAのルール変更ではないが、圧倒的な才能が競技のルールや戦術に影響を与えるという時代の空気をよく表している。後のカリーム・アブドゥル＝ジャバーは、別の止められない武器を完成させていった。",
    details: [
      "UCLAのルー・アルシンダー（後のカリーム・アブドゥル＝ジャバー）が大学バスケットボールを支配していた時代、NCAAは1967-68シーズンから試合中と試合前ウォームアップでのダンクを禁止した。これはNBAではなく、NCAAにおけるルール変更である。",
      "禁止がアルシンダーだけを止めるためだったと単純化するのは避けるべきだが、当時からその圧倒的な存在と結びつけて語られ、「アルシンダー・ルール」とも呼ばれた。ダンク禁止は1976-77シーズンまで、9シーズン続いた。",
      "ダンクに頼らず得点する必要があったアルシンダーはフックシュートを磨き、後にNBA史上を代表する武器となるスカイフックへつなげていく。白黒中心の展示からカラー写真へ移ることで、時代が進んだことも見せている。",
    ],
    facts: ["NCAAのダンク禁止：9シーズン", "のちのカリーム・アブドゥル＝ジャバー", "スカイフックという回答"],
    label: "THE NEXT ANSWER",
    kind: "gallery",
    photos: [
      { src: "/history/wilt-action.png", alt: "ロサンゼルス・レイカーズ時代にシュートを放つカリーム・アブドゥル＝ジャバー", caption: "レイカーズ時代、ゴール下でプレーするカリーム・アブドゥル＝ジャバー" },
      { src: "/history/alcindor-ucla.png", alt: "UCLA時代にダンクを決めるルー・アルシンダー", caption: "UCLA時代のルー・アルシンダー" },
      { src: "/history/kareem-bucks.png", alt: "ミルウォーキー・バックスのカリーム・アブドゥル＝ジャバー", caption: "NBAで完成したカリーム・アブドゥル＝ジャバーのキャリア" },
    ],
  },
];

function ExhibitVisual({ exhibit }: { exhibit: Exhibit }) {
  if (exhibit.kind === "gallery" && exhibit.photos) {
    return (
      <div className={`grid gap-3 ${exhibit.photos.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
        {exhibit.photos.map((photo, index) => (
          <figure
            key={photo.src}
            className={`history-gallery__photo overflow-hidden rounded-xl border border-[#8d754c] bg-[#050606] p-1.5 ${
              exhibit.photos && exhibit.photos.length === 3 && index === 0 ? "col-span-2" : ""
            }`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              width={960}
              height={960}
              className={`w-full rounded-lg bg-[#050606] object-contain ${exhibit.photos && exhibit.photos.length === 3 && index === 0 ? "aspect-[16/9]" : "aspect-[4/5]"}`}
            />
            <figcaption className="px-1.5 pb-1 pt-2 text-[11px] leading-4 text-[#d9c7a5]">{photo.caption}</figcaption>
          </figure>
        ))}
      </div>
    );
  }

  if (exhibit.kind === "motion") {
    return (
      <figure className="history-gallery__photo overflow-hidden rounded-2xl border border-[#8d754c] bg-[#050606] p-2" aria-label="NBAペイントエリアが6フィートから12フィート、16フィートへ変化する図解モーション">
        <div className="history-paint-motion relative aspect-[4/3] overflow-hidden rounded-xl">
          <Image
            src="/history/paint-motion-01.png"
            alt="NBAペイントエリアの変遷。6フィート、12フィート、16フィートを比較した図"
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="history-paint-motion__frame history-paint-motion__frame--1 object-cover"
            priority
          />
          <Image
            src="/history/paint-motion-02.png"
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="history-paint-motion__frame history-paint-motion__frame--2 object-cover"
          />
          <Image
            src="/history/paint-motion-03.png"
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="history-paint-motion__frame history-paint-motion__frame--3 object-cover"
          />
          <Image
            src="/history/paint-motion-04.png"
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="history-paint-motion__frame history-paint-motion__frame--4 object-cover"
          />
        </div>
        <figcaption className="px-2 pb-1 pt-3 text-xs leading-5 text-[#d9c7a5]">
          資料：ペイントエリアの変遷。6ft → 12ft → 16ft と順に広がります。
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
    <div className="history-gallery flex min-h-screen flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-7 sm:py-10">
      <nav aria-label="パンくずリスト" className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#c4b69e]">
        <Link href="/guide" className="font-semibold text-[#e7bf70] hover:underline">NBAガイド</Link>
        <span aria-hidden>›</span>
        <span className="font-semibold text-[#f5efe1]">NBAの歴史</span>
      </nav>

      <section className="history-gallery__hero overflow-hidden rounded-2xl border border-[#655433] text-[#f6efde]">
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
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#d8d4c9] sm:text-[15px]">
              現在では当たり前に見えるルールも、最初から存在したわけではない。ゲームを成立させ、観る価値をつくるための試行錯誤が、今日のNBAを形づくっている。
            </p>
          </div>
          <div className="border-l-2 border-[#cda657] pl-5 text-sm leading-7 text-[#e8dfca]">
            <p className="font-serif text-lg font-bold text-white">1950s–1960s</p>
            <p className="mt-2">競技を「見たい」と思わせるために、NBAが最初の大きな改革を重ねた時代。</p>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-5xl">
        <section className="history-gallery__curator rounded-2xl border border-[#66563a] p-5 sm:p-7">
          <p className="text-[11px] font-extrabold tracking-[.2em] text-[#e1bb71]">CURATOR&apos;S NOTE</p>
          <p className="mt-2 font-serif text-xl font-bold leading-8 text-[#f5efe1] sm:text-2xl">
            このページは、NBAのルールが「選手に適応するだけ」のものではなく、競技そのものを成立させるために変わってきた歴史をたどる展示です。
          </p>
        </section>

        <section aria-labelledby="era-figures" className="history-gallery__timeline mt-8 rounded-2xl border border-[#66563a] p-5 sm:p-8">
          <p className="text-[11px] font-extrabold tracking-[.22em] text-[#e1bb71]">THE PEOPLE OF THE ERA</p>
          <h2 id="era-figures" className="mt-2 font-serif text-2xl font-bold text-[#f5efe1] sm:text-3xl">この時代を形作った名選手たち</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_1fr_1.25fr]">
            <section aria-label="象徴的なスター">
              <h3 className="text-sm font-extrabold text-[#f5efe1]">象徴的なスター</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {eraFigures.map((player) => (
                  <li key={player.name} title={player.note} className="rounded-full border border-[#66563a] bg-[#1b1d23] px-3 py-1.5 text-sm font-bold text-[#f5efe1]">
                    {player.name}
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="代表チーム">
              <h3 className="text-sm font-extrabold text-[#f5efe1]">代表チーム</h3>
              <ul className="mt-3 space-y-2 text-sm font-bold text-[#f5efe1]">
                <li className="rounded-xl border border-[#66563a] bg-[#1b1d23] px-3 py-2">ボストン・セルティックス</li>
                <li className="rounded-xl border border-[#66563a] bg-[#1b1d23] px-3 py-2">フィラデルフィア／サンフランシスコ・ウォリアーズ</li>
                <li className="rounded-xl border border-[#66563a] bg-[#1b1d23] px-3 py-2">ロサンゼルス・レイカーズ</li>
              </ul>
            </section>
            <section aria-label="時代のタイムライン">
              <h3 className="text-sm font-extrabold text-[#f5efe1]">時代のタイムライン</h3>
              <ol className="mt-3 space-y-2 border-l border-[#8d754c] pl-4 text-sm leading-6 text-[#d5ccbd]">
                {eraMilestones.map((milestone) => <li key={milestone}>{milestone}</li>)}
              </ol>
            </section>
          </div>
        </section>

        <div className="mt-10 space-y-12 sm:space-y-16">
          {exhibits.map((exhibit, index) => {
            const reverse = index % 2 === 1;
            return (
              <section key={exhibit.title} className="history-gallery__exhibit grid gap-6 rounded-2xl border border-[#322d25] p-5 sm:p-8 lg:grid-cols-2 lg:items-center lg:gap-12">
                <div className={reverse ? "lg:order-2" : ""}>
                  <ExhibitVisual exhibit={exhibit} />
                </div>
                <div className={reverse ? "lg:order-1" : ""}>
                  <p className="text-[11px] font-extrabold tracking-[.2em] text-[#e1bb71]">{exhibit.era}</p>
                  <h2 className="mt-2 font-serif text-2xl font-bold leading-tight tracking-tight text-[#f5efe1] sm:text-3xl">{exhibit.title}</h2>
                  <p className="mt-4 text-[15px] leading-8 text-[#d5ccbd]">{exhibit.body}</p>
                  {exhibit.details && (
                    <div className="mt-4 space-y-4 text-[15px] leading-8 text-[#d5ccbd]">
                      {exhibit.details.map((detail) => <p key={detail}>{detail}</p>)}
                    </div>
                  )}
                  <ul className="mt-5 divide-y divide-[#66563a] border-y border-[#66563a] text-sm text-[#e2d7c4]">
                    {exhibit.facts.map((fact) => (
                      <li key={fact} className="py-2.5 pl-4 before:mr-3 before:text-[#e1bb71] before:content-['◆']">{fact}</li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>

        <section className="history-gallery__curator mt-14 rounded-2xl border border-[#66563a] p-5 sm:p-8">
          <p className="text-[11px] font-extrabold tracking-[.22em] text-[#e1bb71]">THE RULES RESPOND</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-[#f5efe1] sm:text-3xl">スターを止めるために、ルールが変わった時代</h2>
          <div className="mt-4 grid gap-4 text-[15px] leading-8 text-[#d5ccbd] sm:grid-cols-2">
            <p>ジョージ・マイカンがゴール下を支配すれば、制限区域は広がった。試合が止まれば、24秒ショットクロックが生まれた。ウィルト・チェンバレンの存在は、ペイントエリアをさらに広げ、ゴール周辺の規則まで考え直す契機になった。</p>
            <p>ルールは、突出した選手を罰するためだけのものではない。スターの才能を残しながら、競技としての緊張感と公平さを保つための応答だった。その問いは、3ポイントラインが登場する次の時代にも引き継がれていく。</p>
          </div>
        </section>

        <section aria-labelledby="rule-timeline" className="history-gallery__timeline mt-14 rounded-2xl border border-[#66563a] p-5 sm:p-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-extrabold tracking-[.22em] text-[#e1bb71]">RULES TIMELINE</p>
            <h2 id="rule-timeline" className="mt-2 font-serif text-2xl font-bold text-[#f5efe1] sm:text-3xl">NBAルール改変年表</h2>
            <p className="mt-3 text-sm leading-7 text-[#d5ccbd]">試合の停滞、センターの支配、戦術の変化。主要な改変を年代順にたどります。</p>
          </div>
          <ol className="mt-7 border-l border-[#8d754c] pl-5 sm:ml-3 sm:pl-8">
            {ruleTimeline.map((item) => (
              <li key={item.season} className="history-gallery__timeline-item relative pb-7 last:pb-0">
                <span className="absolute -left-[1.78rem] top-1.5 h-3 w-3 rounded-full border-2 border-[#0e0f10] bg-[#e1bb71] sm:-left-[2.28rem]" aria-hidden />
                <p className="text-xs font-extrabold tracking-[.16em] text-[#e1bb71]">{item.season}</p>
                <h3 className="mt-1 text-base font-bold text-[#f5efe1] sm:text-lg">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#d5ccbd]">{item.detail}</p>
              </li>
            ))}
          </ol>
          <p className="mt-7 border-t border-[#66563a] pt-4 text-xs leading-5 text-[#c4b69e]">資料：NBA公式のルール・歴史資料をもとに作成。</p>
        </section>

        <section className="mt-14 border-t-2 border-[#66563a] py-8 text-center">
          <p className="text-[11px] font-extrabold tracking-[.22em] text-[#e1bb71]">NEXT EXHIBITION</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-[#f5efe1]">3ポイントはNBAをどう変えたのか</h2>
          <p className="mt-3 text-sm leading-7 text-[#c4b69e]">距離によってシュートの価値を変えた、次の大きなルール革命へ。</p>
        </section>
      </div>

      <Link href="/guide" className="selection-button mt-8 inline-block rounded-lg px-2 py-1 text-sm font-extrabold text-[#e7bf70] underline underline-offset-4 hover:text-white hover:no-underline">
        ← NBAガイド一覧に戻る
      </Link>
      </main>
    </div>
  );
}
