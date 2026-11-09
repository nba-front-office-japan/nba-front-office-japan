import { formatJstTime } from "@/lib/games/date";
import type { GameMatchup, GamePreviewLink } from "@/lib/games/types";
import { PreviewLink } from "./preview-link";

// 結果を隠している枠の中に出す、その日の対戦カード(開始時刻(日本時間) アウェイ vs ホーム)。勝敗・得点は出さない(ネタバレ防止)。
// 左右の列を同じ幅にして、複数行でも「vs」が縦にそろうようにする。
// PCでは時刻の列と同じ幅の空き列を右にも置き、「vs」を中央にそろえる(スマホは幅を優先して空き列なし)。
// 開始時刻が分かる試合が1つもない日(プレシーズン等)は、時刻の列ごと出さない。
// 試合プレビュー記事がある試合(試合当日の終わりまで。日本時間)は、その対戦の下に「プレビューを読む」と見出しを出す。ない試合は何も足さない。
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
            className={`grid ${showTime ? "grid-cols-[2.5rem_minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-1.5 sm:grid-cols-[3rem_minmax(0,1fr)_auto_minmax(0,1fr)_3rem] sm:gap-x-2" : "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2"}`}
          >
            {showTime && (
              <span className="text-left tabular-nums font-normal text-muted">{m.tipoffAt ? formatJstTime(m.tipoffAt) : "未定"}</span>
            )}
            <span className="text-right">{m.away}</span>
            <span className="text-xs font-normal text-muted">vs</span>
            <span className="text-left">{m.home}</span>
            {showTime && <span aria-hidden="true" className="hidden sm:block" />}
            {previews[m.gameId] && <PreviewLink preview={previews[m.gameId]} className="col-span-full mb-2 mt-1 font-normal" />}
          </li>
        ))}
      </ul>
      {showTime && <p className="mb-4 mt-1 text-center text-[11px] text-muted">※ 時刻は試合開始予定（日本時間）</p>}
    </>
  );
}
