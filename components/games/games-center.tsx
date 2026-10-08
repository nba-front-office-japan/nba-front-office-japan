"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { GameSummary, GamesResponse } from "@/lib/games/types";
import { NotReadyNotice, SpoilerGate, StatusBadge, TipoffTime } from "./game-parts";
import { ScoreTable } from "./score-table";
import { getCached, isDateRevealed, markDateRevealed, markGameRevealed, setCached, subscribeNoop, unknownOnServer } from "./reveal-store";

type Result = { kind: "ready"; games: GameSummary[] } | { kind: "not_ready" } | { kind: "error"; message: string };

async function fetchGames(date: string): Promise<Result> {
  try {
    const res = await fetch(`/api/games?date=${encodeURIComponent(date)}`, { cache: "no-store" });
    const body = (await res.json()) as GamesResponse | { error: string };
    if (!res.ok || "error" in body) return { kind: "error", message: "error" in body ? body.error : `HTTP ${res.status}` };
    return body.status === "ok" ? { kind: "ready", games: body.games } : { kind: "not_ready" };
  } catch (err) {
    return { kind: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

function LoadingNotice() {
  return <p className="border border-line bg-surface px-5 py-10 text-center text-sm text-muted">読み込み中…</p>;
}

// 試合一覧。開いた直後は結果を一切表示せず(HTMLにも含めない)、
// 「結果を表示する」を押したときだけ /api/games から取得して表示する。
// 押した日付はこのタブの中で記録し(reveal-store.ts)、詳細から戻ったときなどは結果を表示したままにする。
// 別の日付や、初めて開く人には非表示のまま。日付を切り替えると、このコンポーネントは作り直される(key=日付)。
export function GamesCenter({ date, dayLabel }: { date: string; dayLabel: string }) {
  // このタブで結果を表示済みの日付か(サーバー側・最初の描画では分からないため null)
  const revealedBefore = useSyncExternalStore(subscribeNoop, () => isDateRevealed(date), unknownOnServer);
  const [clicked, setClicked] = useState(false);
  // 一度取得した結果は、このタブのページ間移動の間だけ保持する(戻ったときにすぐ表示する)
  const [result, setResult] = useState<Result | null>(() => getCached<Result>(`list:${date}`) ?? null);
  const show = clicked || revealedBefore === true;

  useEffect(() => {
    if (!show || result) return;
    let cancelled = false;
    void fetchGames(date).then((next) => {
      if (cancelled) return;
      if (next.kind !== "error") setCached(`list:${date}`, next);
      setResult(next);
    });
    return () => {
      cancelled = true;
    };
  }, [show, result, date]);

  function reveal() {
    markDateRevealed(date);
    setClicked(true);
  }

  if (!show) {
    // まだ判定できない間(ページを開いた直後の一瞬)は、非表示画面も結果も出さない
    if (revealedBefore === null) return <LoadingNotice />;
    return <SpoilerGate message={`${dayLabel}の試合結果は非表示です`} onReveal={reveal} loading={false} />;
  }
  if (!result) {
    return clicked ? <SpoilerGate message={`${dayLabel}の試合結果は非表示です`} onReveal={reveal} loading /> : <LoadingNotice />;
  }
  if (result.kind === "not_ready") return <NotReadyNotice />;
  if (result.kind === "error") {
    return (
      <p className="border border-line bg-surface px-5 py-6 text-sm text-red-600 dark:text-red-400">
        試合データの取得に失敗しました：{result.message}
      </p>
    );
  }
  if (result.games.length === 0) {
    return <p className="border border-line bg-surface px-5 py-8 text-center text-sm text-muted">この日の試合はありません。</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {result.games.map((game) => (
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
