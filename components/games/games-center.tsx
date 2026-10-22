"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { GameSummary, GamesResponse } from "@/lib/games/types";
import { NotReadyNotice, SpoilerGate, StatusBadge, TipoffTime } from "./game-parts";
import { ScoreTable } from "./score-table";
import { InlineBoxScore } from "./inline-box-score";
import { formatJstDateLabel, gamesDateHref } from "@/lib/games/date";
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
// gameCount が 0 の日(カレンダーで試合がない日)は、結果を隠す必要がないため、ボタンを出さずに「試合なし」と表示する。
export function GamesCenter({
  date,
  dayLabel,
  today,
  gameCount,
  adjacent,
}: {
  date: string;
  dayLabel: string;
  today: string;
  gameCount: number | null;
  adjacent: { prev: string | null; next: string | null };
}) {
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

  if (gameCount === 0) return <NoGamesNotice date={date} today={today} adjacent={adjacent} />;

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
  if (result.games.length === 0) return <NoGamesNotice date={date} today={today} adjacent={adjacent} />;

  // その日の全試合。各試合のボックススコアは、カードの下の「ボックススコアを表示」でその場で開ける
  return (
    <ul className="grid grid-cols-1 gap-3">
      {result.games.map((game) => (
        <li key={game.id} className="min-w-0 border border-line bg-surface">
          <Link href={`/games/${game.id}`} onClick={() => markGameRevealed(game.id)} className="block p-4 transition-colors hover:bg-background/60">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <StatusBadge game={game} />
              <TipoffTime game={game} />
            </div>
            <ScoreTable game={game} />
            <p className="mt-3 text-right text-xs font-extrabold text-blue">試合詳細 →</p>
          </Link>
          {game.hasBoxScore ? (
            <InlineBoxScore gameId={game.id} />
          ) : (
            <p className="border-t border-line px-4 py-3 text-xs text-muted">
              {game.status === "scheduled" ? "試合前です。ボックススコアは試合後に登録します。" : "ボックススコアは準備中です。"}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

// 試合がない日の表示。未来の日付は「予定未登録」、過去の日付は「試合なし」とし、前後の試合のある日へ案内する。
function NoGamesNotice({ date, today, adjacent }: { date: string; today: string; adjacent: { prev: string | null; next: string | null } }) {
  const future = date > today;
  return (
    <div className="border border-line bg-surface px-5 py-8 text-center">
      <p className="text-base font-bold">{future ? "この日の試合予定はまだ登録されていません" : "この日の試合はありません"}</p>
      <p className="mt-2 text-xs leading-6 text-muted">
        {future ? "日程が登録されると、ここに試合が表示されます。" : "カレンダーの試合数が表示されている日付を選ぶと、その日の試合を見られます。"}
      </p>
      {(adjacent.prev || adjacent.next) && (
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm font-extrabold">
          {adjacent.prev && (
            <Link href={gamesDateHref(adjacent.prev, today)} className="border border-line px-4 py-2 text-blue hover:border-blue">
              ← 直前の試合日（{formatJstDateLabel(adjacent.prev)}）
            </Link>
          )}
          {adjacent.next && (
            <Link href={gamesDateHref(adjacent.next, today)} className="border border-line px-4 py-2 text-blue hover:border-blue">
              次の試合日（{formatJstDateLabel(adjacent.next)}）→
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
