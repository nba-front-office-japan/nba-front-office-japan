interface DraftFields {
  draft_status?: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_pick: number | null;
}

// ドラフト外(draft_status = 'undrafted')は年度があれば「YYYY年 ドラフト外」、無ければ「ドラフト外」。
// 通常の指名は従来どおり「YYYY年 X巡目 全体Y位」。情報が無い場合はnullを返す。
export function formatDraftInfo(player: DraftFields, missing = "?"): string | null {
  if (player.draft_status === "undrafted") {
    return player.draft_year ? `${player.draft_year}年 ドラフト外` : "ドラフト外";
  }
  if (!player.draft_year) return null;
  const round = player.draft_round ?? missing;
  const pick = player.draft_pick ?? missing;
  return `${player.draft_year}年 ${round}巡目 ${pick}位`;
}

// 並べ替え用の値(年が新しいほど大きい)。同じ年ではドラフト外を指名選手より後ろに置く。
export function draftSortValue(player: DraftFields): number | null {
  if (!player.draft_year) return null;
  if (player.draft_status === "undrafted") return player.draft_year * 100000 + 99000;
  return player.draft_year * 100000 + (player.draft_round ?? 0) * 1000 + (player.draft_pick ?? 0);
}
