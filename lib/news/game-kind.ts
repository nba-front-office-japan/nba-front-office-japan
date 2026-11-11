// 記事の「試合区分」(article_drafts.game_kind)。NEWS 一覧の「試合結果」「プレビュー」タブの振り分けに使う。
// - "result"  : 試合結果(その試合の結果・活躍を伝える記事。「○○が43得点」「○○連勝」なども運用側でこちらにする)
// - "preview" : プレビュー
// - null      : 指定なし
// プレビューは、game_kind = "preview" のほか、対象試合(targetGame)が設定された記事も含む。
// "result" を指定した記事は、対象試合があっても試合結果として扱う。見出しの文言などでの自動判定はしない。

export type GameKind = "result" | "preview";

export const GAME_KIND_OPTIONS: { value: GameKind; label: string }[] = [
  { value: "result", label: "試合結果" },
  { value: "preview", label: "プレビュー" },
];

export function isGameKind(value: unknown): value is GameKind {
  return value === "result" || value === "preview";
}

/** 入稿APIの値を検証する。"result" / "preview"(日本語の「試合結果」「プレビュー」も可)。null・省略・"" は指定なし */
export function parseGameKind(value: unknown): GameKind | null | { error: string } {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string") {
    const v = value.trim();
    if (isGameKind(v)) return v;
    const byLabel = GAME_KIND_OPTIONS.find((o) => o.label === v);
    if (byLabel) return byLabel.value;
  }
  return { error: 'gameKind は "result"（試合結果）/ "preview"（プレビュー）/ null のどれかにしてください。' };
}

/** NEWS 一覧での区分(試合結果 / プレビュー / それ以外の null) */
export function effectiveGameKind(gameKind: GameKind | null, targetGameDate: string | null): GameKind | null {
  if (gameKind) return gameKind;
  return targetGameDate ? "preview" : null;
}
