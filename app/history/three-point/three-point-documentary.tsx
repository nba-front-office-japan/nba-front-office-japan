import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ArchiveImage, ChapterBreak, StoryPair } from "../history-documentary";
import { HistorySeries } from "../history-series";
import { ThreePointFirstShot } from "./three-point-first-shot";
import { ThreePointLineMotion } from "./three-point-line-motion";

const HERO_IMAGE = "/history/three-hero.jpg";

const FIRST_THREE_LINE_SCORE = [
  { team: "Houston Rockets", quarters: [29, 24, 27, 26], total: 106 },
  { team: "Boston Celtics", quarters: [31, 25, 34, 24], total: 114 },
];

const FIRST_THREE_BOX_SCORE = [
  { player: "Cedric Maxwell", stats: ["38", "9-17", "0-0", "4-4", "7", "1", "22"] },
  { player: "Tiny Archibald", stats: ["38", "4-9", "0-0", "5-6", "2", "11", "13"] },
  { player: "Dave Cowens", stats: ["30", "5-13", "0-1", "1-1", "13", "0", "11"] },
  { player: "Larry Bird", stats: ["28", "6-12", "0-1", "2-2", "10", "5", "14"] },
  { player: "Chris Ford", stats: ["27", "7-15", "1-1", "2-2", "3", "2", "17"] },
  { player: "Team Totals", stats: ["240", "45-96", "1-3", "23-25", "45", "26", "114"] },
];

const LINE_FRAMES = [
  { src: "/history/three-line-01.png", alt: "NBA3ポイントラインの変遷。23フィート9インチ、22フィート、再び23フィート9インチを比較した図", label: "比較", description: "図1：3つのラインの比較" },
  { src: "/history/three-line-02.png", alt: "1979年の導入時のライン", label: "1979", description: "図2：1979年の導入時のライン" },
  { src: "/history/three-line-03.png", alt: "1994年に全周22ftへ短縮されたライン", label: "1994", description: "図3：1994年に短縮されたライン" },
  { src: "/history/three-line-04.png", alt: "1997年に復元され、現在まで続くライン", label: "1997", description: "図4：1997年に復元されたライン" },
];

// 画像は public/history/ に後から置く。ページはビルド時に確定するので、置いた後の再デプロイで表示される
function imageAvailable(src: string) {
  return existsSync(path.join(process.cwd(), "public", src));
}

// 画像が未配置のあいだは、同じ大きさの空枠とキャプションを表示する
function StoryImage({ src, alt, caption, className = "" }: { src: string; alt: string; caption: string; className?: string }) {
  if (imageAvailable(src)) return <ArchiveImage src={src} alt={alt} caption={caption} className={`history-story__media--natural ${className}`} />;
  return <figure className={`history-story__media ${className}`}><div role="img" aria-label={alt} className="history-story__image-slot" /><figcaption>{caption}</figcaption></figure>;
}

