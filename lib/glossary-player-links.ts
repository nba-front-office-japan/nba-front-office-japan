import "server-only";
import { loadDraftMatchData } from "@/lib/draft/draft-player-links";
import { buildDraftPlayerIndex, matchDraftPick } from "@/lib/draft/draft-player-match";
import { GLOSSARY_TERMS } from "@/lib/glossary-terms";

/** 用語辞典の選手リンクのキー(ドラフト年-全体指名順位) */
export const glossaryPlayerKey = (draft: [number, number]) => `${draft[0]}-${draft[1]}`;

/**
 * 用語辞典(ニックネーム・面白ネタ)に出てくる選手 → 選手名鑑の選手ID。
 * 照合は /draft と同じ仕組み(英語名＋ドラフト年・全体指名順位)に、名鑑のドラフト年の一致確認を加えたもの。同名の別人に誤ってリンクしないよう、
 * 照合が決まらない選手は含めない(リンクを出さない)。名鑑の取得に失敗したら空。
 */
export async function fetchGlossaryPlayerIds(): Promise<Record<string, string>> {
  let data: Awaited<ReturnType<typeof loadDraftMatchData>> = null;
  try {
    data = await loadDraftMatchData();
  } catch {
    return {};
  }
  if (!data) return {};
  const index = buildDraftPlayerIndex(data.players, data.aliases);
  const draftYearById = new Map(data.players.map((p) => [p.id, p.draft_year]));
  const result: Record<string, string> = {};
  for (const term of GLOSSARY_TERMS) {
    for (const player of term.players ?? []) {
      const key = glossaryPlayerKey(player.draft);
      if (key in result) continue;
      const [year, overallPick] = player.draft;
      for (const name of player.en) {
        const match = matchDraftPick(index, year, { overallPick, playerNameEn: name });
        // 名鑑のドラフト年が一致する選手だけ採用する(昔の選手は同名の別人がいるため)。
        // 名鑑にドラフト年が入っていない場合は、同名の別人がいにくい最近(2020年以降)のドラフトの選手だけ採用する
        const dbYear = match.status === "matched" ? draftYearById.get(match.playerId) : undefined;
        // 指名順位 0 = ドラフト外・地域指名(全体順位なし)。名前で1人に決まり、名鑑のドラフト年が同じか空の場合だけ採用する
        const undrafted = overallPick === 0 && match.status === "matched" && match.by === "name" && (dbYear === year || dbYear === null);
        if (match.status === "matched" && (undrafted || dbYear === year || (dbYear === null && year >= 2020))) {
          result[key] = match.playerId;
          break;
        }
      }
    }
  }
  return result;
}
