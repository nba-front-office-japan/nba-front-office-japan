import type { CSSProperties } from "react";
import { formatJstTime } from "@/lib/games/date";
import type { GameMatchup, GamePreviewLink } from "@/lib/games/types";
import { PreviewLink } from "./preview-link";

// 結果を隠している枠の中に出す、その日の対戦カード(開始時刻(日本時間) アウェイ vs ホーム)。勝敗・得点は出さない(ネタバレ防止)。
// 左右の列を同じ幅にして、複数行でも「vs」が縦にそろうようにする。
// PCでは時刻の列と同じ幅の空き列を右にも置き、「vs」を中央にそろえる(スマホは幅を優先して空き列なし)。
// 開始時刻が分かる試合が1つもない日(プレシーズン等)は、時刻の列ごと出さない。
// 試合プレビュー記事がある試合(試合当日の終わりまで。日本時間)は、その対戦の下に「プレビューを読む」と見出しを出す。
// 対戦カードのチーム名は各試合ブロックの見出しとして、濃い深紅・ゴシック体の太字で大きめに出す(開始時刻は元のサイズ・色)。長い名前も折り返さず1行。
// 1試合を1ブロックとし、プレビューの有無にかかわらず同じ上下の余白と下の区切り線を付ける(どのプレビューがどの試合のものか分かるように)。
export function MatchupLines({ matchups, previews = {} }: { matchups: GameMatchup[]; previews?: Record<string, GamePreviewLink> }) {
  const showTime = matchups.some((m) => m.tipoffAt);
  return (
    <>
      <ul
        aria-label="この日の対戦カード"
        className={`np-serif mx-auto w-full font-bold leading-[1.4] sm:text-sm ${showTime ? "max-w-[26rem] text-[12px] sm:max-w-md" : "mb-4 max-w-sm text-[13px]"}`}
      >
        {matchups.map((m) => (
          <li
            key={m.gameId}
            className={`grid items-center border-b border-line pb-2 pt-3.5 ${showTime ? "grid-cols-[2.5rem_minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-1.5 sm:grid-cols-[3rem_minmax(0,1fr)_auto_minmax(0,1fr)_3rem] sm:gap-x-2" : "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2"}`}
          >
            {showTime && (
              <span className="text-left tabular-nums font-normal text-muted">{m.tipoffAt ? formatJstTime(m.tipoffAt) : "未定"}</span>
            )}
            <TeamName name={m.away} align="text-right" />
            <span className="text-xs font-normal text-muted">vs</span>
            <TeamName name={m.home} align="text-left" />
            {showTime && <span aria-hidden="true" className="hidden sm:block" />}
            {previews[m.gameId] && <PreviewLink preview={previews[m.gameId]} className="col-span-full mt-1.5 font-normal" />}
          </li>
        ))}
      </ul>
      {showTime && <p className="mb-4 mt-1 text-center text-[11px] text-muted">※ 時刻は試合開始予定（日本時間）</p>}
    </>
  );
}

// チーム名(深紅・ゴシック体の太字)。どのチームも1行に収める: 列の幅(コンテナクエリ)を名前の文字数で割った大きさまで文字を小さくする。
// 上限はスマホ15px・PC17px(globals.css の .np-matchup-team)。短い名前は上限のまま、長い名前(トレイルブレイザーズ等)だけ小さくなる。
// 全角は1文字、半角(76ers)は0.6文字として数える。
function TeamName({ name, align }: { name: string; align: string }) {
  const chars = [...name].reduce((n, ch) => n + (ch.charCodeAt(0) < 0x80 ? 0.6 : 1), 0);
  return (
    <span className={`np-matchup-cell ${align}`}>
      {/* 色は「今日」ボタンの赤と同系で、それより濃い深紅(ベージュの紙の上で見出しとしてはっきり読める濃さ)。青はボタン類だけに残す */}
      <span className="np-matchup-team font-extrabold text-[#8f2420]" style={{ "--np-team-chars": chars } as CSSProperties}>
        {name}
      </span>
    </span>
  );
}
