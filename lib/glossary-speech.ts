// NBA用語辞典の読み上げ用テキスト。
// ブラウザの読み上げ(components/glossary-dictionary.tsx)と、音声ファイルの作成(scripts/generate-glossary-audio.ts)で同じ文章を使う。
import type { GlossaryTerm } from "./glossary-terms";

// 読み上げ用に、記号や略語を読みやすい形に置き換える。
export function toSpeechText(t: GlossaryTerm): string {
  const parts = [t.yomi ?? t.term, "。", t.short];
  if (t.detail) parts.push(t.detail);
  if (t.points?.length) parts.push("覚えておきたいポイント。", ...t.points);
  if (t.watch) parts.push("観戦のときは、", t.watch);
  if (t.example) parts.push("NBAでの実例。", t.example);
  return parts
    .join("")
    .replace(/＋\/−|\+\/-/g, "プラスマイナス")
    .replace(/＆/g, "アンド")
    .replace(/3P/g, "スリーポイント")
    .replace(/eFG%/g, "実効フィールドゴール率")
    .replace(/FG%/g, "フィールドゴール成功率")
    .replace(/FT%/g, "フリースロー成功率")
    .replace(/TS%/g, "トゥルーシューティング")
    .replace(/USG%/g, "ユーセージ率")
    .replace(/PTS/g, "ピーティーエス")
    .replace(/(\d)-(\d{2})シーズン/g, "$1、$2シーズン")
    .replace(/[（(]/g, "、")
    .replace(/[）)]/g, "、");
}
