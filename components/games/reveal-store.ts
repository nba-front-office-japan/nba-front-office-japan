// 試合センターのネタバレ防止で使う、ブラウザのタブ内だけの記録(sessionStorage。タブを閉じると消える)。
// ・結果を表示した日付: 一覧で「結果を表示する」を押した日付。同じタブで一覧に戻ったときは結果を表示したままにする
// ・結果を表示した試合: 一覧で結果を表示したあと、カードを押して詳細へ進んだ試合。詳細でも結果をそのまま表示する
// 詳細ページを直接開いた場合(リンクを共有された場合など)や、別の日付・初めて開く人には結果を隠したままにする。
// URL には何も付けない(共有されたリンクでネタバレしないため)。
// sessionStorage が使えない環境でも画面が壊れないよう、読み書きはすべて try/catch で囲む。

const GAME_KEY = "nbafoj:games:revealed-game-ids";
const DATE_KEY = "nbafoj:games:revealed-dates";

function read(key: string): string[] {
  try {
    const raw = window.sessionStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function add(key: string, value: string): void {
  try {
    const values = new Set(read(key));
    values.add(value);
    window.sessionStorage.setItem(key, JSON.stringify([...values]));
  } catch {
    // 記録できなくても、「結果を表示する」を押せば見られる
  }
}

export function markGameRevealed(gameId: string): void {
  add(GAME_KEY, gameId);
}

export function isGameRevealed(gameId: string): boolean {
  return read(GAME_KEY).includes(gameId);
}

export function markDateRevealed(date: string): void {
  add(DATE_KEY, date);
}

export function isDateRevealed(date: string): boolean {
  return read(DATE_KEY).includes(date);
}

// useSyncExternalStore 用。sessionStorage の変化を購読する必要はない(同じタブ内では表示中に変わらない)
export function subscribeNoop(): () => void {
  return () => {};
}

/** サーバー側・最初の描画では「まだ分からない」(null)とし、結果も非表示画面も出さない */
export function unknownOnServer(): null {
  return null;
}

// 一度取得した結果を、このタブのページ間移動の間だけメモリに保持する(戻ったときにすぐ表示するため)。
// ページを再読み込みすると消え、記録済みの日付・試合なら再取得する。
const memoryCache = new Map<string, unknown>();

export function getCached<T>(key: string): T | undefined {
  return memoryCache.get(key) as T | undefined;
}

export function setCached(key: string, value: unknown): void {
  memoryCache.set(key, value);
}
