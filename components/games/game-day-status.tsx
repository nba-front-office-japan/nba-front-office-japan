import { gameDayLevel, gameDayStatusText, type GameDayLevel, type GameDayStatus } from "@/lib/games/types";

// 日付ごとのデータの入力状況(結果・ボックススコアが保存済みか)。対戦カード・得点・勝敗は出さない(ネタバレ防止)。
// 色: 入力済み=緑 / 一部入力済み=黄 / 未入力=灰 / 予定(試合前)=青

export const LEVEL_DOT_CLASS: Record<GameDayLevel, string> = {
  complete: "bg-[#218c68]",
  partial: "bg-gold",
  none: "bg-[#9aa3b2]",
  scheduled: "bg-blue",
};

const LEVEL_BADGE_CLASS: Record<GameDayLevel, string> = {
  complete: "border-[#218c68] bg-[#e6f4ee] text-[#17694e] dark:bg-[#123b2e] dark:text-[#7fd6b3]",
  partial: "border-gold bg-[#fff6e0] text-[#7a5200] dark:bg-[#3a2f12] dark:text-[#ffd27a]",
  none: "border-line bg-background text-muted",
  scheduled: "border-blue bg-[#eaf1ff] text-[#2457b7] dark:bg-[#16264a] dark:text-[#9ec0ff]",
};

export const LEVEL_LABEL: Record<GameDayLevel, string> = {
  complete: "入力済み",
  partial: "一部入力済み",
  none: "未入力",
  scheduled: "予定",
};

export function GameDayStatusBadge({ status }: { status: GameDayStatus }) {
  const level = gameDayLevel(status);
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-bold ${LEVEL_BADGE_CLASS[level]}`}>
      <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${LEVEL_DOT_CLASS[level]}`} />
      {gameDayStatusText(status)}
    </span>
  );
}

/** カレンダーの下の凡例 */
export function GameDayStatusLegend() {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
      {(["complete", "partial", "none", "scheduled"] as const).map((level) => (
        <li key={level} className="inline-flex items-center gap-1">
          <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${LEVEL_DOT_CLASS[level]}`} />
          {LEVEL_LABEL[level]}
        </li>
      ))}
    </ul>
  );
}
