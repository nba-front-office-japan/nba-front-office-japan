"use client";

import { useRouter } from "next/navigation";

export interface SeasonOption {
  season: number;
  label: string;
  // そのシーズンを表示する URL(表示中の Profile / Stats などの切り替えは引き継ぐ)
  href: string;
}

// Teams・選手名鑑のシーズン切り替え(プルダウン)。選ぶとそのシーズンの URL(?season=)へ移動する。
// JavaScript が動かない環境では、下にシーズンごとのリンクを出す。
export function SeasonSelect({ season, options }: { season: number; options: SeasonOption[] }) {
  const router = useRouter();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2.5">
      <label htmlFor="season-select" className="text-xs font-bold text-muted">
        シーズン
      </label>
      <select
        id="season-select"
        value={season}
        onChange={(e) => {
          const next = options.find((o) => o.season === Number(e.target.value));
          if (next) router.push(next.href);
        }}
        className="min-h-9 border border-line bg-surface px-3 text-sm font-bold text-foreground"
      >
        {options.map((o) => (
          <option key={o.season} value={o.season}>
            {o.label}
          </option>
        ))}
      </select>
      <noscript>
        <span className="flex gap-3 text-xs font-semibold">
          {options.map((o) => (
            <a key={o.season} href={o.href} className="text-blue underline">
              {o.label}
            </a>
          ))}
        </span>
      </noscript>
    </div>
  );
}
