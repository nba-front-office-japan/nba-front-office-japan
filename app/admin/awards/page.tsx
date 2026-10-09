import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { HISTORY_AWARDS, seasonLabel } from "@/lib/awards/history";
import { AwardImportForm } from "./award-import-form";
import { MasterImportForm } from "./master-import-form";

// 管理画面は常に最新の登録状況を見せるため、毎回サーバーで取得する。
export const dynamic = "force-dynamic";

// 表彰データは2種類あり、別々のテーブルに保存する(混同しないよう画面も分ける)。
//   A. 年度別アワード(/awards)のマスターデータ … nba_season_awards(NBA全体。引退選手も含む)
//   B. 選手プロフィールの「個人賞・表彰」 … player_award_records(サイトに登録されている選手の受賞歴)

async function fetchAllRows<T>(table: "player_award_records" | "nba_season_awards", columns: string): Promise<T[] | null> {
  const supabase = createAdminSupabaseClient();
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).order("id").range(from, from + 999);
    if (error) return null;
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

function NotReady({ file }: { file: string }) {
  return (
    <p role="alert" className="border-l-4 border-[#cf4a51] bg-surface px-4 py-3 text-sm font-semibold text-[#a3383d] dark:text-[#ff8a7a]">
      このデータのテーブルがまだありません。<code className="break-all">{file}</code> を Supabase で実行してから使ってください。
    </p>
  );
}

export default async function AdminAwardsPage() {
  const [history, master] = await Promise.all([
    fetchAllRows<{ player_id: string; award_key: string }>("player_award_records", "player_id, award_key"),
    fetchAllRows<{ season: number; player_id: string | null; player_name: string }>("nba_season_awards", "season, player_id, player_name"),
  ]);
  const historyByAward = new Map<string, number>();
  for (const r of history ?? []) historyByAward.set(r.award_key, (historyByAward.get(r.award_key) ?? 0) + 1);
  const masterSeasons = [...new Set((master ?? []).map((r) => r.season))].sort((a, b) => a - b);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-8">
      <div>
        <h1 className="text-2xl font-bold">表彰データ</h1>
        <p className="mt-1 text-sm text-muted">
          表彰データは2種類あり、別々に取り込みます。A は年度別アワードページ（/awards）用のNBA全体のデータ、B は選手プロフィールの「個人賞・表彰」用のデータです。
        </p>
      </div>

      <section className="border border-line bg-surface p-5 sm:p-6">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">A. Season awards master</p>
        <h2 className="mb-1 text-lg font-bold">年度別アワード（/awards 用・NBA全体のマスターデータ）</h2>
        {master === null ? (
          <NotReady file="supabase/migrations/20261010000000_nba_season_awards.sql" />
        ) : (
          <>
            <p className="mb-3 text-sm">
              現在の登録：{master.length}件
              {masterSeasons.length > 0 && `（${seasonLabel(masterSeasons[0])}〜${seasonLabel(masterSeasons[masterSeasons.length - 1])}・${masterSeasons.length}年度、選手 ${new Set(master.map((r) => r.player_name)).size}人）`}
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm leading-7">
              <li>マスターExcel（NBA_Awards_Master_…xlsx）の「Awards Data」と「All-Star」シートを取り込みます。Stat Leaders・Records・Player Summary は使いません。</li>
              <li>
                <b>今回のExcelを正として、既存の年度別アワードを置き換えます。</b>Excel に含まれない既存の記録は削除されます（削除がある場合は、実行前に確認のチェックが必要です）。
              </li>
              <li>現役・引退を問わず、Excel の選手名をそのまま表示します。サイトに選手プロフィールがある選手（1人に決まる場合）だけリンクを付けます。</li>
              <li>選手プロフィールの「個人賞・表彰」（下の B）には影響しません。</li>
            </ul>
            <MasterImportForm />
          </>
        )}
      </section>

      <section className="border border-line bg-surface p-5 sm:p-6">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">B. Player award history</p>
        <h2 className="mb-1 text-lg font-bold">選手プロフィールの「個人賞・表彰」</h2>
        {history === null ? (
          <NotReady file="supabase/migrations/20261009000000_player_award_records.sql" />
        ) : (
          <>
            <p className="text-sm">
              現在の登録：{new Set(history.map((r) => r.player_id)).size}選手・{history.length}件
            </p>
            {history.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {HISTORY_AWARDS.map((a) => (
                  <li key={a.key}>
                    {a.label}：{historyByAward.get(a.key) ?? 0}件
                  </li>
                ))}
              </ul>
            )}
            <ul className="my-4 list-disc space-y-1 pl-5 text-sm leading-7">
              <li>表彰Excel（NBA_Awards_…xlsx）の Awards シート（列：Player・Current Team・Award・Season・Award Team・Source）を取り込みます。</li>
              <li>
                <b>今回のExcelを正として、既存の表彰データを置き換えます。</b>Excel に含まれない既存の記録は削除されます（削除がある場合は、実行前に確認のチェックが必要です）。
              </li>
              <li>選手は英語名でサイトの選手データと照合します。一致しない名前・1人に決まらない名前は紐付けず、エラーとして表示します（その選手の既存データは削除しません）。</li>
              <li>同じ選手・賞・シーズンの重複は登録しません。Award Team と Source は保存しますが、プロフィールには表示しません。</li>
            </ul>
            <AwardImportForm />
          </>
        )}
      </section>
    </main>
  );
}
