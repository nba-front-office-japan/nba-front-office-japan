"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// 映像が終わってから最初に戻すまで、最後のコマで止めておく時間
const END_HOLD_MS = 4000;
// コピーを浮かび上がらせ始める、映像の終わりからの秒数(浮かび上がりは約5秒かかり、終わる約2秒前に出し終える)
const COPY_LEAD_SECONDS = 7;

// トップページのステージ。開場演出の映像(1024×1024の正方形・約40秒)をブラウザ幅いっぱいで、上のリングボードから切らずに見せる。
// 画面の高さには合わせず、はみ出す分はスクロールで続きが見える(高さは app/globals.css の .home-cinema__screen)。
// 映像は音声なしで自動再生し、終わったら最後のコマで約4秒止めてから最初に戻して繰り返す(一時停止中は勝手に再開しない)。
// 最初の1回の終わる約2秒前までに、場面を少しずつ暗くしながらコピー(children)を浮かび上がらせ終え、その後は出したままにする。
// コピーはPCでは映像の左上に重ね、スクロール中も画面の上に付いてくる(映像の下端を過ぎると一緒に流れる)。スマホでは映像の下に続けて出す。
// 再生・音声ボタンはスクロールしても常に押せるよう、画面の右下に固定する。
// 「視差効果を減らす」設定の人や自動再生できない環境では、最初からコピーを表示する(再生ボタンで映像を見られる)。
export function HomeStage({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showCopy, setShowCopy] = useState(false);
  // 終わった後の静止中に、最初に戻して再生し直すタイマー
  const holdTimer = useRef<number | null>(null);

  function clearHold() {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function restart() {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  }

  // 最初の1回の終わりが近づいたらコピーを出す
  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || showCopy || !video.duration) return;
    if (video.currentTime >= video.duration - COPY_LEAD_SECONDS) setShowCopy(true);
  }

  // 終わったら最後のコマで止めておき、一定時間後に最初から再生する(静止中もボタンは「一時停止」表示のまま)
  function handleEnded() {
    setShowCopy(true);
    clearHold();
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      restart();
    }, END_HOLD_MS);
    setPlaying(true);
  }

  useEffect(() => clearHold, []);

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
    if (holdTimer.current !== null) {
      // 終わった後の静止中に止めたら、再開タイマーを止めて最後のコマのままにする
      clearHold();
      setPlaying(false);
    } else if (video.ended) {
      restart();
    } else if (video.paused) {
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
          playsInline
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => {
            if (!videoRef.current?.ended) setPlaying(false);
          }}
          onEnded={handleEnded}
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
