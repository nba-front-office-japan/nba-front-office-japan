"use client";

import { useEffect, useSyncExternalStore } from "react";

// 試合結果ページ(新聞紙風)だけの、紙面をめくる効果音。
// 音源ファイルは使わず、Web Audio でその場で作る(ノイズを帯域フィルタに通し、高い音から低い音へ流す「シャッ」という音)。
// 紙面(.np-sheet)の中のリンク・ボタンを押したときだけ鳴らす(サイトのヘッダーや他のページでは鳴らない)。
// ブラウザの自動再生の制限に掛からないよう、クリックの処理の中で鳴らす。オン/オフはこのブラウザに保存する。

const STORAGE_KEY = "foj-games-flip-sound";

let ctx: AudioContext | null = null;

function playFlip() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    const duration = 0.38;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      // 紙のこすれ: ノイズに細かなパチパチ(まれに大きな粒)を混ぜる
      const crackle = Math.random() < 0.004 ? (Math.random() * 2 - 1) * 3 : 0;
      data[i] = Math.random() * 2 - 1 + crackle;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 0.9;
    band.frequency.setValueAtTime(4200, now);
    band.frequency.exponentialRampToValueAtTime(900, now + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(band).connect(gain).connect(ctx.destination);
    source.start(now);
    source.stop(now + duration);
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
