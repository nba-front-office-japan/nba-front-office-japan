import { formatJstDateLabel, formatJstTime } from "@/lib/games/date";
import { GAME_STATUS_LABEL, type GameSummary } from "@/lib/games/types";

// 試合状態のバッジ(試合前・試合中・試合終了・延期)
export function StatusBadge({ game }: { game: GameSummary }) {
  const style =
    game.status === "in_progress"
      ? "bg-[#c03221] text-white"
      : game.status === "final"
        ? "bg-navy text-white"
        : "border border-line text-muted";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {game.preseason && <span className="inline-block border border-gold px-1.5 py-0.5 text-[11px] font-extrabold text-[#8a5a00] dark:text-gold">プレシーズン</span>}
      <span className={`inline-block px-1.5 py-0.5 text-[11px] font-extrabold ${style}`}>
        {GAME_STATUS_LABEL[game.status]}
        {game.status === "in_progress" && game.statusDetail ? `・${game.statusDetail}` : ""}
      </span>
    </span>
  );
}

export function TipoffTime({ game }: { game: GameSummary }) {
  // プレシーズン(Excel取り込み)は開始時刻のデータがない
  if (game.preseason && !game.tipoffAt) {
    // プレシーズン(Excel取り込み)は開始時刻のデータがないため、日本時間の試合日だけを表示する
    return <span className="text-xs text-muted">{game.jstDate ? `${formatJstDateLabel(game.jstDate)}（日本時間）・` : ""}開始時刻の掲載なし</span>;
  }
  if (!game.tipoffAt) return <span className="text-xs text-muted">開始時刻未定</span>;
  return <span className="text-xs text-muted">{formatJstTime(game.tipoffAt)} 開始（日本時間）</span>;
}

// 結果を隠しているときの表示。onReveal を押したときだけ結果を取得・表示する。
export function SpoilerGate({ message, onReveal, loading }: { message: string; onReveal: () => void; loading: boolean }) {
  return (
    <div className="border border-line bg-surface px-5 py-10 text-center sm:py-14">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Spoiler free</p>
      <p className="mb-2 text-lg font-bold">{message}</p>
      <p className="mb-5 text-xs leading-6 text-muted">ネタバレ防止のため、試合の勝敗・点数は、ボタンを押すまで表示しません。</p>
      <button
        type="button"
        onClick={onReveal}
        disabled={loading}
        className="bg-gold px-5 py-3 text-sm font-extrabold text-[#182238] disabled:opacity-60"
      >
        {loading ? "読み込み中…" : "結果を表示する"}
      </button>
    </div>
  );
}

export function NotReadyNotice() {
  return (
    <div className="border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
      試合データは準備中です。データの取り込みを開始すると、ここに試合結果が表示されます。
    </div>
  );
}
