// ドラフト指名選手(静的データ)と選手名鑑(playersテーブル)の照合ロジック。
// サイト(lib/draft/draft-player-links.ts)と確認用スクリプト(scripts/check-draft-player-links.ts)の両方で使うため、
// "server-only" や Supabase には依存しない。
//
// 照合の順番(別人に誤ってリンクしないよう、決まらないときはリンクしない):
//  1. 英語名(アクセント記号・大文字小文字・ピリオド・Jr./III などの違いは無視。player_name_aliases の別表記も使う)が一致
//     - 同じ名前が複数いる、または名鑑のドラフト年が別の年になっている場合は、ドラフト年・指名順位が一致する人だけを採用
//  2. 名前が一致しない場合は、名鑑のドラフト年・全体指名順位が同じで、姓が一致する選手(名の表記ゆれ。例: Nic / Nicolas)

export interface DraftMatchPlayer {
  id: string;
  full_name: string;
  last_name: string;
  draft_year: number | null;
  draft_pick: number | null;
}

export interface DraftMatchAlias {
  player_id: string;
  alias_full_name: string;
}

export interface DraftMatchPick {
  overallPick: number;
  playerNameEn: string;
}

export type DraftMatchResult =
  | { status: "matched"; playerId: string; by: "name" | "draft" }
  | { status: "ambiguous"; candidates: string[] }
  | { status: "draft-year-differs"; playerId: string; dbDraftYear: number | null }
  | { status: "not-found" };

/** 照合用に名前をそろえる(例: "Luka Dončić" → "luka doncic"、"Gary Trent Jr." → "gary trent") */
export function draftNameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'’`]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/, "")
    .trim();
}

function lastNameKey(name: string): string {
  const parts = draftNameKey(name).split(" ");
  return parts[parts.length - 1] ?? "";
}

export interface DraftPlayerIndex {
  byName: Map<string, DraftMatchPlayer[]>;
  byDraft: Map<string, DraftMatchPlayer[]>;
}

export function buildDraftPlayerIndex(players: DraftMatchPlayer[], aliases: DraftMatchAlias[]): DraftPlayerIndex {
  const byId = new Map(players.map((p) => [p.id, p]));
  const byName = new Map<string, DraftMatchPlayer[]>();
  const add = (key: string, player: DraftMatchPlayer) => {
    const list = byName.get(key) ?? [];
    if (!list.includes(player)) list.push(player);
    byName.set(key, list);
  };
  for (const p of players) add(draftNameKey(p.full_name), p);
  for (const a of aliases) {
    const p = byId.get(a.player_id);
    if (p) add(draftNameKey(a.alias_full_name), p);
  }

  const byDraft = new Map<string, DraftMatchPlayer[]>();
  for (const p of players) {
    if (p.draft_year === null || p.draft_pick === null) continue;
    const key = `${p.draft_year}-${p.draft_pick}`;
    byDraft.set(key, [...(byDraft.get(key) ?? []), p]);
  }
  return { byName, byDraft };
}

export function matchDraftPick(index: DraftPlayerIndex, year: number, pick: DraftMatchPick): DraftMatchResult {
  const sameDraft = (p: DraftMatchPlayer) => p.draft_year === year && p.draft_pick === pick.overallPick;
  const named = index.byName.get(draftNameKey(pick.playerNameEn)) ?? [];

  if (named.length > 0) {
    const exact = named.filter(sameDraft);
    if (exact.length === 1) return { status: "matched", playerId: exact[0].id, by: "name" };
    const sameYear = named.filter((p) => p.draft_year === year);
    if (sameYear.length === 1) return { status: "matched", playerId: sameYear[0].id, by: "name" };
    // 名鑑にドラフト年が入っていない選手(今季のルーキーなど)は、同じ名前が1人だけなら同じ選手とみなす
    const noDraft = named.filter((p) => p.draft_year === null);
    if (named.length === 1 && noDraft.length === 1) return { status: "matched", playerId: named[0].id, by: "name" };
    if (named.length === 1) {
      return { status: "draft-year-differs", playerId: named[0].id, dbDraftYear: named[0].draft_year };
    }
    return { status: "ambiguous", candidates: named.map((p) => `${p.full_name}(${p.draft_year ?? "年不明"})`) };
  }

  const last = lastNameKey(pick.playerNameEn);
  const drafted = (index.byDraft.get(`${year}-${pick.overallPick}`) ?? []).filter(
    (p) => lastNameKey(p.full_name) === last,
  );
  if (drafted.length === 1) return { status: "matched", playerId: drafted[0].id, by: "draft" };
  return { status: "not-found" };
}

/** 指名(全体順位) → 選手ID。照合できた選手だけ入る */
export function matchDraftYear(index: DraftPlayerIndex, year: number, picks: DraftMatchPick[]): Record<number, string> {
  const result: Record<number, string> = {};
  for (const pick of picks) {
    const match = matchDraftPick(index, year, pick);
    if (match.status === "matched") result[pick.overallPick] = match.playerId;
  }
  return result;
}
