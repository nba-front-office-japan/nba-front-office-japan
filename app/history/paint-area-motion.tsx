"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type HistoryMotionFrame = { src: string; alt: string; available?: boolean };

const PAINT_AREA_FRAMES: HistoryMotionFrame[] = [
  { src: "/history/paint-motion-01.png", alt: "NBAペイントエリアの変遷。6フィート、12フィート、16フィートを比較した図" },
  { src: "/history/paint-motion-02.png", alt: "" },
  { src: "/history/paint-motion-03.png", alt: "" },
  { src: "/history/paint-motion-04.png", alt: "" },
];

// 画面内へ入った一度だけ、4枚の図を順番に切り替える。画像が未配置の枠(available: false)は空のまま表示する
export function HistoryMotion({ label, frames }: { label: string; frames: HistoryMotionFrame[] }) {
  const ref = useRef<HTMLElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasPlayed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasPlayed(true);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasPlayed]);

  return (
    <section
      ref={ref}
      className={`history-paint-motion relative aspect-[4/3] overflow-hidden ${hasPlayed ? "history-paint-motion--played" : ""}`}
      aria-label={label}
    >
      {frames.map((frame, index) =>
        frame.available === false ? null : (
          <Image
            key={frame.src}
            src={frame.src}
            alt={frame.alt}
            aria-hidden={frame.alt === "" ? true : undefined}
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className={`history-paint-motion__frame history-paint-motion__frame--${index + 1} object-cover`}
          />
        ),
      )}
    </section>
  );
}

export function PaintAreaMotion() {
  return <HistoryMotion label="NBAペイントエリアが6フィートから12フィート、16フィートへ変化する図解" frames={PAINT_AREA_FRAMES} />;
}
