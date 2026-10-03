// 試合センターのネタバレ防止で使う、ブラウザのセッション内だけの記録。
// 一覧で結果を表示したあと、カードを押して詳細へ進んだ試合だけを記録し、
// 詳細ページを直接開いた場合(リンクを共有された場合など)は結果を隠したままにする。
// sessionStorage が使えない環境でも画面が壊れないよう、読み書きはすべて try/catch で囲む。

const KEY = "nbafoj:games:revealed-game-ids";

function read(): string[] {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function markGameRevealed(gameId: string): void {
  try {
    const ids = new Set(read());
    ids.add(gameId);
    window.sessionStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // 記録できなくても、詳細ページで「結果を表示する」を押せば見られる
  }
}

export function isGameRevealed(gameId: string): boolean {
  return read().includes(gameId);
}
