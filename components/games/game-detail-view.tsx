"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { GameDetail, GameDetailResponse } from "@/lib/games/types";
import { BoxScoreTable } from "./box-score-table";
import { PreseasonBoxScoreTable } from "./preseason-box-score-table";
import { NotReadyNotice, SpoilerGate, StatusBadge, TipoffTime } from "./game-parts";
import { getCached, isGameRevealed, markGameRevealed, setCached, subscribeNoop, unknownOnServer } from "./reveal-store";
import { ScoreTable } from "./score-table";

type State =
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
// 一覧で結果を表示してからカードを押した試合は、非表示画面を挟まずにそのまま表示する。
// 詳細ページを直接開いた場合(共有されたリンクなど)は結果を隠し、「結果を表示する」を押したときだけ取得する。
export function GameDetailView({ gameId }: { gameId: string }) {
  // このタブで結果を表示済みの試合か(サーバー側・最初の描画では分からないため null)
  const revealedBefore = useSyncExternalStore(subscribeNoop, () => isGameRevealed(gameId), unknownOnServer);
  const [clicked, setClicked] = useState(false);
  // 一度取得した結果は、このタブのページ間移動の間だけ保持する
  const [loaded, setLoaded] = useState<State | null>(() => getCached<State>(`detail:${gameId}`) ?? null);
  const show = clicked || revealedBefore === true;

  useEffect(() => {
    if (!show || loaded) return;
    let cancelled = false;
    void fetchDetail(gameId).then((next) => {
      if (cancelled) return;
      if (next.kind === "ready") setCached(`detail:${gameId}`, next);
      setLoaded(next);
    });
    return () => {
      cancelled = true;
    };
  }, [show, loaded, gameId]);

  function reveal() {
    markGameRevealed(gameId);
    setClicked(true);
  }

  if (!show) {
    // まだ判定できない間(ページを開いた直後の一瞬)は、非表示画面も結果も出さない
    if (revealedBefore === null) return <p className="border border-line bg-surface px-5 py-10 text-center text-sm text-muted">読み込み中…</p>;
    return <SpoilerGate message="この試合の結果は非表示です" onReveal={reveal} loading={false} />;
  }
  if (!loaded) {
    return clicked ? (
      <SpoilerGate message="この試合の結果は非表示です" onReveal={reveal} loading />
    ) : (
      <p className="border border-line bg-surface px-5 py-10 text-center text-sm text-muted">読み込み中…</p>
    );
  }
  const state = loaded;
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
