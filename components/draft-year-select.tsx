"use client";

import { useRouter } from "next/navigation";
import { draftYearHref } from "@/lib/draft-format";

// 年を選ぶと、その年のページへ移動する
export function DraftYearSelect({ year, years }: { year: number; years: number[] }) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm font-bold">
      ドラフト年
      <select
        value={year}
        onChange={(e) => router.push(draftYearHref(Number(e.target.value)))}
        className="border border-line bg-surface px-3 py-2 text-sm font-bold"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}年
          </option>
        ))}
      </select>
    </label>
  );
}
