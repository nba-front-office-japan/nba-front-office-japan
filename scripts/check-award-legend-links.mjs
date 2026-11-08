// 年度別アワード(nba_season_awards)の受賞者と、レジェンド76人の照合結果を確認する(読み取りのみ)。
// 使い方: node scripts/check-award-legend-links.mjs  (.env.local の NEXT_PUBLIC_SUPABASE_URL / ANON_KEY を使う)
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const rows = [];
for (let from = 0; ; from += 1000) {
  const res = await fetch(`${url}/rest/v1/nba_season_awards?select=season,award_key,detail,player_name,player_id&order=id`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}` },
  });
  const data = await res.json();
  rows.push(...data);
  if (data.length < 1000) break;
}
const legends = JSON.parse(fs.readFileSync("data/legends/legends.json", "utf8")).legends;
const byName = new Map(legends.map((l) => [norm(l.name), l]));
const seasons = [...new Set(rows.map((r) => r.season))].sort();
console.log(`アワード行数: ${rows.length} / 年度: ${seasons[0]}〜${seasons.at(-1)} (${seasons.length}年度)`);

const hit = new Map();
for (const r of rows) {
  const l = byName.get(norm(r.player_name));
  if (!l) continue;
  const h = hit.get(l.slug) ?? { l, n: 0, names: new Set(), withId: 0 };
  h.n++;
  h.names.add(r.player_name);
  if (r.player_id) h.withId++;
  hit.set(l.slug, h);
}
console.log(`\n■ 一致したレジェンド: ${hit.size}人`);
for (const h of [...hit.values()].sort((a, b) => b.n - a.n)) {
  console.log(`${h.l.isActive ? "現役→/players" : "引退→/legends"}\t${h.l.slug}\t${h.n}件\t(選手ID付き${h.withId}件)\t表記: ${[...h.names].join(" / ")}`);
}
// 2003-04以降にプレーしたのに一致しなかったレジェンド(表記ゆれの見落とし確認)
const missed = legends.filter((l) => (l.toYear ?? 0) >= 2004 && !hit.has(l.slug));
console.log(`\n■ 2003-04以降に在籍したが一致なし: ${missed.length}人`);
for (const l of missed) {
  const last = norm(l.name.split(" ").at(-1));
  const similar = [...new Set(rows.filter((r) => norm(r.player_name).endsWith(last)).map((r) => r.player_name))];
  console.log(`${l.slug}\t${l.name}\t似た名前: ${similar.join(" / ") || "なし"}`);
}
