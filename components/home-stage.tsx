"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// トップページの横長ステージ。開場演出の映像そのものを中央に大きく見せ、その上にコピー(children)を薄く重ねる。
// 映像は正方形(1024×1024)のため、横長の枠に合わせて少し上寄りで切り抜く(object-cover)。
// 自動再生は音声なし・繰り返し。右下のボタンで一時停止/再生と音声のオン/オフを切り替える。
// 「視差効果を減らす」設定の人には自動再生しない(再生ボタンで見られる)。
export function HomeStage({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.muted = true;
    void video.play().catch(() => undefined);
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted && video.paused) void video.play().catch(() => undefined);
  }

  return (
    <section className="home-cinema__stage relative isolate flex flex-col justify-end overflow-hidden" aria-label="NBA Front Office Japan">
      <video
        ref={videoRef}
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_38%]"
        src="/home/nba-foj-2027-intro.mp4"
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-label="NBA Front Office Japan の開場演出の映像"
      />
      {/* コピーを読みやすくするための薄い陰影だけ(箱は置かない) */}
      <div className="home-cinema__veil pointer-events-none absolute inset-0 -z-10" />
      <div className="relative">{children}</div>
      <div className="absolute bottom-3 right-3 z-10 flex gap-2 sm:bottom-5 sm:right-5">
        <button type="button" onClick={togglePlay} className="home-cinema__control" aria-label={playing ? "映像を一時停止" : "映像を再生"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <button type="button" onClick={toggleSound} className="home-cinema__control" aria-label={muted ? "音声をオンにする" : "音声をオフにする"}>
          {muted ? "音声 OFF" : "音声 ON"}
        </button>
      </div>
    </section>
  );
}
