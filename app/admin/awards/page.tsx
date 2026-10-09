import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { HISTORY_AWARDS } from "@/lib/awards/history";
import { AwardImportForm } from "./award-import-form";

// 管理画面は常に最新の登録状況を見せるため、毎回サーバーで取得する。
export const dynamic = "force-dynamic";

async function fetchStatus(): Promise<{ ready: boolean; records: number; players: number; byAward: Map<string, number> }> {
  const supabase = createAdminSupabaseClient();
  const rows: { player_id: string; award_key: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("player_award_records").select("player_id, award_key").order("id").range(from, from + 999);
    if (error) return { ready: false, records: 0, players: 0, byAward: new Map() };
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const byAward = new Map<string, number>();
  for (const r of rows) byAward.set(r.award_key, (byAward.get(r.award_key) ?? 0) + 1);
  return { ready: true, records: rows.length, players: new Set(rows.map((r) => r.player_id)).size, byAward };
}

export default async function AdminAwardsPage() {
  const status = await fetchStatus();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-8">
      <div>
        <h1 className="text-2xl font-bold">表彰データ</h1>
        <p className="mt-1 text-sm text-muted">選手プロフィールの「個人賞・表彰」に表示するデータを、Excel（Awards シート）から取り込みます。</p>
      </div>

      {!status.ready && (
        <p role="alert" className="border-l-4 border-[#cf4a51] bg-surface px-4 py-3 text-sm font-semibold text-[#a3383d] dark:text-[#ff8a7a]">
          表彰データのテーブル（player_award_records）がまだありません。<code className="break-all">supabase/migrations/20261009000000_player_award_records.sql</code> を Supabase で実行してから使ってください。
        </p>
      )}

      <section className="border border-line bg-surface p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-bold">現在の登録状況</h2>
        <p className="text-sm">
          {status.players}選手・{status.records}件
        </p>
        {status.records > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {HISTORY_AWARDS.map((a) => (
              <li key={a.key}>
                {a.label}：{status.byAward.get(a.key) ?? 0}件
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-line bg-surface p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-bold">Excelから取り込む</h2>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm leading-7">
          <li>Excel の Awards シート（列：Player・Current Team・Award・Season・Award Team・Source）を取り込みます。</li>
          <li>
            <b>今回のExcelを正として、既存の表彰データを置き換えます。</b>Excel に含まれない既存の記録は削除されます（削除がある場合は、実行前に確認のチェックが必要です）。
          </li>
          <li>選手は英語名でサイトの選手データと照合します。一致しない名前・1人に決まらない名前は紐付けず、エラーとして表示します（その選手の既存データは削除しません）。</li>
          <li>同じ選手・賞・シーズンの重複は登録しません。Award Team と Source は保存しますが、プロフィールには表示しません。</li>
        </ul>
        {status.ready && <AwardImportForm />}
      </section>
    </main>
  );
}
