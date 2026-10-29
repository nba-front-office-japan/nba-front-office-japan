"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// トップページのステージ。開場演出の映像(1024×1024の正方形・約40秒)をブラウザ幅いっぱいで、上のリングボードから切らずに見せる。
// 画面の高さには合わせず、はみ出す分はスクロールで続きが見える(高さは app/globals.css の .home-cinema__screen)。
// 映像は音声なしで自動再生し、ずっとループする。最初の1回が終わるときに場面を少しずつ暗くしながら、コピー(children)を徐々に浮かび上がらせ、その後は出したままにする。
// コピーはPCでは映像の左上に重ね、スクロール中も画面の上に付いてくる(映像の下端を過ぎると一緒に流れる)。スマホでは映像の下に続けて出す。
// 再生・音声ボタンはスクロールしても常に押せるよう、画面の右下に固定する。
// 「視差効果を減らす」設定の人や自動再生できない環境では、最初からコピーを表示する(再生ボタンで映像を見られる)。
export function HomeStage({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showCopy, setShowCopy] = useState(false);

  // 最初の1回の再生が終わりに近づいたら(loop のため ended は来ない)コピーを出す
  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || showCopy || !video.duration) return;
    if (video.currentTime >= video.duration - 0.5) setShowCopy(true);
  }

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
      void video.play().catch(() => undefined);
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
          loop
          playsInline
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onError={() => setShowCopy(true)}
          aria-label="NBA Front Office Japan の開場演出の映像"
        />
        {/* 上下端だけのごく薄い陰影(ヘッダーとの境目用)。映像全体は暗くしない */}
        <div className="home-cinema__edges" />
        {/* 映像が終わった後、場面を少し暗くし、見出しの背後に柔らかい陰影を置く */}
        <div className="home-cinema__dim" />
      </div>
      <div className="home-cinema__copy">
        <div className="home-cinema__copy-inner">{children}</div>
      </div>
      <div className="home-cinema__controls">
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
