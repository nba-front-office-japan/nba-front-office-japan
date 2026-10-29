"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// トップページのステージ。開場演出の映像(1024×1024の正方形・約40秒)をブラウザ幅いっぱいで、上のリングボードから切らずに見せる。
// 画面の高さには合わせず、はみ出す分はスクロールで続きが見える(高さは app/globals.css の .home-cinema__screen)。
// 映像は音声なしで1回だけ自動再生し、終わったら最後のフレームを少しずつ暗くしながら、コピー(children)を徐々に浮かび上がらせる。
// コピーはPCでは映像の上部左側に重ね、スマホでは映像の下に続けて出す。
// 「視差効果を減らす」設定の人や自動再生できない環境では、最初からコピーを表示する(再生ボタンで映像を見られる)。
export function HomeStage({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showCopy, setShowCopy] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // 「視差効果を減らす」設定ではコピーをCSSで常に表示する(app/globals.css の .home-cinema__rise)
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
    <section className={`home-cinema__stage${showCopy ? " is-ended" : ""}`} aria-label="NBA Front Office Japan">
      <div className="home-cinema__screen">
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
        {/* 上下端だけのごく薄い陰影(ヘッダーとの境目用)。映像全体は暗くしない */}
        <div className="home-cinema__edges" />
        {/* 映像が終わった後、場面を少し暗くし、見出しの背後に柔らかい陰影を置く */}
        <div className="home-cinema__dim" />
        <div className="absolute right-3 top-3 z-20 flex gap-2 sm:right-5 sm:top-5">
          <button type="button" onClick={togglePlay} className="home-cinema__control" aria-label={playing ? "映像を一時停止" : "映像を再生"}>
            {playing ? "❚❚" : "▶"}
          </button>
          <button type="button" onClick={toggleSound} className="home-cinema__control" aria-label={muted ? "音声をオンにする" : "音声をオフにする"}>
            {muted ? "音声 OFF" : "音声 ON"}
          </button>
        </div>
      </div>
      <div className="home-cinema__copy">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-7">{children}</div>
      </div>
    </section>
  );
}
