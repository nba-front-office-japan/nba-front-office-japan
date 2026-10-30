import { GAME_STATUS_LABEL, type GameSummary, type GameTeamLine } from "@/lib/games/types";

// 新聞紙風のスコアボード。アウェーを左(紺)、ホームを右(赤)に置き、得点を大きな数字で出す。
// hideScore のとき(個別にみるの対戦カード)は得点・勝敗を一切描画しない(ネタバレ防止)。
// 試合終了の試合は、負けたチームの得点を薄くする。

const STATUS_EN: Record<GameSummary["status"], string> = {
  scheduled: "Tip-off",
  in_progress: "Live",
  final: "Final",
  postponed: "Postponed",
};

function TeamBlock({ team, side, score, faded }: { team: GameTeamLine; side: "away" | "home"; score: number | null | undefined; faded: boolean }) {
  const away = side === "away";
  const ink = away ? "np-ink-navy" : "np-ink-red";
  const text = away ? "text-[var(--np-navy,var(--navy))]" : "text-[var(--np-red,#a8262b)]";
  return (
    <div className={`flex min-w-0 flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-3 sm:text-left ${away ? "" : "sm:flex-row-reverse sm:text-right"}`}>
      <span aria-hidden className={`${ink} np-numeral flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold tracking-wide sm:h-16 sm:w-16 sm:text-lg`}>
        {team.abbreviation}
      </span>
      <div className="min-w-0">
        <span className={`block text-[10px] font-extrabold tracking-[1.5px] ${text}`}>{away ? "アウェー" : "ホーム"}</span>
        <span className="np-serif block text-[13px] font-extrabold leading-tight sm:text-base">{team.nameJa ?? team.name}</span>
        {team.nameJa && <span className="hidden text-[10px] leading-tight text-muted sm:block">{team.name}</span>}
        {score !== undefined && (
          <span className={`np-numeral mt-1 block text-[40px] font-bold leading-none sm:text-[56px] ${text} ${faded ? "opacity-45" : ""}`}>{score ?? "–"}</span>
        )}
      </div>
    </div>
  );
}

export function Scoreboard({ game, hideScore = false }: { game: GameSummary; hideScore?: boolean }) {
  const final = game.status === "final" && game.home.score !== null && game.away.score !== null;
  const awayLost = final && !hideScore && (game.away.score ?? 0) < (game.home.score ?? 0);
  const homeLost = final && !hideScore && (game.home.score ?? 0) < (game.away.score ?? 0);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
      <TeamBlock team={game.away} side="away" score={hideScore ? undefined : game.away.score} faded={awayLost} />
      <div className="flex flex-col items-center gap-1 px-1 text-center">
        {hideScore ? (
          <span className="np-blackletter text-2xl leading-none sm:text-3xl">vs</span>
        ) : (
          <>
            <span className="np-numeral bg-[var(--np-ink,#1d2230)] px-2 py-0.5 text-xs font-bold uppercase tracking-[2px] text-[#f5ecd6] sm:text-sm">
              {STATUS_EN[game.status]}
            </span>
            <span className="text-[10px] font-bold text-muted">{GAME_STATUS_LABEL[game.status]}</span>
          </>
        )}
      </div>
      <TeamBlock team={game.home} side="home" score={hideScore ? undefined : game.home.score} faded={homeLost} />
    </div>
  );
}
