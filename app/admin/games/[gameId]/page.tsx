import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchGameDetail } from "@/lib/games/data";
import { formatJstTime } from "@/lib/games/date";
import { GAME_STATUS_LABEL } from "@/lib/games/types";
import { BOX_SCORE_COLUMNS, BOX_SCORE_EXAMPLE_ROWS, BOX_SCORE_HEADER, MAX_CSV_ROWS } from "@/lib/games/box-score-csv";
import { SIDE_LABEL, isTeamSide, type TeamSide } from "@/lib/games/box-score-import";
import { ScoreTable } from "@/components/games/score-table";
import { BoxScoreTable } from "@/components/games/box-score-table";
import { LINK_CLASS } from "@/app/admin/_components/action-ui";
import { TeamBoxScoreForm } from "./team-box-score-form";

// 管理画面は常に最新の登録状況を見せるため、毎回サーバーで取得する。
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 1試合のボックススコア登録(1チームずつ)。試合日・ホーム／アウェー・スコアは試合管理(games)の情報を使う。
export default async function AdminGameBoxScorePage({ params, searchParams }: PageProps<"/admin/games/[gameId]">) {
  const { gameId } = await params;
  const { side: sideParam } = await searchParams;
  if (!UUID_RE.test(gameId)) notFound();

  const supabase = createAdminSupabaseClient();
  const [result, { data: dateRow }] = await Promise.all([
    fetchGameDetail(supabase, gameId),
    // 試合日(米国の日付)は GameSummary に含まれないため別に取得する
    supabase.from("games").select("game_date").eq("id", gameId).maybeSingle(),
  ]);
  if (result.status !== "ok") notFound();
  const gameDate = dateRow?.game_date ?? null;
  const { game, homePlayers, awayPlayers } = result.detail;

  const counts: Record<TeamSide, number> = { away: awayPlayers.length, home: homePlayers.length };
  // 指定がなければ、未登録のチーム(アウェー優先)を選ぶ
  const side: TeamSide = isTeamSide(sideParam) ? sideParam : counts.away > 0 && counts.home === 0 ? "home" : "away";
  const team = side === "home" ? game.home : game.away;
  const registered = side === "home" ? homePlayers : awayPlayers;
  const templateHref = `/admin/games/box-score-template?game=${game.id}&side=${side}`;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-8">
      <nav aria-label="パンくずリスト" className="text-xs text-muted">
        <Link href="/admin/games" className={LINK_CLASS}>
          試合データ
        </Link>
        <span aria-hidden className="mx-1.5">
          ›
        </span>
        <span aria-current="page">ボックススコア登録</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold">
          {game.away.abbreviation} @ {game.home.abbreviation} のボックススコア登録
        </h1>
        <p className="mt-1 text-sm text-muted">選手別のボックススコアを、1チームずつCSVで登録します。試合日・スコアは下の試合情報を使います。</p>
      </div>

      <section className="border border-line bg-surface p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-bold">試合情報（試合管理のデータ）</h2>
        <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-[11px] font-bold text-muted">試合日（米国）</dt>
            <dd className="font-semibold tabular-nums">{gameDate ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold text-muted">開始（日本時間）</dt>
            <dd className="font-semibold tabular-nums">{game.tipoffAt ? formatJstTime(game.tipoffAt) : "未定"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold text-muted">状態</dt>
            <dd className={`font-semibold ${game.status === "final" ? "" : "text-[#b0392f]"}`}>{GAME_STATUS_LABEL[game.status]}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold text-muted">公開ページ</dt>
            <dd>
              <a href={`/games/${game.id}`} target="_blank" rel="noreferrer" className={LINK_CLASS}>
                試合詳細を開く ↗
              </a>
            </dd>
          </div>
        </dl>
        <ScoreTable game={game} />
      </section>

      <section className="border border-line bg-surface p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-bold">登録するチーム</h2>
        <div role="tablist" aria-label="登録するチーム" className="grid grid-cols-2 gap-2">
          {(["away", "home"] as const).map((s) => {
            const line = s === "home" ? game.home : game.away;
            const active = s === side;
            return (
              <Link
                key={s}
                role="tab"
                aria-selected={active}
                href={`/admin/games/${game.id}?side=${s}`}
                scroll={false}
                className={`block border-2 px-3 py-2.5 text-sm transition-colors ${
                  active ? "border-blue bg-[#eef4ff] dark:bg-white/[.08]" : "border-line hover:border-blue/50"
                }`}
              >
                <span className="block text-[11px] font-bold text-muted">{SIDE_LABEL[s]}</span>
                <span className="block font-extrabold">{line.abbreviation}</span>
                <span className="block truncate text-xs text-muted">{line.name}</span>
                <span className={`mt-1 block text-xs font-bold ${counts[s] > 0 ? "text-[#218c68]" : "text-[#b0392f]"}`}>
                  {counts[s] > 0 ? `登録済み（${counts[s]}人）` : "未登録"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border border-line bg-surface p-5 sm:p-6">
        <h2 className="mb-1 text-lg font-bold">
          {SIDE_LABEL[side]}・{team.abbreviation} の成績をCSVで登録
        </h2>
        <p className="mb-4 text-sm text-muted">
          {counts[side] > 0
            ? `登録済みの${counts[side]}人分は、登録すると今回のCSVの内容に置き換わります（${SIDE_LABEL[side === "home" ? "away" : "home"]}の成績はそのまま残ります）。`
            : "このチームの成績はまだ登録されていません。"}
        </p>

        <ol className="mb-5 list-decimal space-y-1 pl-5 text-sm leading-7">
          <li>
            <a href={templateHref} className={LINK_CLASS} download>
              CSV雛形をダウンロード
            </a>
            し、1行に1選手ずつ、{team.abbreviation} の選手だけを記入します（最大{MAX_CSV_ROWS}人）。
          </li>
          <li>「CSV UTF-8（コンマ区切り）」形式で保存します。</li>
          <li>下でCSVを選ぶと、登録前に選手と数値のプレビューと検査結果が表示されます。</li>
          <li>エラーがなければ「このチームの成績を登録」を押します。押すまでは保存されません。</li>
        </ol>

        <TeamBoxScoreForm key={`${game.id}-${side}`} gameId={game.id} side={side} teamAbbr={team.abbreviation} existingCount={counts[side]} />

        <details className="mt-6 border-t border-line pt-4 text-sm">
          <summary className="cursor-pointer font-bold">CSVの列と記入例</summary>
          <div className="mt-3 space-y-4">
            <p className="break-all rounded-sm bg-[#f3f6fb] px-3 py-2 font-mono text-xs dark:bg-white/[.06]">{BOX_SCORE_HEADER}</p>
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
                      <td className="whitespace-nowrap px-3 py-2">{c.required ? "必須" : "空欄可"}</td>
                      <td className="px-3 py-2">{c.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-muted">記入例（架空の選手名・数値です）</p>
              <pre className="overflow-x-auto bg-[#f3f6fb] px-3 py-2 text-xs leading-6 dark:bg-white/[.06]">
                {[BOX_SCORE_HEADER, ...BOX_SCORE_EXAMPLE_ROWS.map((r) => r.join(","))].join("\n")}
              </pre>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
              <li>試合日・チーム・スコアの列はありません（この画面で選んだ試合とチームを使います）。</li>
              <li>FG（fgm・fga）は3Pを含む数です。PTS は 2×(fgm−fg3m)＋3×fg3m＋ftm と一致している必要があります。</li>
              <li>出場しなかった選手は、行を省くか、出場時間 0:00・各スタッツ 0 で記入します。</li>
            </ul>
          </div>
        </details>
      </section>

      <section className="border border-line bg-surface p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-bold">登録済みの {team.abbreviation} の成績</h2>
        <BoxScoreTable side={side === "home" ? "ホーム" : "アウェー"} team={team} rows={registered} />
      </section>
    </main>
  );
}
