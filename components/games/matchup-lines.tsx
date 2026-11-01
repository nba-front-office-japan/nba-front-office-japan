import type { GameMatchup } from "@/lib/games/types";

// 結果を隠している枠の中に出す、その日の対戦カード(アウェイ vs ホーム)。勝敗・得点・開始時刻は出さない(ネタバレ防止)。
// 左右の列を同じ幅にして、複数行でも「vs」が縦にそろうようにする。
export function MatchupLines({ matchups }: { matchups: GameMatchup[] }) {
  return (
    <ul aria-label="この日の対戦カード" className="np-serif mx-auto mb-4 w-full max-w-sm text-[13px] font-bold leading-[1.4] sm:text-sm">
      {matchups.map((m) => (
        <li key={`${m.away}-${m.home}`} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2">
          <span className="text-right">{m.away}</span>
          <span className="text-xs font-normal text-muted">vs</span>
          <span className="text-left">{m.home}</span>
        </li>
      ))}
    </ul>
  );
}
