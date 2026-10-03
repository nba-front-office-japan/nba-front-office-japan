"use client";

import { useState } from "react";
import Link from "next/link";
import type { GameSummary, GamesResponse } from "@/lib/games/types";
import { NotReadyNotice, SpoilerGate, StatusBadge, TipoffTime } from "./game-parts";
import { ScoreTable } from "./score-table";
import { markGameRevealed } from "./reveal-store";

type State =
  | { kind: "hidden" }
  | { kind: "loading" }
  | { kind: "ready"; games: GameSummary[] }
  | { kind: "not_ready" }
  | { kind: "error"; message: string };

// 試合一覧。開いた直後は結果を一切表示せず(HTMLにも含めない)、
// 「結果を表示する」を押したときだけ /api/games から取得して表示する。
// 日付を切り替えると、このコンポーネントは作り直され(key=日付)、再び非表示に戻る。
export function GamesCenter({ date, dayLabel }: { date: string; dayLabel: string }) {
  const [state, setState] = useState<State>({ kind: "hidden" });

  async function reveal() {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/games?date=${encodeURIComponent(date)}`, { cache: "no-store" });
      const body = (await res.json()) as GamesResponse | { error: string };
      if (!res.ok || "error" in body) {
        setState({ kind: "error", message: "error" in body ? body.error : `HTTP ${res.status}` });
        return;
      }
      setState(body.status === "ok" ? { kind: "ready", games: body.games } : { kind: "not_ready" });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  if (state.kind === "hidden" || state.kind === "loading") {
    return <SpoilerGate message={`${dayLabel}の試合結果は非表示です`} onReveal={reveal} loading={state.kind === "loading"} />;
  }
  if (state.kind === "not_ready") return <NotReadyNotice />;
  if (state.kind === "error") {
    return (
      <p className="border border-line bg-surface px-5 py-6 text-sm text-red-600 dark:text-red-400">
        試合データの取得に失敗しました：{state.message}
      </p>
    );
  }
  if (state.games.length === 0) {
    return <p className="border border-line bg-surface px-5 py-8 text-center text-sm text-muted">この日の試合はありません。</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {state.games.map((game) => (
        <li key={game.id}>
          <Link
            href={`/games/${game.id}`}
            onClick={() => markGameRevealed(game.id)}
            className="block border border-line bg-surface p-4 transition-colors hover:border-blue"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <StatusBadge game={game} />
              <TipoffTime game={game} />
            </div>
            <ScoreTable game={game} />
            <p className="mt-3 text-right text-xs font-extrabold text-blue">詳細・ボックススコア →</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
