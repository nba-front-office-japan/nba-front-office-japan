import { LEGENDS, type Legend } from "@/lib/legends/data";

// 年度別アワード(/awards)とレジェンド枠(/legends)を相互にリンクするための対応表。
// アワードの受賞者名(英語)とレジェンドの英語名を、アクセント記号・記号・大文字小文字の違いを無視して照合する。

/** "Shaquille O’Neal" と "Shaquille O'Neal"、"Nikola Jokić" と "Nikola Jokic" を同じ名前として扱う */
export function normalizePlayerName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const BY_NAME = new Map<string, Legend>(LEGENDS.map((l) => [normalizePlayerName(l.name), l]));

/** 受賞者名に当てはまるレジェンド(76人)。いなければ null */
export function legendByPlayerName(name: string): Legend | null {
  return BY_NAME.get(normalizePlayerName(name)) ?? null;
}

// 年度別アワードに掲載している年度(2003-04〜2025-26)。表示している賞(優勝・殿堂入り・五輪を除く)だけリンクする。
export const AWARDS_PAGE_FIRST_SEASON = 2003;
export const AWARDS_PAGE_LAST_SEASON = 2025;
const AWARDS_PAGE_KEYS = new Set([
  "mvp",
  "finals_mvp",
  "dpoy",
  "roy",
  "mip",
  "sixth_man",
  "clutch",
  "all_star_mvp",
  "all_nba",
  "all_defensive",
  "all_rookie",
  "all_star",
]);

/** レジェンドの受賞歴(賞・年度)から年度別アワードへのリンク先。掲載していない賞・年度は null */
export function awardsPageHref(awardKey: string, season: number): string | null {
  if (!AWARDS_PAGE_KEYS.has(awardKey)) return null;
  if (season < AWARDS_PAGE_FIRST_SEASON || season > AWARDS_PAGE_LAST_SEASON) return null;
  return `/awards?season=${season}-${String((season + 1) % 100).padStart(2, "0")}`;
}
