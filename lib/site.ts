// サイトの公開URL。独自ドメインへの切り替えはVercelの環境変数
// NEXT_PUBLIC_SITE_URL を変えるだけで済むよう、URLはここ1か所から参照する。
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://nba-f-o-j.com"
).replace(/\/+$/, "");

// サイト名と運営者名(運営者情報・プライバシーポリシー・利用規約で使う)
export const SITE_NAME = "NBA Front Office Japan";
export const OPERATOR_NAME = "NBA Front Office Japan 編集部";

// 公式SNSアカウント。URLが空のものはフッター等に表示しない。
export const SOCIAL_LINKS: { label: string; url: string }[] = [
  { label: "X", url: "" },
  { label: "Threads", url: "" },
].filter((s) => s.url);

// お問い合わせ先(Googleフォーム等のURL)。空のあいだはお問い合わせページに「準備中」と表示する。
export const CONTACT_FORM_URL = "";
