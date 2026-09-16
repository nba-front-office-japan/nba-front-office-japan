function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export interface AttributionSource {
  title: string;
  url: string;
  mediaName: string;
  publishedAt: string | null;
}

// 下書き作成時に、原典一覧から出典表記のたたき台をMarkdownで組み立てる。
// 編集者はドラフト編集画面でそのまま調整できる。
export function buildDefaultAttribution(sources: AttributionSource[]): string {
  if (sources.length === 0) return "";
  return sources
    .map((s) => {
      const dateLabel = formatDate(s.publishedAt);
      return `- [${s.title}](${s.url})（${s.mediaName}${dateLabel ? `、${dateLabel}` : ""}）`;
    })
    .join("\n");
}