// 1979年10月12日の試合記録。数字は Basketball-Reference のボックススコアのまま載せる
function FirstThreeGameRecord() {
  return (
    <figure className="history-story__archive">
      <p className="history-story__archive-head"><span>OCTOBER 12, 1979</span><span>BOSTON GARDEN</span></p>
      <table className="history-story__archive-line">
        <caption>試合結果とクォーター別得点</caption>
        <thead><tr><th scope="col">FINAL</th>{["1", "2", "3", "4", "T"].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{FIRST_THREE_LINE_SCORE.map(({ team, quarters, total }) => <tr key={team}><th scope="row">{team}</th>{quarters.map((points, index) => <td key={index}>{points}</td>)}<td><b>{total}</b></td></tr>)}</tbody>
      </table>
      <table className="history-story__archive-box">
        <caption>BOSTON STARTERS</caption>
        <thead><tr><th scope="col">PLAYER</th>{["MIN", "FG", "3P", "FT", "REB", "AST", "PTS"].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{FIRST_THREE_BOX_SCORE.map(({ player, stats }) => <tr key={player} className={player === "Chris Ford" ? "history-story__archive-ford" : undefined}><th scope="row">{player}</th>{stats.map((value, index) => <td key={index}>{value}</td>)}</tr>)}</tbody>
      </table>
      <figcaption>1979年10月12日、セルティックス対ロケッツ。NBAに3ポイントラインが導入された最初のシーズン、その開幕戦でクリス・フォードがリーグ史上初の3ポイントを決めた。<small>Source: Basketball-Reference</small></figcaption>
    </figure>
  );
}

function EraContext() {
  return <section className="history-story__era-context"><div><p className="history-story__label">象徴的スター</p><ul><li>クリス・フォード</li><li>リック・バリー</li><li>スティーブ・カー</li><li>ステフィン・カリー</li><li>クレイ・トンプソン</li></ul></div><div><p className="history-story__label">代表チーム</p><ul><li>ボストン・セルティックス</li><li>ニューヨーク・ニックス</li><li>ゴールデンステート・ウォリアーズ</li></ul></div><div><p className="history-story__label">タイムライン</p><ol><li>1961　ABLが3ポイントを導入</li><li>1967　ABAが採用</li><li>1979　NBAが試験導入</li><li>1994　全周22ftに短縮</li><li>1997　23ft9inに復元</li><li>2012　スプラッシュ・ブラザーズ誕生</li></ol></div><div className="history-story__era-insight"><p className="history-story__label">戦術の変化</p><p>外から撃てる選手が、ゴール下の攻防を広げた。マイカンやチェンバレンの時代にはなかった選択肢が、コートの外側に生まれた。</p></div><div className="history-story__era-insight"><p className="history-story__label">時代の意味</p><p>シュートの価値を決めるのは、距離とルール。NBAは線を動かし、元に戻し、その価値を自ら確かめていった。</p></div></section>;
}

// 歴史シリーズ第2回。第1回(../history-documentary.tsx)と同じ部品・クラスで組み、本文は入稿どおりに載せる
export default function ThreePointDocumentary() {
  return (
    <div className="history-story history-story--three-point flex min-h-screen w-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24">
        <section className="history-story__hero relative isolate min-h-[540px] overflow-hidden border-b border-[#66563a] sm:min-h-[640px]">
          {imageAvailable(HERO_IMAGE) && <div className="history-story__hero-frame absolute inset-y-0 right-0 -z-20"><Image src={HERO_IMAGE} alt="シュートを構えるラリー・バードの後ろ姿" fill priority sizes="(min-width: 701px) 72vw, 100vw" className="history-story__hero-image object-cover opacity-70 grayscale" /></div>}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,9,10,.98)_0%,rgba(8,9,10,.78)_48%,rgba(8,9,10,.38)_100%)]" />
          <div className="mx-auto flex min-h-[540px] w-full max-w-6xl flex-col justify-end px-5 pb-14 pt-20 sm:min-h-[640px] sm:px-10 sm:pb-20"><p className="history-story__label">HISTORY / RULES</p><p className="mt-5 font-serif text-lg text-[#e1bb71] sm:text-2xl">1960s — 2020s</p><h1 className="mt-4 max-w-4xl font-serif text-5xl font-bold leading-[1.05] tracking-tight text-[#fff8eb] sm:text-7xl lg:text-8xl">3ポイントは<br />NBAをどう変えたのか</h1><p className="mt-6 max-w-xl text-lg leading-8 text-[#eee3d0] sm:text-xl">ABLの実験から、NBAの導入、短縮、そして復元まで。距離がシュートの価値を決めた、もう一つの大きな改革をたどる。</p><p className="mt-12 text-[11px] font-extrabold tracking-[.28em] text-[#e1bb71]">SCROLL TO EXPLORE ↓</p></div>
        </section>
        <HistorySeries current="/history/three-point" />

        <article className="mx-auto max-w-6xl px-5 sm:px-10">
          <ChapterBreak year="1961" eyebrow="THE HOME RUN IDEA" title={<>3ポイントは<br />興行の発明だった</>} copy="最初に線を引いたのは、NBAではなかった。" />
          <StoryPair visual={<StoryImage src="/history/three-saperstein.jpg" alt="ハーレム・グローブトロッターズの選手たちと並ぶエイブ・サパースタイン" caption="グローブトロッターズの選手たちと、エイブ・サパースタイン（中央）。ABLを立ち上げ、3ポイントを最初にプロリーグへ持ち込んだ。" />}>
            <p>1961年、エイブ・サパースタインは、新リーグ「ABL」を立ち上げた。サパースタインは、1926年に創設された世界的な興行チーム、ハーレム・グローブトロッターズのオーナーだ。巧みなパフォーマンスで観客を沸かせ、NBAの試合の前座にも出て、リーグの人気を支えていた。</p><p>立ち上げの理由は、NBAへの不満だった。長年NBAに協力してきた見返りに、ロサンゼルスの球団を約束されたと考えていた。ところが、球団は手に入らなかった。ロサンゼルスへの移転が認められたのは、ミネアポリス・レイカーズだった。</p><p>サパースタインは、NBAに対抗するリーグを自分で作った。巨大なNBAに挑むには、ルールそのものに、NBAと違う武器が必要だった。</p><p>彼が選んだのが3ポイントだ。遠くから決めれば3点。野球のホームランのような一撃を、バスケットボールに持ち込もうとした。</p><p>距離は25ft。科学的な根拠はなかった。サパースタインが、デポール大のレイ・マイヤー監督とコートにテープを貼って、決めたという。オーナー会議は22ftへの短縮を決めたが、サパースタインは無視して25ftのまま試合を続けた。</p><p>ABLは3ポイントや制限区域の拡大など、8つの新ルールで船出した。だが、観客動員は安定せず、新たな資金も得られなかった。1962年12月31日、わずか1シーズン半で活動を終えた。</p><p className="history-story__pullquote">リーグは消えた。しかし、線は残った。</p><p>3ポイントを「ギミック」と見る声は多かった。それでも、このアイデアは次のリーグへ引き継がれていく。</p>
          </StoryPair>

          <ChapterBreak year="1967" eyebrow="THE ABA EXPERIMENT" title={<>次に走ったのは、<br />ライバル<span className="whitespace-nowrap">リーグだった</span></>} copy="NBAが見送った武器を、別のリーグが拾った。" />
          <StoryPair imageFirst visual={<StoryImage src="/history/three-aba-mikan.jpg" alt="ABAの1周年を祝うケーキの前に立つジョージ・マイカン" caption="ABA初代コミッショナーを務めたジョージ・マイカン。リーグ1周年のケーキとともに。" />}>
            <p>1967年、新リーグABA（アメリカン・バスケットボール・アソシエーション）が開幕した。名前は似ているが、ABLとは別のリーグだ。</p><p>つながりは、人にあった。ABLで優勝したチームのコーチ、ビル・シャーマンが、ABAの創設者たちに、ABLの3ポイントを使うよう勧めた。</p><p>初代コミッショナーは、ジョージ・マイカン。NBAが制限区域を広げてまで抑え込んだ、あのマイカンが、今度はルールを足す側に回った。</p><p>マイカンは、3ポイントが小柄な選手にも得点の機会を与え、守備を広げると考えた。ABAは3ポイントとダンクを、NBAに対抗する看板にした。</p><p className="history-story__pullquote">1976年、ABAは消えた。3ポイントは、置いていかれた。</p><p>ABAは資金難で、球団の解散が相次いだ。1976年、残った4球団（デンバー、インディアナ、ニューヨーク、サンアントニオ）がNBAに加わった。NBAは、3ポイントを「お遊び」と見て、持ち込まなかった。</p>
          </StoryPair>

          <ChapterBreak year="1979" eyebrow="ONE-YEAR TRIAL" title={<>1年限りの<br />実験として始まった</>} copy="導入は、確信ではなく「お試し」だった。" />
          <StoryPair visual={<div className="history-story__visual-stack"><ThreePointFirstShot src="/history/three-ford-first.mp4" label="クリス・フォードがNBA史上初の3ポイントを決める映像" caption="1979年10月12日、クリス・フォードがNBA史上初の3ポイントを成功。" /><FirstThreeGameRecord /></div>}>
            <p>1979年のNBAは、人気の低迷に悩んでいた。ファイナルが、録画で遅れて放送されることさえあった。</p><p>試合に新しい見せ場を足したい。ABAと合併して以降、NBAはABAの人気も意識していた。そこで目をつけたのが、3ポイントだった。</p><p>1979年6月、導入が決まった。まずは1979-80シーズンだけの、試験導入だった。</p><p>反対も根強かった。セルティックスのレッド・アワーバックは、「そんなものは要らない」と言い切った。客寄せの奇策にすぎない、という見方だ。多くのコーチも、ポストプレーとレイアップを重視する戦い方を変えたくなかった。</p><p>線は、頂点とウイングで23ft9in、コーナーで22ft。</p><p className="history-story__pullquote"><span className="whitespace-nowrap">1979年10月12日。</span>NBA初の3ポイントが決まった。</p><p>ボストンのホーム開幕戦、ヒューストン・ロケッツ戦。第1クォーター残り3分48秒、クリス・フォードが正面から沈めた。</p><p>フォードの試投は、この1本だけ。試合は114対106でセルティックスが勝った。</p><p className="history-story__pullquote">最初の1本は、開始時刻の差で決まった。</p><p>その試合では、ロケッツのリック・バリーも3ポイントを1本成功。新ルールはその日のうちに複数の選手によって使われ始めた。同じ夜にはほかの試合も行われていたが、先に始まったのがボストンの試合だった。NBAは3日後、フォードを「最初の1本」と発表した。</p><p>その夜の主役は、別にいた。ラリー・バードとマジック・ジョンソンが、NBAデビューを飾っていた。3ポイントは、静かに生まれた。</p>
          </StoryPair>

          <ChapterBreak year="1980" eyebrow="THE SLOW START" title={<>導入しても、<br />武器にできなかった</>} copy="多くのチームが、3ポイントを敬遠した。" />
          <StoryPair imageFirst visual={<div className="history-story__visual-stack"><section className="history-story__data-panel"><p className="history-story__label">THE MATH</p><p className="history-story__data-caption">3ポイントの損益分岐点</p><p className="history-story__data-value history-story__data-value--equation">3点 × 33.3% = 1.00</p><p className="history-story__data-value history-story__data-value--equation">2点 × 50.0% = 1.00</p><div className="history-story__score-shift"><span>28.0%</span><i>→</i><span>0.84</span><small>POINTS PER SHOT<span className="whitespace-nowrap">（1本あたりの期待得点）</span></small><small>1979-80 LEAGUE AVERAGE</small></div></section><StoryImage src="/history/three-barry.jpg" alt="ロケッツのユニフォームでシュートを放つリック・バリー" caption="ロケッツ時代のリック・バリー。1980年2月9日に、1試合8本の記録をつくった。" /></div>}>
            <p>ホークスは、1979-80シーズンを通して、3ポイントを13本しか決めなかった。ヒュービー・ブラウン監督は、守備と速攻を重視した。ブレッツのディック・モッタ監督は反対し、撃つことを許したのは、ケビン・グレビーだけだった。</p><p>一方で、積極的に使ったチームもあった。クリッパーズのジーン・シュー監督は、ブライアン・テイラーに撃たせた。テイラーは、リーグ最多の239本を試投した。</p><p>リーグ平均は、1チーム1試合あたり2.8本の試投、成功率は28.0%。1チームが決める3ポイントは、1試合0.8本だった。</p><p>なぜ敬遠されたのか。数字にすると、理由が見える。</p><p>3ポイントは、成功率33.3%で、50%の2ポイントと同じ価値になる。当時の3ポイントは28.0%。1本あたり0.84点にしかならなかった。</p><p>リック・バリーは、1980年2月9日に1試合8本という当時の記録をつくった。ラリー・バードは、このルールを好んでいなかった。それでも、相手に精神的なダメージを与える武器として、のちに使いこなした。</p><p>2年目の1980-81は、平均2.0本、成功率24.5%まで下がった。</p><p className="history-story__pullquote">15年たっても、1試合10本に届かなかった。</p><p>1993-94シーズンの平均は9.9本。どのチームも、3ポイントを戦術の柱にする方法を見つけられずにいた。</p>
          </StoryPair>

          <ChapterBreak year="1994" eyebrow="THE SHORTER LINE" title={<>NBAは<br />線を内側に引いた</>} copy="得点が下がっていた。NBAは、3ポイントを近づけた。" />
          <StoryPair visual={<StoryImage src="/history/three-kerr.jpg" alt="ブルズのユニフォームでジャンプシュートを放つスティーブ・カー" caption="短縮された線を最大限に生かした、スティーブ・カー。" />}>
            <p>1990年代前半、リーグの平均得点は下がっていた。1990-91の106.3点から、1993-94は101.5点へ。ニックスに象徴される、体をぶつける守備を和らげる狙いもあった。</p><p>NBAは、23ft9inのラインを、全周22ftに縮めた。1994-95から1996-97までの3シーズンだ。</p><p>試投はすぐに増えた。1993-94の平均9.9本から、1994-95は15.3本、1995-96は16.0本、1996-97は16.8本。</p><p>ジョン・スタークスが217本でリーグ最多。デニス・スコットは1995-96に267本を決めた。そして、この線の最大の勝者のひとりが、スティーブ・カーだった。</p><p className="history-story__pullquote">3ポイントは増えた。しかし、得点は増えなかった。</p><p>平均得点は、1994-95の101.4点から、1995-96は99.5点、1996-97は96.9点へ。3シーズン連続で下がった。</p>
          </StoryPair>

          <ChapterBreak year="1997" eyebrow={`BACK TO 23'9"`} title={<>線は、<br />元の場所へ戻された</>} copy="距離を縮めても、答えは出なかった。" />
          <section className="history-story__solo">
            <div className="history-story__body"><p>1997-98シーズンから、NBAは3ポイントラインを元に戻した。頂点とウイングは23ft9in、コーナーは22ft。</p><p>理由は、狙いが外れたからだ。3ポイントの試投は増えたが、得点は上がらなかった。1996-97の平均得点は96.9点だった。</p><p>戻した1997-98シーズン、平均の試投数は16.8本から12.7本へ減った。得点の低下は止まらず、95.6点だった。</p><p>コーナーが22ftなのは、ラインがサイドラインと平行になるからだ。いちばん近い3ポイントが、そこにある。</p><p className="history-story__pullquote">戻された線は、<span className="whitespace-nowrap">約30年、</span>動いていない。</p><p>1997年に戻された距離は、いまも変わらない。</p></div>
          </section>
          <EraContext />
          <section className="history-story__paint-exhibit"><div><p className="history-story__label">THE LINE MOVES</p><h3>{`23'9" → 22' → 23'9"`}</h3><p>1979年に引かれた線は、1994年に内側へ、1997年に元の場所へ。コーナーは一貫して22ft。いまの距離は、1997年から変わっていない。</p></div><div><ThreePointLineMotion label="NBAの3ポイントラインが23フィート9インチから22フィート、再び23フィート9インチへ変化する図解" frames={LINE_FRAMES.map((frame) => ({ ...frame, available: imageAvailable(frame.src) }))} /><p>23ft9inから22ftへ、そして23ft9inへ。現在の3ポイントラインは、ここで止まる。</p></div></section>

          <ChapterBreak year="2012" eyebrow="THE SPLASH BROTHERS" title={<>距離は同じ。<br />変わったのは、<span className="whitespace-nowrap">撃つ人間だった</span></>} copy="一本の線の外側で、2人の選手が基準を書き換え始めた。" />
          <StoryPair imageFirst visual={<StoryImage src="/history/three-splash.jpg" alt="ウォリアーズのステフィン・カリーとクレイ・トンプソン" caption="2012年に「スプラッシュ・ブラザーズ」と呼ばれた、ステフィン・カリーとクレイ・トンプソン。" />}>
            <p>2012年12月21日。ウォリアーズ公式サイトの記者が、ステフィン・カリーとクレイ・トンプソンを「スプラッシュ・ブラザーズ」と呼んだ。2人で前半に3ポイント7本を沈めた試合だった。</p><p>その2012-13シーズン、カリーは272本を決め、レイ・アレンの269本を抜くシーズン記録をつくった。トンプソンは211本。2人の合計は483本だった。</p><p>その後も合計は伸びた。2013-14は484本、2014-15は525本。</p><p>そして2015-16。カリーは402本、トンプソンは276本。2人で678本。それまでの2人の記録を153本上回る、NBA記録だった。</p><div className="history-story__stat-ribbon"><span><b>402</b> 3PM<br /><small>CURRY, 2015-16 SEASON</small></span><span><b>678</b> 3PM<br /><small>CURRY + THOMPSON, 2015-16 SEASON</small></span><span><b>14</b> 3PM<br /><small>THOMPSON, ONE GAME (2018)</small></span></div><p>カリーは2016-17に、1試合13本を決めた。2018年10月29日、トンプソンが1試合14本を沈め、この記録を更新した。</p><p>リーグ全体も変わった。1チーム1試合あたりの試投数は、2011-12の18.4本から、2018-19の32.0本まで、毎年増え続けた。2015-16は24.1本。とくに2016-17（+2.9本）と2018-19（+3.0本）の伸びが大きかった。</p><p>2021年12月14日、カリーは通算2,974本目でレイ・アレンを抜いた。789試合目、アレンより511試合早い。2025年3月13日には、史上初の通算4,000本に到達した。</p>
          </StoryPair>

          <ChapterBreak year="2026" eyebrow="THE NEW NORMAL" title={<>3ポイントは、<br />競技の前提になった</>} copy="1チーム1試合37本。それが、いまのNBAの平均だ。" />
          <section className="history-story__solo">
            <div className="history-story__body"><p>2025-26シーズンのリーグ平均は、1チーム1試合あたり37.0本の試投、13.3本の成功、成功率36.0%。シュート全体の41.5%が、3ポイントだった。</p><p>1979-80シーズンの2.8本と比べると、13倍を超える。</p><p>個人でも同じだ。1979-80の1試合平均の試投数トップは、リック・バリーの3.07本。2025-26は、ルカ・ドンチッチの10.84本だった。</p><p>最も撃ったのはウォリアーズの44.1本、最も決めたのはホーネッツの16.4本。</p><div className="history-story__score-shift"><span>2.8</span><i>→</i><span>37.0</span><small>3PA PER TEAM</small><small>1979-80 → 2025-26</small></div><p className="history-story__pullquote">線は同じ。3点も同じ。それでも、競技の形は大きく変わった。</p></div>
          </section>

          <section className="history-story__finale"><p className="history-story__label">THE LINE DECIDES</p><blockquote>「一本の線が、シュートの価値を決める。<br />価値が変われば、<span className="whitespace-nowrap">競技が変わる。」</span></blockquote><div className="history-story__finale-body"><p>サパースタインが引いた線は、見世物と呼ばれた。ABAが受け継ぎ、1979年にNBAが1年限りで試した。最初の10年は、ほとんど使われなかった。</p><p>1994年、NBAは線を縮めて得点を動かそうとした。試投は増えたが、得点は増えず、1997年に元の距離へ戻した。</p><p>3ポイントは、導入しただけでは競技を変えなかった。選手が磨き、チームが組み立て、半世紀近くをかけて、競技の前提になった。</p></div><div className="history-story__closing"><p>1979年にNBAへ引かれた一本の線は、当初ほとんど使われなかった。それでも選手と戦術が進化するにつれ、3ポイントはロスター構成、スペーシング、守備の考え方まで変えていった。</p><p>かつては「使うかどうか」を議論された3ポイント。現在のNBAでは、その一本をどう生み出し、どう防ぐかが勝敗を左右している。</p></div><div className="history-story__next"><p className="history-story__label">NEXT STORY</p><h2>現代NBAは<br />どう作られたのか</h2><p>守りを縛り、攻めを解き放った。ゾーン、ハンドチェック、14秒、テイクファウルをめぐる改革へ。</p></div></section>
        </article>
        <div className="mx-auto mt-12 w-full max-w-6xl px-5 sm:px-10"><Link href="/guide" className="selection-button inline-block rounded-lg px-2 py-1 text-sm font-extrabold text-[#e7bf70] underline underline-offset-4 hover:text-white hover:no-underline">← NBAガイド一覧に戻る</Link></div>
      </main>
    </div>
  );
}
