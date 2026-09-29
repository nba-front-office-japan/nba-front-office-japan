import type { ReactNode } from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { OwnerNetWorthTable } from "@/components/owner-net-worth-table";
import { formatJaDate, formatValueOku } from "@/lib/valuations";
import {
  buildOwnerNetWorthRows,
  fetchLatestOwnerNetWorthEdition,
  formatUsdBillions,
  median,
} from "@/lib/owner-net-worth";

const TEN_BILLION_USD = 10_000_000_000;

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="min-w-0 bg-surface p-4">
      <span className="mb-1.5 block text-[11px] text-muted">{label}</span>
      <b className="block break-words text-[20px] font-bold leading-tight">{value}</b>
      {sub && <span className="mt-1 block break-words text-[11px] text-muted">{sub}</span>}
    </div>
  );
}

function PageHeading({ kicker }: { kicker: string }) {
  return (
    <>
      <nav aria-label="パンくずリスト" className="mb-4 text-xs text-muted">
        <Link href="/rankings" className="hover:text-blue">
          ランキング
        </Link>
        <span aria-hidden className="mx-1.5">›</span>
        <span aria-current="page">オーナー資産</span>
      </nav>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">{kicker}</p>
      <h1 className="mb-3 text-[36px] font-semibold tracking-tight">NBAオーナー資産ランキング</h1>
      <p className="mb-5 text-sm text-muted">
        各チームの代表オーナー1名の推定純資産（個人資産）を順位で並べたページです。
      </p>
    </>
  );
}

export default async function OwnerNetWorthPage() {
  const supabase = createServerSupabaseClient();

  const { data: edition, error: editionError } = await fetchLatestOwnerNetWorthEdition(supabase);

  if (editionError || !edition) {
    return (
      <PageShell>
        <PageHeading kicker="Rankings" />
        <p className="text-sm text-muted">
          {editionError ? `オーナー資産データの取得に失敗しました: ${editionError.message}` : "情報準備中"}
        </p>
      </PageShell>
    );
  }

  const [{ data: records, error: recordsError }, { data: teams }] = await Promise.all([
    supabase.from("team_owner_net_worths").select("*").eq("edition_id", edition.id),
    supabase.from("teams").select("id, name, abbreviation"),
  ]);

  const rows = buildOwnerNetWorthRows(records ?? [], teams ?? []);
  const ranked = rows.filter((r) => r.group === "ranked");
  const values = ranked.map((r) => r.netWorthUsd ?? 0);
  const top = ranked[0] ?? null;
  const medianValue = median(values);
  const overTenBillion = ranked.filter((r) => (r.netWorthUsd ?? 0) >= TEN_BILLION_USD);
  const noValueCount = rows.filter((r) => r.group === "no_value").length;
  const excludedCount = rows.filter((r) => r.group === "excluded").length;
  const asOf = formatJaDate(edition.as_of_date);
  const checked = formatJaDate(edition.last_verified);

  return (
    <PageShell>
      <PageHeading kicker={`Rankings · ${edition.source_name} ${edition.as_of_date}`} />

      <p className="mb-6 border-l-[3px] border-gold pl-3 text-xs leading-relaxed text-muted">
        <span className="font-bold text-foreground">推定値：</span>
        {edition.source_name}による個人の推定純資産で、本人・チームの公式発表ではありません。チームの資産価値とは別の指標です。
        {asOf}時点（{checked}確認）。
      </p>

      {recordsError ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          オーナー資産データの取得に失敗しました: {recordsError.message}
        </p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
            <SummaryCard
              label="1位"
              value={top ? `${formatValueOku(top.netWorthUsd ?? 0)}億ドル` : "—"}
              sub={top ? `${top.ownerName}（${top.teamAbbr}）` : null}
            />
            <SummaryCard
              label={`中央値（推定値のある${ranked.length}人）`}
              value={medianValue !== null ? `${formatValueOku(Math.round(medianValue))}億ドル` : "—"}
              sub={medianValue !== null ? formatUsdBillions(medianValue) : null}
            />
            <SummaryCard
              label="100億ドル以上"
              value={`${overTenBillion.length}人`}
              sub={`推定値のある${ranked.length}人のうち`}
            />
            <SummaryCard
              label="推定値なし・順位対象外"
              value={`${noValueCount}チーム・${excludedCount}チーム`}
              sub="表の最後にまとめて表示"
            />
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">順位表</h2>
            <OwnerNetWorthTable rows={rows} />
            <p className="mt-2 text-xs text-muted">
              同額は同順位です。「一族合算」は、{edition.source_name}が本人と家族の資産を合わせて推定している値です。
              チーム名から各チームのTeam Profile（フロント）を確認できます。
            </p>
          </section>
        </>
      )}

      <section className="border border-line bg-surface p-4 text-xs text-muted sm:p-6">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Source</p>
        <h2 className="mb-3 text-base font-semibold text-foreground">出典</h2>
        <dl className="space-y-2.5">
          <div>
            <dt className="font-bold">出典</dt>
            <dd className="mt-0.5">
              <a
                href={edition.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words text-blue underline-offset-2 hover:underline"
              >
                {edition.title}
              </a>{" "}
              ↗（各オーナーの推定値は、順位表の「{edition.source_name} ↗」から個人ページを確認できます）
            </dd>
          </div>
          <div>
            <dt className="font-bold">基準日</dt>
            <dd className="mt-0.5">{asOf}（出典の個人ページに表示された時点）</dd>
          </div>
          <div>
            <dt className="font-bold">確認日</dt>
            <dd className="mt-0.5">{checked}</dd>
          </div>
          {edition.value_definition && (
            <div>
              <dt className="font-bold">推定純資産の定義</dt>
              <dd className="mt-0.5 leading-relaxed">{edition.value_definition}</dd>
            </div>
          )}
          {edition.representative_rule && (
            <div>
              <dt className="font-bold">代表オーナーの選び方</dt>
              <dd className="mt-0.5 leading-relaxed">{edition.representative_rule}</dd>
            </div>
          )}
        </dl>
      </section>
    </PageShell>
  );
}
