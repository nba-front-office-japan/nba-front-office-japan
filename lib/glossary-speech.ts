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
    .replace(/[）)]/g, "、")
    .replace(ENGLISH_RE, (w) => ENGLISH[w.replace(/\s+/g, " ")] ?? w)
    .replace(/(\d)m(?![A-Za-z])/g, "$1メートル")
    .replace(/[%％]/g, "パーセント")
    // 括弧の置き換えなどで生じる記号の連続を整える(不自然な間をなくす)
    .replace(/、+(?=[。！？」])/g, "")
    .replace(/「、+/g, "「")
    .replace(/。、+/g, "。")
    .replace(/、{2,}/g, "、")
    .replace(/。{2,}/g, "。");
}

// 日本語の声で読むと浮いてしまう英語の表記を、カタカナの読みに置き換える(読み上げ用のみ。画面の表示は変えない)
const ENGLISH: Record<string, string> = {
  "President of Basketball Operations": "プレジデント・オブ・バスケットボール・オペレーションズ",
  "knee soreness": "ニー・ソアネス",
  "Bird Rights": "バードライツ",
  "1st Apron": "ファーストエプロン",
  "2nd Apron": "セカンドエプロン",
  Apron: "エプロン",
  "1st": "ファースト",
  "2nd": "セカンド",
  "3rd": "サード",
  Out: "アウト",
  Doubtful: "ダウトフル",
  Questionable: "クエスチョナブル",
  Probable: "プロバブル",
  Available: "アベイラブル",
  Defense: "ディフェンス",
  BONUS: "ボーナス",
  FIBA: "フィバ",
};
const ENGLISH_RE = new RegExp(
  Object.keys(ENGLISH)
    .sort((a, b) => b.length - a.length)
    .map((w) => `(?<![A-Za-z])${w.replace(/ /g, "\\s+")}(?![A-Za-z])`)
    .join("|"),
  "g",
);
