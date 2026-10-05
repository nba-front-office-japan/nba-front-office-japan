import Link from "next/link";
import type { ReactNode } from "react";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { BOX_SCORE_HEADER } from "@/lib/games/box-score-csv";
import { MAX_SYNC_DAYS, defaultSyncDates } from "@/lib/games/balldontlie-sync";
import { formatJstTime, isValidDateString } from "@/lib/games/date";
import { GAME_STATUS_LABEL } from "@/lib/games/types";
import { GHOST_BUTTON_CLASS, LINK_CLASS } from "@/app/admin/_components/action-ui";
import { SyncForm } from "./sync-form";

// 管理画面は常に最新の登録状況を見せるため、毎回サーバーで取得する。
export const dynamic = "force-dynamic";

const RECENT_LIMIT = 30;

type RecentGame = {
  id: string;
  game_date: string;
  tipoff_at: string | null;
  status: keyof typeof GAME_STATUS_LABEL;
  home: string;
  away: string;
  home_score: number | null;
  away_score: number | null;
  awayCount: number;
  homeCount: number;
};

// date(米国の試合日)を指定した場合はその日の試合、指定がなければ最近の試合
async function fetchRecentGames(date: string | null): Promise<{ ready: boolean; games: RecentGame[]; error?: string }> {
  const supabase = createAdminSupabaseClient();
  const base = supabase.from("games").select("id, game_date, tipoff_at, status, home_team_id, away_team_id, home_score, away_score");
  const { data, error } = await (date
    ? base.eq("game_date", date).order("tipoff_at", { ascending: true })
    : base.lte("tipoff_at", new Date(Date.now() + 2 * 86400_000).toISOString()).order("tipoff_at", { ascending: false })
  ).limit(RECENT_LIMIT);
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return { ready: false, games: [] };
    return { ready: true, games: [], error: error.message };
  }

  const games = data ?? [];
  const ids = games.map((g) => g.id);
  const [{ data: teams }, { data: stats }] = await Promise.all([
    supabase.from("teams").select("id, abbreviation"),
    ids.length > 0 ? supabase.from("game_player_stats").select("game_id, team_id").in("game_id", ids) : Promise.resolve({ data: [] as { game_id: string; team_id: string }[] }),
  ]);
  const abbr = new Map((teams ?? []).map((t) => [t.id, t.abbreviation]));
  const counts = new Map<string, number>();
  for (const s of stats ?? []) counts.set(`${s.game_id}|${s.team_id}`, (counts.get(`${s.game_id}|${s.team_id}`) ?? 0) + 1);

  return {
    ready: true,
    games: games.map((g) => ({
      id: g.id,
      game_date: g.game_date,
      tipoff_at: g.tipoff_at,
      status: g.status,
      home: abbr.get(g.home_team_id) ?? "—",
      away: abbr.get(g.away_team_id) ?? "—",
      home_score: g.home_score,
      away_score: g.away_score,
      awayCount: counts.get(`${g.id}|${g.away_team_id}`) ?? 0,
      homeCount: counts.get(`${g.id}|${g.home_team_id}`) ?? 0,
    })),
  };
}

function TeamCount({ label, count }: { label: string; count: number }) {
  return (
    <span className="block">
      <span className="inline-block w-10 font-bold">{label}</span>
      {count > 0 ? <span className="text-[#218c68]">登録済み（{count}人）</span> : <span className="font-bold text-[#cf4a51]">未登録</span>}
    </span>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-line bg-surface p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      <div className="space-y-4 text-sm leading-7">{children}</div>
    </section>
  );
}

