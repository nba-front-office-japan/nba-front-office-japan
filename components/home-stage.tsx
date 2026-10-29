"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// トップページのステージ。開場演出の映像(1024×1024の正方形・約40秒)をブラウザ幅いっぱい・ヘッダーの下から画面の下端まで(object-cover)で見せる。
// 映像は音声なしで1回だけ自動再生し、終わったら最後のフレームを少しずつ暗くしながら、その上にコピー(children)を徐々に浮かび上がらせる。
// 「視差効果を減らす」設定の人や自動再生できない環境では、最初からコピーを表示する(再生ボタンで映像を見られる)。
// note は映像の左下に常に出す一行(DATA UPDATE)。
export function HomeStage({ children, note }: { children: ReactNode; note?: ReactNode }) {
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
      <video
        ref={videoRef}
        className="home-cinema__video"
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
      {/* 上下端だけのごく薄い陰影(ヘッダーとの境目・DATA UPDATE の読みやすさ用)。映像全体は暗くしない */}
      <div className="home-cinema__edges" />
      {/* 映像が終わった後のコピー。映像を少し暗くし、見出しの背後に柔らかい陰影を置いてから文字を浮かび上がらせる */}
      <div className={`home-cinema__copy${showCopy ? " is-visible" : ""}`}>
        <div className="home-cinema__dim" />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-7">{children}</div>
      </div>
      {note && (
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto w-full max-w-6xl px-4 pb-4 pr-40 sm:px-7 sm:pb-6 sm:pr-48">{note}</div>
        </div>
      )}
      <div className="absolute bottom-3 right-3 z-20 flex gap-2 sm:bottom-5 sm:right-5">
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
