"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// トップページのステージ。開場演出の映像(1024×1024の正方形・約40秒)を切り抜かずに正方形のまま大きく見せる。
// PCは画面の高さいっぱい近くの正方形を中央に置き、左右は暗いグレーで埋める。スマホは横幅いっぱいの正方形。
// 映像は音声なしで1回だけ自動再生し、終わったら最後のフレームを残したまま、その上にコピー(children)をフェードインで重ねる。
// 「視差効果を減らす」設定の人や自動再生できない環境では、最初からコピーを表示する(再生ボタンで映像を見られる)。
export function HomeStage({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showCopy, setShowCopy] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // 「視差効果を減らす」設定ではコピーをCSSで常に表示する(app/globals.css の .home-cinema__copy)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.muted = true;
    void video.play().catch(() => setShowCopy(true));
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (video.ended) video.currentTime = 0;
      setShowCopy(false);
      void video.play().catch(() => setShowCopy(true));
    } else {
      video.pause();
    }
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  return (
    <section className="home-cinema__stage" aria-label="NBA Front Office Japan">
      <div className="home-cinema__frame">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-contain"
          src="/home/nba-foj-2027-intro.mp4"
          muted
          playsInline
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setShowCopy(true)}
          onError={() => setShowCopy(true)}
          aria-label="NBA Front Office Japan の開場演出の映像"
        />
        {/* 映像が終わった後のコピー。読みやすくするための薄い陰影と一緒にフェードインする */}
        <div className={`home-cinema__copy${showCopy ? " is-visible" : ""}`}>{children}</div>
        <div className="absolute bottom-3 right-3 z-10 flex gap-2 sm:bottom-5 sm:right-5">
          <button type="button" onClick={togglePlay} className="home-cinema__control" aria-label={playing ? "映像を一時停止" : "映像を再生"}>
            {playing ? "❚❚" : "▶"}
          </button>
          <button type="button" onClick={toggleSound} className="home-cinema__control" aria-label={muted ? "音声をオンにする" : "音声をオフにする"}>
            {muted ? "音声 OFF" : "音声 ON"}
          </button>
        </div>
      </div>
    </section>
  );
}
