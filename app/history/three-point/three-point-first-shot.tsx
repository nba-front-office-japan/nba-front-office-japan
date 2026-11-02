"use client";

import { useEffect, useRef } from "react";

// 1979年のNBA初の3ポイントの映像。画面内へ入った一度だけ再生し、最後のコマで止める
export function ThreePointFirstShot({ src, label, caption }: { src: string; label: string; caption: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          if (Number.isFinite(video.duration)) video.currentTime = video.duration;
          return;
        }
        void video.play().catch(() => {});
      },
      { threshold: 0.5 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <figure className="history-story__media history-story__media--natural">
      {/* #t で読み込み時に最初のコマを表示する(黒い枠に見せない) */}
      <video ref={ref} src={`${src}#t=0.001`} aria-label={label} muted playsInline preload="auto" disablePictureInPicture className="block h-auto w-full" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
