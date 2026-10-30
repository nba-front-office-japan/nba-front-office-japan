"use client";

import { useEffect, useSyncExternalStore } from "react";

// 試合結果ページ(新聞紙風)だけの、紙面をめくる効果音。
// 音源は public/games/sounds/page-turn-1〜3.mp3(各約5KB・0.6秒。出典とライセンスは同じフォルダの LICENSE.txt)。
// 毎回ちがう音(3種類)を順に鳴らし、同じ音が続かないようにする。
// 紙面(.np-sheet)の中のリンク・ボタンを押したときだけ鳴らす(サイトのヘッダーや他のページでは鳴らない)。
// ブラウザの自動再生の制限に掛からないよう、クリックの処理の中で鳴らす。オン/オフはこのブラウザに保存する。

const STORAGE_KEY = "foj-games-flip-sound";
const SOURCES = ["/games/sounds/page-turn-1.mp3", "/games/sounds/page-turn-2.mp3", "/games/sounds/page-turn-3.mp3"];
const VOLUME = 0.45;

let ctx: AudioContext | null = null;
let raw: Promise<ArrayBuffer[]> | null = null;
let decoded: Promise<AudioBuffer[]> | null = null;
let last = -1;

/** 音源ファイルを先に読み込んでおく(再生の準備だけ。音は出さない) */
function prefetch() {
  raw ??= Promise.all(SOURCES.map((src) => fetch(src).then((res) => res.arrayBuffer())));
  return raw;
}

function playFlip() {
  try {
    ctx ??= new AudioContext();
    const audio = ctx;
    if (audio.state === "suspended") void audio.resume();
    // decodeAudioData は渡したデータを使い切るので、複製してから渡す
    decoded ??= prefetch().then((buffers) => Promise.all(buffers.map((b) => audio.decodeAudioData(b.slice(0)))));
    void decoded
      .then((buffers) => {
        let i = Math.floor(Math.random() * buffers.length);
        if (i === last) i = (i + 1) % buffers.length;
        last = i;
        const source = audio.createBufferSource();
        source.buffer = buffers[i];
        source.playbackRate.value = 0.96 + Math.random() * 0.08;
        const gain = audio.createGain();
        gain.gain.value = VOLUME;
        source.connect(gain).connect(audio.destination);
        source.start();
      })
      .catch(() => {
        decoded = null;
      });
  } catch {
    // 音が出せない環境では何もしない
  }
}

const listeners = new Set<() => void>();

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return memoryEnabled;
  }
}

// 保存できない環境(プライベートモードなど)でも、このページの間は切り替わるようにする
let memoryEnabled = true;

function writeEnabled(next: boolean) {
  memoryEnabled = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // 保存できなくても memoryEnabled で切り替わる
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function PageFlipSound() {
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => true);

  useEffect(() => {
    if (!enabled) return;
    void prefetch().catch(() => {
      raw = null;
    });
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const control = target?.closest("a, button");
      if (!control || !control.closest(".np-sheet") || control.hasAttribute("data-flip-toggle")) return;
      playFlip();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [enabled]);

  function toggle() {
    const next = !enabled;
    writeEnabled(next);
    if (next) playFlip();
  }

  return (
    <button
      type="button"
      data-flip-toggle
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "紙をめくる効果音をオフにする" : "紙をめくる効果音をオンにする"}
      className="ml-auto whitespace-nowrap border border-white/50 px-2 py-0.5 text-[11px] font-bold text-white/90 hover:bg-white/10 sm:ml-0"
    >
      {enabled ? "効果音 ON" : "効果音 OFF"}
    </button>
  );
}
