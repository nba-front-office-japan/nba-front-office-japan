import type { ReactNode } from "react";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { BOX_SCORE_COLUMNS, BOX_SCORE_HEADER, MAX_CSV_BYTES, MAX_CSV_ROWS } from "@/lib/games/box-score-csv";
import { MAX_SYNC_DAYS, defaultSyncDates } from "@/lib/games/balldontlie-sync";
import { formatJstTime } from "@/lib/games/date";
import { GAME_STATUS_LABEL } from "@/lib/games/types";
import { LINK_CLASS } from "@/app/admin/_components/action-ui";
import { BoxScoreImportForm } from "./box-score-import-form";
import { SyncForm } from "./sync-form";

// 管理画面は常に最新の登録状況を見せるため、毎回サーバーで取得する。
export const dynamic = "force-dynamic";

const RECENT_LIMIT = 30;

// 記入例(架空の選手名。実際の試合データではない)
const EXAMPLE_ROWS = [
  ["2026-10-21", "NYK", "BOS", "BOS", "Example Player A", "34:12", "27", "8", "5", "1", "0", "9", "19", "4", "10", "5", "6", "-3"],
  ["2026-10-21", "NYK", "BOS", "BOS", "Example Player B", "0:00", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", ""],
  ["2026-10-21", "NYK", "BOS", "NYK", "Example Player C", "36:40", "31", "4", "9", "2", "1", "11", "22", "3", "7", "6", "7", "+5"],
];

type RecentGame = {
  id: string;
  game_date: string;
  tipoff_at: string | null;
  status: keyof typeof GAME_STATUS_LABEL;
  home: string;
  away: string;
  home_score: number | null;
  away_score: number | null;
  statCount: number;
};

async function fetchRecentGames(): Promise<{ ready: boolean; games: RecentGame[]; error?: string }> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("games")
    .select("id, game_date, tipoff_at, status, home_team_id, away_team_id, home_score, away_score")
    .lte("tipoff_at", new Date(Date.now() + 2 * 86400_000).toISOString())
    .order("tipoff_at", { ascending: false })
    .limit(RECENT_LIMIT);
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return { ready: false, games: [] };
    return { ready: true, games: [], error: error.message };
  }

  const games = data ?? [];
  const ids = games.map((g) => g.id);
  const [{ data: teams }, { data: stats }] = await Promise.all([
    supabase.from("teams").select("id, abbreviation"),
    ids.length > 0 ? supabase.from("game_player_stats").select("game_id").in("game_id", ids) : Promise.resolve({ data: [] as { game_id: string }[] }),
  ]);
  const abbr = new Map((teams ?? []).map((t) => [t.id, t.abbreviation]));
  const counts = new Map<string, number>();
  for (const s of stats ?? []) counts.set(s.game_id, (counts.get(s.game_id) ?? 0) + 1);

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
      statCount: counts.get(g.id) ?? 0,
    })),
  };
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-line bg-surface p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      <div className="space-y-4 text-sm leading-7">{children}</div>
    </section>
  );
}

