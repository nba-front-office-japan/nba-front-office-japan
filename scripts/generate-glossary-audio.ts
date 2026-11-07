// NBA用語辞典(/guide/glossary)の読み上げ音声ファイルを、Google Cloud Text-to-Speech で作るスクリプト。
//
// 実行方法(PCで): npx tsx scripts/generate-glossary-audio.ts
//   ・.env.local に GOOGLE_TTS_API_KEY=(Google Cloud の APIキー) が必要。
//   ・--dry を付けると、APIを呼ばずに文字数と作成対象だけ表示する。
//
// 「ゆっくり」「ふつう」で声と速さを変え、2セット作る(下の MODES。2026-11 に聞き比べて決定)。
// 出力:
//   ・public/audio/glossary/<slow|normal>/<用語ID>.mp3
//   ・lib/glossary-audio.json(モードごとの声・速さと、音声がある用語IDのハッシュ。画面はこれを見て音声ファイルを使う)
// 文章(lib/glossary-speech.ts の toSpeechText)・声・速さが前回と同じ用語は作り直さない。用語を追加・修正したら、もう一度実行すればよい。
//
// 費用: Chirp 3: HD 音声は毎月100万文字まで無料(2026-11 確認。それを超えると100万文字あたり30ドル)。
// 全用語・2セットでも約6万文字なので、通常は無料枠に収まる。

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { GLOSSARY_TERMS } from "../lib/glossary-terms";
import { toSpeechText } from "../lib/glossary-speech";

const API = "https://texttospeech.googleapis.com/v1";
const AUDIO_DIR = path.join(process.cwd(), "public", "audio", "glossary");
const MANIFEST = path.join(process.cwd(), "lib", "glossary-audio.json");
const dry = process.argv.includes("--dry");

type Mode = "slow" | "normal";
const MODES: Record<Mode, { voice: string; rate: number }> = {
  slow: { voice: "ja-JP-Chirp3-HD-Kore", rate: 1.0 },
  normal: { voice: "ja-JP-Chirp3-HD-Orus", rate: 1.1 },
};

type ModeManifest = { voice: string; rate: number; items: Record<string, string> };
type Manifest = Record<Mode, ModeManifest>;

function readManifest(): Partial<Manifest> {
  try {
    return JSON.parse(readFileSync(MANIFEST, "utf8")) as Partial<Manifest>;
  } catch {
    return {};
  }
}

async function synthesize(key: string, voice: string, rate: number, text: string): Promise<Buffer> {
  const res = await fetch(`${API}/text:synthesize?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // Chirp 3 は句点のない長い文を受け付けないので、「」を外して区切りを句点にして送る(画面の文章は変えない)
      input: { text: text.replace(/「/g, "").replace(/、?」/g, "。") },
      voice: { languageCode: "ja-JP", name: voice },
      audioConfig: { audioEncoding: "MP3", speakingRate: rate },
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
  const old = readManifest();
  const next = {} as Manifest;
  for (const mode of Object.keys(MODES) as Mode[]) next[mode] = { ...MODES[mode], items: {} };

  // 作成済みの用語だけを書き出す(途中で失敗しても、できた分は使えるようにする)
  const save = () => {
    writeFileSync(MANIFEST, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`lib/glossary-audio.json: ${(Object.keys(MODES) as Mode[]).map((m) => `${m} ${Object.keys(next[m].items).length}語`).join("、")}`);
  };

  try {
    for (const mode of Object.keys(MODES) as Mode[]) {
      const { voice, rate } = MODES[mode];
      const dir = path.join(AUDIO_DIR, mode);
      const prev = old[mode]?.items ?? {};
      const todo: { id: string; text: string; hash: string }[] = [];
      let chars = 0;
      for (const t of GLOSSARY_TERMS) {
        const text = toSpeechText(t);
        const hash = createHash("sha1").update(`${voice}\n${rate}\n${text}`).digest("hex").slice(0, 10);
        if (prev[t.id] === hash && existsSync(path.join(dir, `${t.id}.mp3`))) next[mode].items[t.id] = hash;
        else {
          todo.push({ id: t.id, text, hash });
          chars += text.length;
        }
      }
      console.log(`[${mode}] 声: ${voice} 速さ: ${rate} / 用語 ${GLOSSARY_TERMS.length} 語のうち、作成するのは ${todo.length} 語(${chars.toLocaleString()} 文字)`);
      if (dry) continue;
      mkdirSync(dir, { recursive: true });
      for (const [i, item] of todo.entries()) {
        const mp3 = await synthesize(key, voice, rate, item.text);
        writeFileSync(path.join(dir, `${item.id}.mp3`), mp3);
        next[mode].items[item.id] = item.hash;
        console.log(`[${mode}] (${i + 1}/${todo.length}) ${item.id}.mp3  ${(mp3.length / 1024).toFixed(0)}KB`);
      }
    }
  } finally {
    if (!dry) {
      for (const mode of Object.keys(MODES) as Mode[]) {
        next[mode].items = Object.fromEntries(Object.entries(next[mode].items).sort(([a], [b]) => a.localeCompare(b)));
      }
      save();
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
