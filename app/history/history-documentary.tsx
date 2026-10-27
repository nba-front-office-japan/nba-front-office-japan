import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PaintAreaMotion } from "./paint-area-motion";

function ArchiveImage({ src, alt, caption, className = "" }: { src: string; alt: string; caption: string; className?: string }) {
  return <figure className={`history-story__media ${className}`}><Image src={src} alt={alt} width={1200} height={1200} className="h-auto w-full" /><figcaption>{caption}</figcaption></figure>;
}

function ChapterBreak({ year, eyebrow, title, copy }: { year: string; eyebrow: string; title: ReactNode; copy?: ReactNode }) {
  return <section className="history-story__chapter"><p className="history-story__year" aria-hidden>{year}</p><div className="history-story__chapter-copy"><p className="history-story__label">{eyebrow}</p><h2>{title}</h2>{copy ? <p className="history-story__chapter-lead">{copy}</p> : null}</div></section>;
}

function StoryPair({ children, visual, imageFirst = false }: { children: ReactNode; visual: ReactNode; imageFirst?: boolean }) {
  return <section className={`history-story__pair ${imageFirst ? "history-story__pair--image-first" : ""}`}><div className="history-story__body">{children}</div><div className="history-story__visual">{visual}</div></section>;
}

function EraContext() {
  return <section className="history-story__era-context"><div><p className="history-story__label">象徴的スター</p><ul><li>ビル・ラッセル</li><li>ウィルト・チェンバレン</li><li>ジェリー・ウェスト</li><li>エルジン・ベイラー</li></ul></div><div><p className="history-story__label">代表チーム</p><ul><li>ボストン・セルティックス</li><li>ウォリアーズ</li><li>ロサンゼルス・レイカーズ</li></ul></div><div><p className="history-story__label">タイムライン</p><ol><li>1956　ラッセルがセルティックスへ加入</li><li>1962　チェンバレンが1試合100得点</li><li>1964　制限区域を16ftへ拡大</li></ol></div><div className="history-story__era-insight"><p className="history-story__label">戦術の変化</p><p>24秒で加速した攻防に、リバウンド、アウトレットパス、速攻という新しい勝ち筋が重なった。</p></div><div className="history-story__era-insight"><p className="history-story__label">時代の意味</p><p>個人記録の極限と王朝の勝利が対比され、NBAにスターを語る物語性が生まれた。</p></div></section>;
}