export default async function AdminGamesPage({ searchParams }: PageProps<"/admin/games">) {
  const { date: dateParam } = await searchParams;
  const date = typeof dateParam === "string" && isValidDateString(dateParam) ? dateParam : null;
  const recent = await fetchRecentGames(date);
  const syncDates = defaultSyncDates();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-8">
      <div>
        <h1 className="text-2xl font-bold">試合データ</h1>
        <p className="mt-1 text-sm text-muted">
          試合日程・クオータースコアは balldontlie（無料プラン）から取り込み、選手別のボックススコアはCSVで登録します。
        </p>
      </div>

      {!recent.ready && (
        <p role="alert" className="border-l-4 border-[#cf4a51] bg-surface px-4 py-3 text-sm font-semibold text-[#a3383d] dark:text-[#ff8a7a]">
          試合データのテーブル（games / game_player_stats）がまだありません。<code className="break-all">supabase/migrations/20261003000000_games.sql</code> を Supabase で実行してから使ってください。
        </p>
      )}

      <Card title="1. 試合日程・スコアの取り込み（balldontlie）">
        <p>
          指定した期間（米国の日付）の試合日程、試合状態、クオーター別の得点を取り込み、同じ試合は最新の内容で上書きします。
          ボックススコアのCSVを取り込む前に、その試合がここで取り込まれている必要があります。
        </p>
        <SyncForm defaultFrom={syncDates[0]} defaultTo={syncDates[syncDates.length - 1]} maxDays={MAX_SYNC_DAYS} />
      </Card>

      <Card title="2. 試合ボックススコアの登録（CSV・1試合1チームごと）">
        <ol className="list-decimal space-y-1 pl-5">
          <li>下の「3. 試合一覧」から対象の試合の「登録・確認」を開きます。</li>
          <li>ホーム／アウェーのどちらのチームの成績を入れるか選び、CSV雛形をダウンロードして選手別の成績を記入します。</li>
          <li>CSVを選ぶと、登録前に選手と主要な数値のプレビュー、エラー・注意が表示されます。</li>
          <li>「このチームの成績を登録」を押したときだけ保存されます。同じチームを登録し直すと、そのチームの分だけが置き換わります。</li>
        </ol>
        <p className="text-xs text-muted">
          試合日・ホーム／アウェー・クオータースコア・最終スコアは試合管理（1. で取り込んだデータ）を使うため、CSVには選手別の成績だけを入れます。CSVの列：
          <code className="ml-1 break-all font-mono">{BOX_SCORE_HEADER}</code>
        </p>
      </Card>

      <Card title="3. 試合一覧とボックススコアの登録状況">
        <form method="get" action="/admin/games" className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-bold text-muted">試合日（米国）で探す</span>
            <input type="date" name="date" defaultValue={date ?? ""} required className="border border-line bg-surface px-2 py-1.5" />
          </label>
          <button type="submit" className={GHOST_BUTTON_CLASS}>
            表示
          </button>
          {date && (
            <Link href="/admin/games" className={LINK_CLASS}>
              最近の試合に戻す
            </Link>
          )}
        </form>
        <p className="text-xs text-muted">
          {date ? `米国の試合日 ${date} の試合です。` : `開始日時が新しい順に${RECENT_LIMIT}試合を表示しています。それより前の試合は日付で探してください。`}
          ボックススコアは、各試合の「登録・確認」から1チームずつ登録します。
        </p>
        {recent.error && <p className="text-[#cf4a51]">取得に失敗しました: {recent.error}</p>}
        {recent.ready && recent.games.length === 0 && !recent.error && (
          <p className="text-muted">{date ? "この日の試合は取り込まれていません。" : "取り込まれた試合はまだありません。"}</p>
        )}
        {recent.games.length > 0 && (
          <>
            <p className="text-xs text-muted sm:hidden">→ 表は横にスクロールできます</p>
            <div className="overflow-x-auto border border-line">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th className="px-3 py-2">試合日（米国）</th>
                    <th className="px-3 py-2">開始（日本時間）</th>
                    <th className="px-3 py-2">対戦（アウェー @ ホーム）</th>
                    <th className="px-3 py-2">状態</th>
                    <th className="px-3 py-2 text-right">スコア</th>
                    <th className="px-3 py-2">ボックススコア</th>
                    <th className="px-3 py-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.games.map((g) => (
                    <tr key={g.id} className="border-b border-line last:border-b-0">
                      <td className="px-3 py-2 tabular-nums">{g.game_date}</td>
                      <td className="px-3 py-2 tabular-nums">{g.tipoff_at ? formatJstTime(g.tipoff_at) : "未定"}</td>
                      <td className="px-3 py-2 font-bold">
                        <Link href={`/admin/games/${g.id}`} className="hover:underline">
                          {g.away} @ {g.home}
                        </Link>
                      </td>
                      <td className="px-3 py-2">{GAME_STATUS_LABEL[g.status]}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{g.away_score !== null && g.home_score !== null ? `${g.away_score}-${g.home_score}` : "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">
                        <TeamCount label={g.away} count={g.awayCount} />
                        <TeamCount label={g.home} count={g.homeCount} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link href={`/admin/games/${g.id}`} className={`${LINK_CLASS} whitespace-nowrap`}>
                          登録・確認 →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}
