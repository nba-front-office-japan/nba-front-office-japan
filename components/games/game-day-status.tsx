import { gameDayLevel, type GameDayLevel, type GameDayStatus } from "@/lib/games/types";

// 日付ごとのデータの入力状況(結果・ボックススコアが保存済みか)。対戦カード・得点・勝敗は出さない(ネタバレ防止)。
// 色: 入力済み=緑 / 一部入力済み=黄 / 未入力=灰 / 予定(試合前)=青

export const LEVEL_DOT_CLASS: Record<GameDayLevel, string> = {
  complete: "bg-[#218c68]",
  partial: "bg-gold",
  none: "bg-[#9aa3b2]",
  scheduled: "bg-blue",
};

// 結果を隠している枠(SpoilerGate)全体の配色。状態ごとに淡い背景色を枠全体に使い、文字は濃い色にする
export const LEVEL_GATE_CLASS: Record<GameDayLevel, string> = {
  complete: "border-[#218c68] bg-[#e3f4ec] text-[#0f5a40] dark:bg-[#123b2e] dark:text-[#bdf0da]",
  partial: "border-[#e0a72e] bg-[#fff1d6] text-[#5f3c00] dark:bg-[#3a2f12] dark:text-[#ffe2a8]",
  none: "border-[#b7bfcc] bg-[#eef0f3] text-[#2f3744] dark:bg-[#262b33] dark:text-[#d8dde6]",
  scheduled: "border-blue bg-[#e6efff] text-[#1d4598] dark:bg-[#16264a] dark:text-[#c7dafd]",
};

export const LEVEL_LABEL: Record<GameDayLevel, string> = {
  complete: "入力済み",
  partial: "一部入力済み",
  none: "未入力",
  scheduled: "予定",
};

// その日のデータの入力状況(結果・ボックススコアそれぞれの入力済みの試合数)。結果を隠している枠の中に、
// 枠と同じ面の情報として置く(独自の背景・枠線は付けない。色は枠の LEVEL_GATE_CLASS に合わせる)。
// 対戦カード・得点・勝敗は出さない(ネタバレ防止)。試合前の試合は「予定」として別に示す。
export function GameDayStatusInfo({ status }: { status: GameDayStatus }) {
  const level = gameDayLevel(status);
  const items: { label: string; value: string }[] =
    level === "scheduled"
      ? [{ label: "予定", value: `全${status.total}試合が試合前です` }]
      : [
          { label: "結果", value: `${status.results}/${status.total}試合入力済み` },
          { label: "ボックススコア", value: `${status.boxScores}/${status.total}試合入力済み` },
          ...(status.upcoming > 0 ? [{ label: "予定", value: `${status.upcoming}試合が試合前です` }] : []),
        ];
  return (
    <section aria-label="この日のデータの入力状況" className="mx-auto w-full max-w-sm text-left">
      <p className="mb-2 flex items-center justify-center gap-2 text-sm font-extrabold">
        <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full ${LEVEL_DOT_CLASS[level]}`} />
        データの入力状況：{LEVEL_LABEL[level]}
      </p>
      <dl className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-current/15 pt-1 text-base">
            <dt className="font-bold">{item.label}</dt>
            <dd className="font-extrabold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
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
