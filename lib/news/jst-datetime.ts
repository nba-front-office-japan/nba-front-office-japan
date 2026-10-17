// 記事の投稿日(article_drafts.published_at)を、管理画面で日本時間の日時として扱うための変換。
// DB には UTC の日時(timestamptz)で保存し、画面の入力欄(<input type="datetime-local">)には日本時間の
// "YYYY-MM-DDTHH:mm" で表示する。ブラウザ・サーバーのタイムゾーンに関係なく、常に UTC+9 で計算する。

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** UTC の日時(ISO)→ 日本時間の入力欄の値 "YYYY-MM-DDTHH:mm" */
export function toJstInputValue(iso: string): string {
  const d = new Date(new Date(iso).getTime() + JST_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

/** 日本時間の入力欄の値 "YYYY-MM-DDTHH:mm" → UTC の日時(ISO)。存在しない日時(2月30日など)や形式違いは null */
export function parseJstInputValue(value: string): string | null {
  const m = INPUT_RE.exec(value.trim());
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const utc = Date.UTC(y, mo - 1, d, h, mi) - JST_OFFSET_MS;
  // 繰り上がりが起きた(=存在しない日時)場合は不正として扱う
  if (toJstInputValue(new Date(utc).toISOString()) !== value.trim()) return null;
  return new Date(utc).toISOString();
}

/** 投稿日の入力値を検証する。問題があればエラー文、なければ UTC の日時(ISO) */
export function validatePublishedAtInput(value: string, now: Date = new Date()): { iso: string } | { error: string } {
  const iso = parseJstInputValue(value);
  if (!iso) return { error: "投稿日は「年/月/日 時:分」の形で、実在する日時を入力してください（日本時間）。" };
  const t = new Date(iso).getTime();
  if (t < Date.UTC(2000, 0, 1)) return { error: "投稿日が古すぎます。2000年以降の日時を入力してください。" };
  // 未来の日時は不可(1分の余裕を持たせる)
  if (t > now.getTime() + 60 * 1000) return { error: `投稿日に未来の日時は指定できません（現在：${toJstInputValue(now.toISOString()).replace("T", " ")} 日本時間）。` };
  return { iso };
}
