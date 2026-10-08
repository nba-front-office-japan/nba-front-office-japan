"use client";

import { useEffect, useState } from "react";
import type { GameDetail, GameDetailResponse } from "@/lib/games/types";
import { BoxScoreTable } from "./box-score-table";
import { PreseasonBoxScoreTable } from "./preseason-box-score-table";
import { NotReadyNotice, SpoilerGate, StatusBadge, TipoffTime } from "./game-parts";
import { isGameRevealed } from "./reveal-store";
import { ScoreTable } from "./score-table";

type State =
  | { kind: "hidden" }
  | { kind: "loading" }
  | { kind: "ready"; detail: GameDetail }
  | { kind: "not_ready" }
  | { kind: "not_found" }
  | { kind: "error"; message: string };

async function fetchDetail(gameId: string): Promise<State> {
  try {
    const res = await fetch(`/api/games/${encodeURIComponent(gameId)}`, { cache: "no-store" });
    const body = (await res.json()) as GameDetailResponse | { error: string };
    if ("error" in body) return { kind: "error", message: body.error };
    if (body.status === "ok") return { kind: "ready", detail: body.detail };
    return { kind: body.status };
  } catch (err) {
    return { kind: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

// 試合の詳細(スコアと両チームのボックススコア)。
// 一覧で結果を表示してからカードを押した場合だけ、そのまま表示する。
// 詳細ページを直接開いた場合は結果を隠し、「結果を表示する」を押したときだけ取得する。
export function GameDetailView({ gameId }: { gameId: string }) {
  const [state, setState] = useState<State>({ kind: "hidden" });

  async function load() {
    setState({ kind: "loading" });
    setState(await fetchDetail(gameId));
  }

  useEffect(() => {
    // 一覧で結果を表示してから来た試合だけ自動で表示する(sessionStorageはブラウザでしか読めないため、表示後に判定する)
    if (!isGameRevealed(gameId)) return;
    let cancelled = false;
    void fetchDetail(gameId).then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  if (state.kind === "hidden" || state.kind === "loading") {
    return <SpoilerGate message="この試合の結果は非表示です" onReveal={load} loading={state.kind === "loading"} />;
  }
  if (state.kind === "not_ready") return <NotReadyNotice />;
  if (state.kind === "not_found") {
    return <p className="border border-line bg-surface px-5 py-6 text-sm text-muted">試合が見つかりませんでした。</p>;
  }
  if (state.kind === "error") {
    return (
      <p className="border border-line bg-surface px-5 py-6 text-sm text-red-600 dark:text-red-400">
        試合データの取得に失敗しました：{state.message}
      </p>
    );
  }

  const { game, homePlayers, awayPlayers, preseason } = state.detail;
  return (
    <div className="space-y-5">
      <section className="border border-line bg-surface p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <StatusBadge game={game} />
          <TipoffTime game={game} />
        </div>
        <ScoreTable game={game} />
      </section>
      {preseason ? (
        // プレシーズン(Excelから取り込み)。選手名は出典の表記のまま、選手ページへのリンクなし
        <>
          <PreseasonBoxScoreTable side="アウェー" team={game.away} rows={preseason.away} totals={preseason.awayTotals} />
          <PreseasonBoxScoreTable side="ホーム" team={game.home} rows={preseason.home} totals={preseason.homeTotals} />
          <p className="text-xs leading-6 text-muted">プレシーズンの選手名は出典の表記のまま表示しています（選手ページへのリンクはありません）。</p>
        </>
      ) : homePlayers.length === 0 && awayPlayers.length === 0 ? (
        <p className="border border-line bg-surface px-5 py-6 text-center text-sm text-muted">ボックススコアは準備中です。</p>
      ) : (
        <>
          <BoxScoreTable side="アウェー" team={game.away} rows={awayPlayers} />
          <BoxScoreTable side="ホーム" team={game.home} rows={homePlayers} />
        </>
      )}
    </div>
  );
}