export default async function AdminGamesPage() {
  const recent = await fetchRecentGames();
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

      <Card title="2. 試合ボックススコアCSV取込">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            <a href="/admin/games/box-score-template" className={LINK_CLASS}>
              CSVテンプレート（box-score-template.csv）
            </a>
            をダウンロードし、1行に1選手ずつ記入します。複数の試合を1つのCSVにまとめても構いません。
          </li>
          <li>「CSV UTF-8（コンマ区切り）」形式で保存します（通常の「CSV」形式だと文字化けします）。</li>
          <li>下のフォームで「① 検査する」を押し、エラーがないことを確認してから「② この内容で取り込む」を押します。</li>
          <li>同じ試合のCSVをもう一度取り込むと、その試合の選手スタッツはCSVの内容にすべて置き換わります（一部の選手だけの追記はできません）。</li>
        </ol>

        <div>
          <h3 className="mb-2 font-bold">列の意味（1行目の列名はこのとおりに書きます）</h3>
          <p className="mb-2 break-all rounded-sm bg-[#f3f6fb] px-3 py-2 font-mono text-xs dark:bg-white/[.06]">{BOX_SCORE_HEADER}</p>
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-3 py-2">列名</th>
                  <th className="px-3 py-2">項目</th>
                  <th className="px-3 py-2">必須</th>
                  <th className="px-3 py-2">説明</th>
                </tr>
              </thead>
              <tbody>
                {BOX_SCORE_COLUMNS.map((c) => (
                  <tr key={c.key} className="border-b border-line align-top last:border-b-0">
                    <td className="px-3 py-2 font-mono text-xs font-bold">{c.key}</td>
                    <td className="whitespace-nowrap px-3 py-2">{c.label}</td>
                    <td className="px-3 py-2">{c.required ? "必須" : "空欄可"}</td>
                    <td className="px-3 py-2">{c.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-bold">記入例（架空の選手名です）</h3>
          <pre className="overflow-x-auto bg-[#f3f6fb] px-3 py-2 text-xs leading-6 dark:bg-white/[.06]">
            {[BOX_SCORE_HEADER, ...EXAMPLE_ROWS.map((r) => r.join(","))].join("\n")}
          </pre>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
            <li>試合日（game_date）は米国の日付です。日本時間の日付ではありません。</li>
            <li>チームは当サイトの略称（例: BOS, NYK, GSW, LAL, PHX, NOP, BKN, UTA）で記入します。</li>
            <li>FG（fgm・fga）は3Pを含む数です。出場しなかった選手は、出場時間を 0:00、各スタッツを 0 にするか、行を省きます。</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-2 font-bold">取込時の検査</h3>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
            <li>エラー（取り込めません）：必須の列・項目の空欄、数値の形式、成功数と試投数の関係、出場時間の形式、存在しないチーム略称、所属チームが対戦チームと合わない、試合が見つからない、同じ試合での選手の重複、文字化け。</li>
            <li>注意（取り込めます）：当サイトの選手データと照合できない選手、得点がFG・3P・FTの計算と合わない、選手の得点合計が試合のスコアと合わない、試合終了になっていない、登録済みのデータを置き換える。</li>
            <li>
              1回の取込は {MAX_CSV_ROWS}行・{Math.round(MAX_CSV_BYTES / 1000)}KB までです。取り込む直前にもう一度すべて検査し、エラーがあれば何も書き込みません。
            </li>
          </ul>
        </div>

        <BoxScoreImportForm />
      </Card>

      <Card title="3. 最近の試合とボックススコアの登録状況">
        {recent.error && <p className="text-[#cf4a51]">取得に失敗しました: {recent.error}</p>}
        {recent.ready && recent.games.length === 0 && !recent.error && <p className="text-muted">取り込まれた試合はまだありません。</p>}
        {recent.games.length > 0 && (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[620px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-3 py-2">試合日（米国）</th>
                  <th className="px-3 py-2">開始（日本時間）</th>
                  <th className="px-3 py-2">対戦（アウェー @ ホーム）</th>
                  <th className="px-3 py-2">状態</th>
                  <th className="px-3 py-2 text-right">スコア</th>
                  <th className="px-3 py-2 text-right">ボックススコア</th>
                </tr>
              </thead>
              <tbody>
                {recent.games.map((g) => (
                  <tr key={g.id} className="border-b border-line last:border-b-0">
                    <td className="px-3 py-2 tabular-nums">{g.game_date}</td>
                    <td className="px-3 py-2 tabular-nums">{g.tipoff_at ? formatJstTime(g.tipoff_at) : "未定"}</td>
                    <td className="px-3 py-2 font-bold">
                      {g.away} @ {g.home}
                    </td>
                    <td className="px-3 py-2">{GAME_STATUS_LABEL[g.status]}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{g.away_score !== null && g.home_score !== null ? `${g.away_score}-${g.home_score}` : "—"}</td>
                    <td className={`px-3 py-2 text-right ${g.statCount > 0 ? "" : "font-bold text-[#cf4a51]"}`}>{g.statCount > 0 ? `登録済み（${g.statCount}人）` : "未登録"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
