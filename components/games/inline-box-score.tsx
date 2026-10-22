"use client";

import { useState } from "react";
import type { GameDetail, GameDetailResponse } from "@/lib/games/types";
import { GameBoxScores } from "./game-box-scores";
import { getCached, markGameRevealed, setCached } from "./reveal-store";

type State = { kind: "loading" } | { kind: "ready"; detail: GameDetail } | { kind: "error"; message: string };

// 試合センターの一覧で、その試合のボックススコアをその場で開く。
// 一覧の結果を表示したあとにだけ出す(ネタバレ防止)。押したときに /api/games/[gameId] から取得する。
export function InlineBoxScore({ gameId }: { gameId: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State | null>(() => {
    const cached = getCached<{ kind: "ready"; detail: GameDetail }>(`detail:${gameId}`);
    return cached ? { kind: "ready", detail: cached.detail } : null;
  });

  async function load() {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/games/${encodeURIComponent(gameId)}`, { cache: "no-store" });
      const body = (await res.json()) as GameDetailResponse | { error: string };
      if ("error" in body) return setState({ kind: "error", message: body.error });
      if (body.status !== "ok") return setState({ kind: "error", message: "ボックススコアが見つかりませんでした" });
      setCached(`detail:${gameId}`, { kind: "ready", detail: body.detail });
      setState({ kind: "ready", detail: body.detail });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  function toggle() {
    markGameRevealed(gameId);
    const next = !open;
    setOpen(next);
    if (next && (!state || state.kind === "error")) void load();
  }

  return (
    <div className="border-t border-line">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-extrabold text-blue hover:bg-background/60"
      >
        <span>{open ? "ボックススコアを閉じる" : "ボックススコアを表示"}</span>
        <span aria-hidden>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="min-w-0 px-4 pb-4">
          {!state || state.kind === "loading" ? (
            <p className="py-4 text-center text-sm text-muted">読み込み中…</p>
          ) : state.kind === "error" ? (
            <p className="py-3 text-sm text-red-600 dark:text-red-400">ボックススコアの取得に失敗しました：{state.message}</p>
          ) : (
            <GameBoxScores detail={state.detail} />
          )}
        </div>
      )}
    </div>
  );
}
