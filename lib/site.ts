// サイトの公開URL。独自ドメインへの切り替えはVercelの環境変数
// NEXT_PUBLIC_SITE_URL を変えるだけで済むよう、URLはここ1か所から参照する。
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://nba-f-o-j.com"
).replace(/\/+$/, "");
