"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type LineMotionFrame = { src: string; alt: string; label: string; description: string; available: boolean };

const FRAME_MS = 4500;

// 第2回専用。画面内へ入ると4.5秒ごとに進み、最後の図で止まる。ボタンや図を操作した後は手動だけになる
export function ThreePointLineMotion({ label, frames }: { label: string; frames: LineMotionFrame[] }) {
  const ref = useRef<HTMLElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [manual, setManual] = useState(false);
  const last = frames.length - 1;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(true);
      },
      { threshold: 0.35 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || manual || active >= last) return;
    const timer = window.setTimeout(() => setActive(active + 1), FRAME_MS);
    return () => window.clearTimeout(timer);
  }, [active, last, manual, playing]);

  function show(index: number) {
    setManual(true);
    setActive(index);
  }

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (index + (event.key === "ArrowRight" ? 1 : frames.length - 1)) % frames.length;
    show(next);
    buttons.current[next]?.focus();
  }

  return (
    <>
      <section ref={ref} className="history-paint-motion relative aspect-[4/3] overflow-hidden" aria-label={label}>
        <button type="button" className="history-line-motion__stage" aria-label={`${frames[active].description}。押すと次の図へ進みます`} onClick={() => show((active + 1) % frames.length)}>
          {frames.map((frame, index) =>
            frame.available ? (
              <Image
                key={frame.src}
                src={frame.src}
                alt={index === active ? frame.alt : ""}
                fill
                sizes="(min-width: 1024px) 800px, 100vw"
                className={`history-line-motion__frame object-cover ${index === active ? "history-line-motion__frame--active" : ""}`}
              />
            ) : null,
          )}
        </button>
      </section>
      <div role="group" aria-label="図の切り替え" className="history-line-motion__controls">
        {frames.map((frame, index) => (
          <button
            key={frame.src}
            ref={(element) => { buttons.current[index] = element; }}
            type="button"
            aria-label={frame.description}
            aria-pressed={index === active}
            onClick={() => show(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {frame.label}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{frames[active].alt}</p>
    </>
  );
}