export default function HistoryDocumentary() {
  return (
    <div className="history-story flex min-h-screen w-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24">
        <section className="history-story__hero relative isolate min-h-[540px] overflow-hidden border-b border-[#66563a] sm:min-h-[640px]">
          <Image src="/history/wilt-action.png" alt="モノクロのカリーム・アブドゥル＝ジャバーがゴール下でシュートを放つ写真" fill priority sizes="100vw" className="history-story__hero-image -z-20 object-cover opacity-55 grayscale" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,9,10,.98)_0%,rgba(8,9,10,.78)_48%,rgba(8,9,10,.38)_100%)]" />
          <div className="mx-auto flex min-h-[540px] w-full max-w-6xl flex-col justify-end px-5 pb-14 pt-20 sm:min-h-[640px] sm:px-10 sm:pb-20"><p className="history-story__label">HISTORY / RULES</p><p className="mt-5 font-serif text-lg text-[#e1bb71] sm:text-2xl">1950s — 1960s</p><h1 className="mt-4 max-w-4xl font-serif text-5xl font-bold leading-[1.05] tracking-tight text-[#fff8eb] sm:text-7xl lg:text-8xl">NBAはなぜ<br />ルールを変え始めたのか</h1><p className="mt-6 max-w-xl text-lg leading-8 text-[#eee3d0] sm:text-xl">24秒、制限区域、チェンバレン対策まで。スターと競技の間で生まれた、NBA最初の大きな改革をたどる。</p><p className="mt-12 text-[11px] font-extrabold tracking-[.28em] text-[#e1bb71]">SCROLL TO EXPLORE ↓</p></div>
        </section>

        <article className="mx-auto max-w-6xl px-5 sm:px-10">
          <ChapterBreak year="1950" eyebrow="THE SLOWEST GAME" title={<>NBA史上最低得点<br /><span>19 — 18</span></>} copy="ショットを打たなくても、勝つことができた。" />
          <StoryPair visual={<div className="history-story__visual-stack"><ArchiveImage src="/history/mikan-fort-wayne.png" alt="フォートウェイン対ミネアポリスを伝える新聞写真" caption="1950年、フォートウェイン対ミネアポリスの19対18を伝える新聞資料。" /><ArchiveImage src="/history/fort-wayne-boxscore.png" alt="ミネアポリスとフォートウェインの当時のボックススコア" caption="両チーム合計37得点を示す、当時のボックススコア。" /></div>}>
            <p>ショットクロックが存在しなかった当時、リードしたチームがボールを保持し続けても違反にはならなかった。時計を進めながら安全にリードを守る「ストール戦術」は、勝利のためには合理的だった。</p><p>1950年11月22日、フォートウェイン・ピストンズはジョージ・マイカンを擁するミネアポリス・レイカーズと、通常のペースで戦うことを避けた。結果は19対18。両チーム合計37点という、NBA史上最低得点の試合である。</p><p>成功したフィールドゴールは両軍4本ずつ。ミネアポリスの18得点のうち、15点をマイカン一人が記録した。圧倒的なセンターを相手にするとき、相手にボールを渡さないことが最も現実的な対策になっていた。</p><p className="history-story__pullquote">競技として、本当に成立するのか。</p><p>19対18は単なる珍記録ではない。得点を競うはずのゲームが、ルールの空白によって止まりうることを、リーグ全体に突きつけた試合だった。</p>
          </StoryPair>

          <ChapterBreak year="1951" eyebrow="THE PAINT GETS WIDER" title={<>コートそのものが<br />広げられた</>} copy="マイカンは、ペイントの形まで変えた。" />
          <StoryPair imageFirst visual={<ArchiveImage src="/history/mikan-layup.png" alt="ゴール下でプレーするジョージ・マイカン" caption="NBA初期を代表するビッグマン、ジョージ・マイカン。" />}>
            <p>ジョージ・マイカンは、NBA初期を代表するビッグマンだった。ゴール下に居続けるだけで圧倒的な優位を持ち、当時の幅6ftの制限区域では、センターをリングから十分に遠ざける効果が小さかった。</p><p>NBAは1951-52シーズンから、制限区域を6ftから12ftへ拡大した。ポストで構える位置を外側へ押し出し、ビッグマンがゴール直下を独占する時間を減らすためだ。</p><p>これは、突出した選手に合わせてコートそのものを変えた最初期の象徴である。ルール変更は才能を消すためではなく、他の選手や戦術にも選択肢を与えるための競技設計だった。</p>
          </StoryPair>

          <ChapterBreak year="1954" eyebrow="24 SECONDS" title="24秒がNBAを救った" copy="ボールを持ち続けるだけで勝てる時代を終わらせた。" />
          <StoryPair visual={<section className="history-story__data-panel"><p className="history-story__label">THE FORMULA</p><p className="history-story__data-value">48 <small>MIN</small></p><p className="history-story__data-value">2,880 <small>SEC</small></p><p className="history-story__data-symbol">÷</p><p className="history-story__data-value">120 <small>SHOTS</small></p><p className="history-story__data-symbol">=</p><p className="history-story__data-answer">24 <small>SEC</small></p><div className="history-story__score-shift"><span>79.5</span><i>→</i><span>93.1</span><small>POINTS PER TEAM</small></div></section>}>
            <p>19対18のようなストール戦術は、単発の例外ではなかった。ショットクロック導入前は、リードした側が試合を遅くし、観客が待ってもボールが動かない時間が続くことがあった。</p><p>NBAが抱えていたのは、得点の少なさだけではない。試合テンポそのものを、どうすれば観客が「見たい」と思うものへ変えられるかという問題だった。</p><p>NBAの試合は、創設期から基本的に1クォーター12分を4回、合計48分で行われる。48分は2,880秒。テンポの良い試合では、両チーム合わせておよそ120本のシュートが打たれると考えられた。</p><p className="history-story__pullquote">24秒は得点を増やしただけではない。<br />NBAそのものを救った。</p><p>2,880を120で割る。こうして「24秒」が生まれた。1954-55シーズン、リーグ平均得点は1チームあたり79.5点から93.1点へ上昇。わずか1シーズンで13.6点増えた。</p><p>攻撃には締切が生まれ、パス、ドリブル、リバウンド、速攻のすべてが、止まらない試合を作るための要素になった。</p>
          </StoryPair>

          <ChapterBreak year="1959" eyebrow="WILT ARRIVES" title={<>規格外の存在が、<br />リーグを揺らした</>} copy="100点は、一夜の偶然ではなかった。" />
          <StoryPair imageFirst visual={<ArchiveImage src="/history/wilt-jump-shot.png" alt="高い打点からシュートを放つウィルト・チェンバレン" caption="高さと跳躍力を武器にしたウィルト・チェンバレン。" />}>
            <p>1959年にNBAへ現れたウィルト・チェンバレンは、ルーキーシーズンから平均37.6得点、27.0リバウンドを記録した。高さ、リーチ、跳躍力、持久力が同時に備わった存在は、リーグの常識を超えていた。</p><p>1961-62シーズンには平均50.4得点。1962年3月2日の1試合100得点は、その夜だけに起きた奇跡ではなく、シーズン全体が異常な支配に包まれていたことの延長線上にある。</p><p>チェンバレンの支配は、相手チームに戦術上の対策を迫った。そしてNBAには、再びビッグマンへの対策を考える必要が生まれた。</p><div className="history-story__stat-ribbon"><span><b>37.6</b> PPG<br /><small>ROOKIE SEASON</small></span><span><b>27.0</b> RPG<br /><small>ROOKIE SEASON</small></span><span><b>50.4</b> PPG<br /><small>1961-62</small></span></div>
          </StoryPair>

          <ChapterBreak year="1962" eyebrow="100 POINTS" title={<>100<span className="text-[#e1bb71]">.</span><br />POINTS</>} copy="記録紹介では終わらない、シーズン全体の異常。" />
          <StoryPair visual={<ArchiveImage src="/history/wilt-100.png" alt="100点の記録を示すウィルト・チェンバレンの写真" caption="1962年、現在も残る1試合100得点の記録。" className="history-story__media--contain" />}>
            <p>100点という数字は、今もNBA史上最大の個人記録として残る。しかし、この記録だけを切り取ると、チェンバレンがリーグに与えた影響は見えにくい。</p><p>彼は得点だけでなく、リバウンド、ゴール下での位置取り、相手の守備配置まで変えた。対戦相手は、チェンバレンを止めるために人を集め、守備の形を変えなければならなかった。</p><p>個人記録の極限と王朝の勝利が対比されるなか、NBAは「支配的な選手をどう競技の中に置くか」を再び考えることになる。</p>
          </StoryPair>

          <ChapterBreak year="1964" eyebrow="16 FEET" title={<>現在のコートに残る、<br />1960年代の対策</>} copy="今のNBAコートにも、チェンバレンの痕跡が残っている。" />
          <StoryPair visual={<ArchiveImage src="/history/russell-chamberlain-hero.png" alt="ビル・ラッセルとゴール下で競り合うウィルト・チェンバレン" caption="ビル・ラッセルと競り合うチェンバレン。ゴール周辺でのサイズ、リーチ、支配力を示す。" />}>
            <p>1964-65シーズンから、制限区域は12ftから16ftへ再び拡大された。マイカン時代の12ft化に続く、二度目の大きなコート変更である。</p><p>チェンバレン、ビル・ラッセルらがゴール下を支配した時代に、NBAはポストの起点をさらに外側へ動かした。現在のNBAコートに残る16ftのペイントエリアには、1960年代の対策がそのまま刻まれている。</p><p>ペイント幅だけではない。フリースロー時の位置や助走、ゴールテンディング、インバウンドをめぐる規則も、才能と競技の公平性をどう両立させるかという問いをより鮮明にした。</p>
          </StoryPair>
          <EraContext />
          <section className="history-story__paint-exhibit"><div><p className="history-story__label">THE PAINT EXPANDS</p><h3>6ft → 12ft → 16ft</h3><p>マイカン時代の12ft化から、チェンバレンとラッセルの時代の16ft化へ。現在のNBAコートに残る、二人のビッグマンの痕跡をたどる。</p></div><div><PaintAreaMotion /><p>6ftから12ft、そして16ftへ。現在の制限区域は、ここで止まる。</p></div></section>

          <ChapterBreak year="1967" eyebrow="THE DUNK BAN" title={<>ダンク禁止と、<br />次の答え</>} copy="封じられた武器の先に、新しい象徴が生まれた。" />
          <StoryPair imageFirst visual={<ArchiveImage src="/history/alcindor-ucla.png" alt="UCLA時代にダンクを決めるルー・アルシンダー" caption="UCLA時代のルー・アルシンダー。後のカリーム・アブドゥル＝ジャバー。" />}>
            <p>UCLAのルー・アルシンダー、後のカリーム・アブドゥル＝ジャバーは、大学バスケットボールで圧倒的な存在だった。長身と技術を兼ね備えた彼は、ゴール付近でボールを受ければ止めることが難しかった。</p><p>1967-68シーズンからNCAAはダンクを禁止した。これはNBAの規則ではないが、突出した才能とルールの緊張関係を最も分かりやすく示す出来事の一つである。</p><p>禁止は9シーズン続く。だが、ダンクを封じた結果、別の止められない武器が生まれた。</p>
          </StoryPair>

          <ChapterBreak year="1976" eyebrow="DUNK RETURNS" title="スカイフックという回答" copy="ルールは才能を止めるのではない。新しい答えを生ませる。" />
          <StoryPair visual={<ArchiveImage src="/history/kareem-skyhook-color.png" alt="カラー写真でスカイフックを放つカリーム・アブドゥル＝ジャバー" caption="ダンク禁止を経験したアルシンダーが、NBAで完成させたスカイフック。" className="history-story__media--contain" />}>
            <p>ダンク禁止は1976-77シーズンまで続いた。アルシンダーは、リングへまっすぐ向かうだけではない得点手段を磨いた。高い打点から放つフックシュートは、相手が手を伸ばしても届きにくかった。</p><p>NBAでカリーム・アブドゥル＝ジャバーが完成させたスカイフックは、力で押し切るためではなく、止めようのない精度と距離で得点するための武器になった。</p><p>ルールは才能を完全に止めるものではない。競技が制約を置くと、偉大な選手はその制約の中で別の答えを見つける。</p>
          </StoryPair>

          <section className="history-story__finale"><p className="history-story__label">THE RULES RESPOND</p><blockquote>「選手がルールに適応するだけではない。<br />ルールもまた、選手に適応してきた。」</blockquote><div className="history-story__finale-body"><p>19対18の試合が示したのは、得点を競うはずの競技が、ルールの空白によって止まりうるという事実だった。24秒はその空白を埋め、NBAのテンポを作った。</p><p>マイカンとチェンバレンは、ビッグマンの価値を証明すると同時に、ペイントの幅、ゴール周辺、フリースローをめぐる問いを残した。カリームのスカイフックは、制約の中で生まれた技術が、いつしか競技の象徴になりうることを示している。</p></div><div className="history-story__next"><p className="history-story__label">NEXT STORY</p><h2>3ポイントは<br />NBAをどう変えたのか</h2><p>距離によってシュートの価値を変えた、次の大きなルール革命へ。</p></div></section>
        </article>
        <div className="mx-auto mt-12 w-full max-w-6xl px-5 sm:px-10"><Link href="/guide" className="selection-button inline-block rounded-lg px-2 py-1 text-sm font-extrabold text-[#e7bf70] underline underline-offset-4 hover:text-white hover:no-underline">← NBAガイド一覧に戻る</Link></div>
      </main>
    </div>
  );
}
