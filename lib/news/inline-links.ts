// 記事本文中のリンク。本文には [リンクにする文字](URL) の形で保存する(生のHTMLは使わない)。
// 管理画面の「リンク」ボタンがこの形で挿入し、公開ページ・管理画面プレビューが共通の部品(components/news/article-body.tsx)で
// 選択した文字だけをリンクとして表示する。使えるURLは次の2種類だけで、それ以外は文字のまま表示する。
//   内部リンク: / で始まるサイト内のパス(例: /guide/salary-cap、/salary/teams)… 同じタブで開く
//   外部リンク: https:// または http:// で始まるURL(例: https://x.com/...) … 別タブで開く(rel="noopener noreferrer")

export type InlineSegment = { kind: "text"; text: string } | { kind: "link"; text: string; href: string; external: boolean };

/** リンクのURLとして使えるか。使える場合は内部・外部の別を返す */
export function classifyLinkUrl(raw: string): { href: string; external: boolean } | null {
  const url = raw.trim();
  if (url === "" || /\s/.test(url) || url.includes("\\")) return null;
  // サイト内のパス(// で始まるものは別サイトを指すため除く)
  if (url.startsWith("/") && !url.startsWith("//")) return { href: url, external: false };
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      if ((parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.hostname) return { href: parsed.href, external: true };
    } catch {
      return null;
    }
  }
  return null;
}

// [文字](URL)。文字に [ ] と改行、URLに ( ) と空白は含めない
const LINK_RE = /\[([^[\]\n]+)\]\(([^()\s]+)\)/g;

/** 段落の文字列を、文字とリンクに分ける。使えないURLのものは書かれたとおりの文字のまま残す */
export function splitInlineLinks(paragraph: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let last = 0;
  for (const m of paragraph.matchAll(LINK_RE)) {
    const link = classifyLinkUrl(m[2]);
    if (!link) continue;
    const start = m.index ?? 0;
    if (start > last) segments.push({ kind: "text", text: paragraph.slice(last, start) });
    segments.push({ kind: "link", text: m[1], href: link.href, external: link.external });
    last = start + m[0].length;
  }
  if (last < paragraph.length) segments.push({ kind: "text", text: paragraph.slice(last) });
  return segments;
}

/** リンクにする文字として選べるか(選べない場合は理由を返す) */
export function linkTextProblem(text: string): string | null {
  if (text.trim() === "") return "リンクにする文字を本文で選択してから「リンク」を押してください。";
  if (/\r|\n/.test(text)) return "改行をまたいで選択されています。1つの段落の中の文字だけを選択してください。";
  if (/[[\]]/.test(text)) return "選択した文字に [ または ] が含まれています（すでにリンクになっている部分かもしれません）。";
  return null;
}

/** 選択した文字をリンクの形にする */
export function toLinkMarkup(text: string, href: string): string {
  // URLの ( ) は書式の区切りと紛れるため、URLとして同じ意味の %28 %29 に置き換える
  return `[${text}](${href.replace(/\(/g, "%28").replace(/\)/g, "%29")})`;
}
