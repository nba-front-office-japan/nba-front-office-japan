// ドラフト指名選手(/draft の静的データ)が選手名鑑(playersテーブル)の誰につながるかを実データで確認するスクリプト。
// 書き込みは一切しない(読むだけ)。サイトと同じ照合ロジック(lib/draft/draft-player-match.ts)を使う。
//
// 実行方法: npx ts-node scripts/check-draft-player-links.ts [出力先.md]
//   既定の出力先: draft-player-links-report.md

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { DRAFT_2026_PICKS } from "../lib/draft/draft-2026-picks";
import {
  buildDraftPlayerIndex,
  matchDraftPick,
  type DraftMatchAlias,
  type DraftMatchPick,
  type DraftMatchPlayer,
} from "../lib/draft/draft-player-match";

interface Pick extends DraftMatchPick {
  round: number;
  playerNameJa: string | null;
  teamDisplay: string;
}

async function fetchAll<T>(table: string, columns: string): Promise<T[]> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).order("id").range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function main() {
  const out = process.argv[2] ?? "draft-player-links-report.md";
  const history = JSON.parse(readFileSync(join(__dirname, "../lib/draft/draft-history.json"), "utf8")) as Record<string, Pick[]>;
  const years: [number, Pick[]][] = [
    [2026, DRAFT_2026_PICKS],
    ...Object.entries(history).map(([y, p]): [number, Pick[]] => [Number(y), p]).sort((a, b) => b[0] - a[0]),
  ];

  const players = await fetchAll<DraftMatchPlayer>("players", "id, full_name, last_name, draft_year, draft_pick");
  const aliases = await fetchAll<DraftMatchAlias>("player_name_aliases", "player_id, alias_full_name");
  const index = buildDraftPlayerIndex(players, aliases);
  const nameById = new Map(players.map((p) => [p.id, p.full_name]));

  const lines: string[] = [];
  const summary: string[] = [];
  let total = 0;
  let matched = 0;
  const counts = { name: 0, draft: 0, ambiguous: 0, differs: 0, notFound: 0 };
  const problems: string[] = [];
  const fuzzy: string[] = [];

  for (const [year, picks] of years) {
    let yearMatched = 0;
    for (const pick of picks) {
      total++;
      const r = matchDraftPick(index, year, pick);
      const label = `${year} 全体${pick.overallPick}位 ${pick.playerNameEn}${pick.playerNameJa ? `(${pick.playerNameJa})` : ""} / ${pick.teamDisplay}`;
      if (r.status === "matched") {
        matched++;
        yearMatched++;
        counts[r.by]++;
        if (r.by === "draft") fuzzy.push(`- ${label} → 名鑑: ${nameById.get(r.playerId)}`);
      } else if (r.status === "ambiguous") {
        counts.ambiguous++;
        problems.push(`| ${year} | ${pick.overallPick} | ${pick.playerNameEn} | ${pick.playerNameJa ?? ""} | 同名が複数: ${r.candidates.join(" / ")} |`);
      } else if (r.status === "draft-year-differs") {
        counts.differs++;
        problems.push(`| ${year} | ${pick.overallPick} | ${pick.playerNameEn} | ${pick.playerNameJa ?? ""} | 同名あり(名鑑のドラフト年=${r.dbDraftYear}) |`);
      } else {
        counts.notFound++;
        problems.push(`| ${year} | ${pick.overallPick} | ${pick.playerNameEn} | ${pick.playerNameJa ?? ""} | 名鑑に見つからない |`);
      }
    }
    summary.push(`| ${year} | ${picks.length} | ${yearMatched} | ${picks.length - yearMatched} |`);
  }

  lines.push(`# ドラフト指名選手 × 選手名鑑 照合結果`, ``, `作成: ${new Date().toISOString()}  名鑑の選手数: ${players.length} / 別表記: ${aliases.length}`, ``);
  lines.push(`- 指名選手: ${total}人`, `- つながった: ${matched}人(名前一致 ${counts.name} / ドラフト順位+姓で一致 ${counts.draft})`);
  lines.push(`- つながらない: ${total - matched}人(名鑑に無い ${counts.notFound} / 同名あり・ドラフト年が違う ${counts.differs} / 同名が複数 ${counts.ambiguous})`, ``);
  lines.push(`## 年ごと`, ``, `| 年 | 指名 | つながった | つながらない |`, `|---|---|---|---|`, ...summary, ``);
  lines.push(`## 名の表記ゆれで一致した選手(ドラフト順位＋姓で照合)`, ``, ...(fuzzy.length ? fuzzy : ["なし"]), ``);
  lines.push(`## つながらない選手`, ``, `| 年 | 全体 | 英語名 | 日本語名 | 理由 |`, `|---|---|---|---|---|`, ...problems, ``);
  writeFileSync(out, lines.join("\n"));
  console.log(lines.slice(0, 8).join("\n"));
  console.log(`\n詳細: ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
