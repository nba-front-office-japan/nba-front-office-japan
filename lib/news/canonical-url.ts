// RSSフィードや手動登録で入力されたURLを正規化する。
// トラッキング用クエリパラメータや末尾スラッシュの違いだけで
// news_items.canonical_url の一意制約をすり抜けて重複登録されるのを防ぐ。

const TRACKING_PARAM_PATTERNS = [
  /^utm_/,
  /^fbclid$/,
  /^gclid$/,
  /^ito$/,
  /^cmp$/,
  /^ex_cid$/,
  /^ncid$/,
  /^icid$/,
];

export function canonicalizeUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return rawUrl.trim();
  }

  const params = new URLSearchParams(url.search);
  for (const key of [...params.keys()]) {
    if (TRACKING_PARAM_PATTERNS.some((pattern) => pattern.test(key.toLowerCase()))) {
      params.delete(key);
    }
  }
  const sortedEntries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  url.search = new URLSearchParams(sortedEntries).toString();
  url.hash = "";

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}
