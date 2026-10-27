"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function PaintAreaMotion() {
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
      aria-label="NBAペイントエリアが6フィートから12フィート、16フィートへ変化する図解"
    >
      <Image src="/history/paint-motion-01.png" alt="NBAペイントエリアの変遷。6フィート、12フィート、16フィートを比較した図" fill sizes="(min-width: 1024px) 800px, 100vw" className="history-paint-motion__frame history-paint-motion__frame--1 object-cover" />
      <Image src="/history/paint-motion-02.png" alt="" aria-hidden fill sizes="(min-width: 1024px) 800px, 100vw" className="history-paint-motion__frame history-paint-motion__frame--2 object-cover" />
      <Image src="/history/paint-motion-03.png" alt="" aria-hidden fill sizes="(min-width: 1024px) 800px, 100vw" className="history-paint-motion__frame history-paint-motion__frame--3 object-cover" />
      <Image src="/history/paint-motion-04.png" alt="" aria-hidden fill sizes="(min-width: 1024px) 800px, 100vw" className="history-paint-motion__frame history-paint-motion__frame--4 object-cover" />
    </section>
  );
}
