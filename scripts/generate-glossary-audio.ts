// NBA用語辞典(/guide/glossary)の読み上げ音声ファイルを、Google Cloud Text-to-Speech で作るスクリプト。
//
// 実行方法(PCで): npx tsx scripts/generate-glossary-audio.ts
//   ・.env.local に GOOGLE_TTS_API_KEY=(Google Cloud の APIキー) が必要。
//   ・声を変えたいときは GLOSSARY_TTS_VOICE=ja-JP-Chirp3-HD-Aoede のように指定する(未指定なら自動で選ぶ)。
//   ・--dry を付けると、APIを呼ばずに文字数と作成対象だけ表示する。
//
// 出力:
//   ・public/audio/glossary/<用語ID>.mp3
//   ・lib/glossary-audio.json(音声がある用語IDと、文章のハッシュ。画面はこれを見て音声ファイルを使う)
// 文章(lib/glossary-speech.ts の toSpeechText)と声が前回と同じ用語は作り直さない。用語を追加・修正したら、もう一度実行すればよい。
//
// 費用: Chirp 3: HD 音声は毎月100万文字まで無料(2026-11 確認。それを超えると100万文字あたり30ドル)。
// 全用語でも約3万文字なので、通常は無料枠に収まる。

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { GLOSSARY_TERMS } from "../lib/glossary-terms";
import { toSpeechText } from "../lib/glossary-speech";

const API = "https://texttospeech.googleapis.com/v1";
const OUT_DIR = path.join(process.cwd(), "public", "audio", "glossary");
const MANIFEST = path.join(process.cwd(), "lib", "glossary-audio.json");
const dry = process.argv.includes("--dry");

type Manifest = { voice: string; items: Record<string, string> };
type Voice = { name: string; ssmlGender?: string; languageCodes: string[] };

function readManifest(): Manifest {
  try {
    return JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;
  } catch {
    return { voice: "", items: {} };
  }
}

async function pickVoice(key: string): Promise<string> {
  if (process.env.GLOSSARY_TTS_VOICE) return process.env.GLOSSARY_TTS_VOICE;
  const res = await fetch(`${API}/voices?languageCode=ja-JP&key=${key}`);
  if (!res.ok) throw new Error(`声の一覧を取得できませんでした (${res.status}): ${await res.text()}`);
  const { voices = [] } = (await res.json()) as { voices?: Voice[] };
  const ja = voices.filter((v) => v.languageCodes.includes("ja-JP"));
  const female = (re: RegExp) => ja.find((v) => re.test(v.name) && v.ssmlGender === "FEMALE") ?? ja.find((v) => re.test(v.name));
  const chosen = ja.find((v) => v.name === "ja-JP-Chirp3-HD-Aoede") ?? female(/Chirp3-HD/) ?? female(/Neural2/) ?? female(/Wavenet/i) ?? ja[0];
  if (!chosen) throw new Error("日本語の声が見つかりませんでした");
  return chosen.name;
}

async function synthesize(key: string, voice: string, text: string): Promise<Buffer> {
  const res = await fetch(`${API}/text:synthesize?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // Chirp 3 は句点のない長い文を受け付けないので、「」を外して区切りを句点にして送る(画面の文章は変えない)
      input: { text: text.replace(/「/g, "").replace(/、?」/g, "。") },
      voice: { languageCode: "ja-JP", name: voice },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });
  if (!res.ok) throw new Error(`音声の作成に失敗しました (${res.status}): ${await res.text()}`);
  const { audioContent } = (await res.json()) as { audioContent: string };
  return Buffer.from(audioContent, "base64");
}

async function main() {
  const key = process.env.GOOGLE_TTS_API_KEY ?? "";
  if (!key && !dry) {
    console.error("GOOGLE_TTS_API_KEY が .env.local にありません。");
    process.exit(1);
  }
  const voice = dry && !key ? process.env.GLOSSARY_TTS_VOICE ?? "(自動選択)" : await pickVoice(key);
  const manifest = readManifest();
  const items: Record<string, string> = {};
  const todo: { id: string; text: string; hash: string }[] = [];
  let chars = 0;
  for (const t of GLOSSARY_TERMS) {
    const text = toSpeechText(t);
    const hash = createHash("sha1").update(`${voice}\n${text}`).digest("hex").slice(0, 10);
    items[t.id] = hash;
    const file = path.join(OUT_DIR, `${t.id}.mp3`);
    if (manifest.items[t.id] === hash && existsSync(file)) continue;
    todo.push({ id: t.id, text, hash });
    chars += text.length;
  }
  console.log(`声: ${voice}`);
  console.log(`用語 ${GLOSSARY_TERMS.length} 語のうち、作成するのは ${todo.length} 語(${chars.toLocaleString()} 文字)`);
  if (dry) return;

  mkdirSync(OUT_DIR, { recursive: true });
  const done: Record<string, string> = {};
  try {
    for (const [i, item] of todo.entries()) {
      const mp3 = await synthesize(key, voice, item.text);
      writeFileSync(path.join(OUT_DIR, `${item.id}.mp3`), mp3);
      done[item.id] = item.hash;
      console.log(`(${i + 1}/${todo.length}) ${item.id}.mp3  ${(mp3.length / 1024).toFixed(0)}KB`);
    }
  } finally {
    // 作成済みの用語だけを書き出す(途中で失敗しても、できた分は使えるようにする)
    const next: Manifest = { voice, items: {} };
    for (const id of Object.keys(items).sort()) {
      if (done[id] || (manifest.items[id] === items[id] && existsSync(path.join(OUT_DIR, `${id}.mp3`)))) next.items[id] = items[id];
    }
    writeFileSync(MANIFEST, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`lib/glossary-audio.json に ${Object.keys(next.items).length} 語を記録しました`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
