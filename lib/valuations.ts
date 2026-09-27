// チーム資産価値(team_valuation_editions / team_valuations)の取得と表示用の整形。
// 値はメディアの推計値で、NBA・各チームの公式発表ではない。画面では必ず出典と「推計」を併記する。
import type { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ValuationEdition = Database["public"]["Tables"]["team_valuation_editions"]["Row"];
export type TeamValuation = Database["public"]["Tables"]["team_valuations"]["Row"];

type ServerClient = ReturnType<typeof createServerSupabaseClient>;

// 公開日が最も新しい年版を1件返す。無ければ null。
export function fetchLatestValuationEdition(supabase: ServerClient) {
  return supabase
    .from("team_valuation_editions")
    .select("*")
    .order("published_on", { ascending: false })
    .limit(1)
    .maybeSingle();
}

// 例: 「CNBC推計・2026年版」
export function valuationEditionLabel(edition: ValuationEdition): string {
  return `${edition.source_name}推計・${edition.edition_year}年版`;
}

const USD_PER_OKU = 100_000_000;

// 資産価値の表示。DBの値は5,000万ドル単位のため、小数1桁で丸めずに表せる。例: 10800000000 → 「108」、6450000000 → 「64.5」
export function formatValueOku(usd: number): string {
  return (usd / USD_PER_OKU).toLocaleString("ja-JP", { maximumFractionDigits: 1 });
}

// 売上・EBITDAの表示(億ドル・小数2桁)。DBの値は100万ドル単位。0 はそのまま「0」、マイナスは「−」を付ける。
export function formatFinancialOku(usd: number | null): string {
  if (usd === null) return "—";
  if (usd === 0) return "0";
  const text = (Math.abs(usd) / USD_PER_OKU).toLocaleString("ja-JP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return usd < 0 ? `−${text}` : text;
}

// 前年比の表示。例: 15 → 「+15%」、-3.5 → 「−3.5%」、0 → 「±0%」
export function formatChangePct(pct: number | null): string {
  if (pct === null) return "—";
  const n = Number(pct);
  if (n === 0) return "±0%";
  const text = Math.abs(n).toLocaleString("ja-JP", { maximumFractionDigits: 2 });
  return n > 0 ? `+${text}%` : `−${text}%`;
}

// "2026-02-13" → 「2026年2月13日」。日付文字列を分解し、タイムゾーンの影響を受けないようにする。
export function formatJaDate(date: string | null): string {
  const m = date ? /^(\d{4})-(\d{2})-(\d{2})/.exec(date) : null;
  return m ? `${m[1]}年${Number(m[2])}月${Number(m[3])}日` : "—";
}

// 開始年 → 「2024-25」
export function formatSeasonSpan(startYear: number | null): string | null {
  if (startYear === null) return null;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}
