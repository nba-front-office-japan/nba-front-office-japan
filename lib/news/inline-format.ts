// 記事本文の見出し・太字(管理画面の「見出し」「太字」ボタンで入れる書式)。
// 本文には Markdown の一部の書式のまま保存する(生のHTMLは使わない):
//   見出し: 行の先頭の「## 」(例: ## ホーネッツ、コンノートンをウェイブ)
//   太字  : **文字**(1行の中だけ。例: **15人**)
// 公開ページ・プレビューでは、行の先頭の「## 」の行を見出し、** で囲んだ文字を太字として表示する。
// それ以外の記号(# の数が違う行、閉じていない ** など)は、書かれたとおりの文字のまま表示する。

/** 行の先頭の「## 」(## の後に半角または全角の空白) */
const HEADING_RE = /^##[ 　]+/;
/** **文字**(* と改行を含まない) */
const BOLD_RE = /\*\*([^*\n]+?)\*\*/g;

export type FormattedLine = { heading: boolean; parts: { bold: boolean; text: string }[] };

/** 本文の文字の部分を、行ごとに見出しかどうかと、太字の部分・通常の部分に分ける(改行は含まない) */
export function formatLines(text: string): FormattedLine[] {
  return text.split("\n").map((line) => {
    const heading = HEADING_RE.test(line);
    const body = heading ? line.replace(HEADING_RE, "") : line;
    const parts: { bold: boolean; text: string }[] = [];
    let last = 0;
    for (const m of body.matchAll(BOLD_RE)) {
      if (m.index > last) parts.push({ bold: false, text: body.slice(last, m.index) });
      parts.push({ bold: true, text: m[1] });
      last = m.index + m[0].length;
    }
    if (last < body.length) parts.push({ bold: false, text: body.slice(last) });
    return { heading, parts };
  });
}

export function isHeadingLine(line: string): boolean {
  return HEADING_RE.test(line);
}

/** 見出しの「## 」を外した行 */
export function stripHeading(line: string): string {
  return line.replace(HEADING_RE, "");
}
