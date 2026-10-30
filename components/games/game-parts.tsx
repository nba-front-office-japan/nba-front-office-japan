import type { ReactNode } from "react";
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
  // 日程に無い試合のボックススコア(新書式Excel)も同じく開始時刻がない
  if ((game.preseason || game.status === "final") && !game.tipoffAt) {
    // プレシーズン(Excel取り込み)は開始時刻のデータがないため、日本時間の試合日だけを表示する
    return <span className="text-xs text-muted">{game.jstDate ? `${formatJstDateLabel(game.jstDate)}（日本時間）・` : ""}開始時刻の掲載なし</span>;
  }
  if (!game.tipoffAt) return <span className="text-xs text-muted">開始時刻未定</span>;
  return <span className="text-xs text-muted">{formatJstTime(game.tipoffAt)} 開始（日本時間）</span>;
}

// 結果を隠しているときの表示。onReveal を押したときだけ結果を取得・表示する。
// children は見出しの直下(説明文・ボタンより上)に表示する(試合結果の一覧では、その日のデータの入力状況)。
// toneClass を渡すと、枠全体をその配色(入力状況ごとの淡い背景色・濃い文字色)にし、ボタンは濃紺にする。
export function SpoilerGate({
  message,
  onReveal,
  onChooseIndividual,
  loading,
  children,
  toneClass,
}: {
  message: string;
  onReveal: () => void;
  /** 対戦カードだけを先に表示し、選んだ1試合だけ結果を開く一覧へ進む */
  onChooseIndividual?: () => void;
  loading: boolean;
  children?: ReactNode;
  toneClass?: string;
}) {
  return (
    <div className={`border-[3px] border-double px-5 py-6 text-center sm:py-8 ${toneClass ?? "border-foreground bg-surface"}`}>
      <p className="np-blackletter mb-1 text-3xl leading-none text-[var(--np-red,var(--blue))] sm:text-4xl">Spoiler Free</p>
      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[3px] text-muted">Extra edition</p>
      <p className="np-serif mx-auto mb-2 mt-3 max-w-xl border-y border-foreground py-2 text-lg font-bold sm:text-xl">{message}</p>
      {children && <div className="mb-5 mt-4">{children}</div>}
      <p className="np-serif mb-5 text-xs leading-6 text-muted">ネタバレ防止のため、試合の勝敗・点数は、選んだ試合だけ表示できます。</p>
      {onChooseIndividual ? (
        <div className="mx-auto grid max-w-xl gap-3 text-left sm:grid-cols-2">
          <button
            type="button"
            onClick={onReveal}
            disabled={loading}
            className="selection-button selection-blue np-ink-navy border-2 border-[var(--np-navy,var(--navy))] px-5 py-4 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-60"
          >
            <span className="np-serif block text-base font-extrabold">一覧でみる</span>
            <span className="mt-1 block text-xs font-medium opacity-85">全試合の結果を表示</span>
          </button>
          <button
            type="button"
            onClick={onChooseIndividual}
            disabled={loading}
            className="selection-button selection-gold np-ink-red border-2 border-[var(--np-red,#a8262b)] px-5 py-4 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-60"
          >
            <span className="np-serif block text-base font-extrabold">個別にみる</span>
            <span className="mt-1 block text-xs font-medium opacity-85">開きたい試合だけ結果を表示</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onReveal}
          disabled={loading}
          className="selection-button selection-blue np-ink-navy np-serif border-2 border-[var(--np-navy,var(--navy))] px-6 py-3 text-sm font-extrabold disabled:opacity-60"
        >
          {loading ? "読み込み中…" : "結果を表示する"}
        </button>
      )}
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
