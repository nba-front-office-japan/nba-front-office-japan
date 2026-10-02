import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "NBAガイド | NBA Front Office Japan",
  description: "NBAの制度・契約・ドラフト・トレード・ビジネスなどを日本語で解説するガイドの一覧です。",
};

// ガイドのカテゴリーと、各カテゴリーで扱う内容の例。
// 各項目の詳細ページはまだ無いため、現時点ではリンクを付けない。
const GUIDE_CATEGORIES: { category: string; examples: string[] }[] = [
  { category: "NBA制度", examples: ["サラリーキャップ", "ラグジュアリータックス", "Apron"] },
  { category: "契約", examples: ["MAX契約", "ミニマム", "バード権", "FA"] },
  { category: "ドラフト", examples: ["指名権", "ロッタリー", "指名権価値"] },
  { category: "トレード", examples: ["トレードルール", "サラリーマッチング"] },
  { category: "NBAビジネス", examples: ["放映権", "オーナー", "チーム資産価値"] },
  { category: "過去事件", examples: ["ジョー・スミス事件", "タンパリング", "キャップ迂回"] },
  { category: "用語解説", examples: ["2-way", "RFA", "UFA", "MLEなど"] },
];

export default function GuidePage() {
  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Guide</p>
      <h1 className="mb-3 text-[36px] font-semibold tracking-tight">NBAガイド</h1>
      <p className="mb-8 text-sm text-muted">
        NBAの制度・契約・ドラフト・トレード・ビジネスを理解するためのガイドです。各カテゴリーの解説は順次追加します。
      </p>

      {/* PC: 2列の表 */}
      <div className="hidden border border-line bg-surface sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground text-left">
              <th scope="col" className="w-[220px] px-5 py-3 text-[11px] font-extrabold uppercase tracking-[1.3px] text-muted">
                GUIDE内カテゴリー
              </th>
              <th scope="col" className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-[1.3px] text-muted">
                例
              </th>
            </tr>
          </thead>
          <tbody>
            {GUIDE_CATEGORIES.map((row) => (
              <tr key={row.category} className="border-b border-line last:border-b-0">
                <th scope="row" className="px-5 py-4 text-left align-top text-[15px] font-bold">
                  {row.category}
                </th>
                <td className="px-5 py-4 leading-7">{row.examples.join("、")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* スマホ: カテゴリーごとの縦並び */}
      <div className="border border-line bg-surface sm:hidden">
        <p className="border-b-2 border-foreground px-4 py-3 text-[11px] font-extrabold uppercase tracking-[1.3px] text-muted">
          GUIDE内カテゴリー ／ 例
        </p>
        <dl>
          {GUIDE_CATEGORIES.map((row) => (
            <div key={row.category} className="border-b border-line px-4 py-4 last:border-b-0">
              <dt className="mb-1 text-[15px] font-bold">{row.category}</dt>
              <dd className="text-sm leading-7 text-muted">{row.examples.join("、")}</dd>
            </div>
          ))}
        </dl>
      </div>
    </PageShell>
  );
}
