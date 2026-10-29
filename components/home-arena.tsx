"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";

type HomeNews = {
  href: string;
  headline: string;
  summary: string | null;
} | null;

type HomeAnnouncement = {
  href: string;
  title: string;
  date: string;
} | null;

type HomeArenaProps = {
  featured: HomeNews;
  announcement: HomeAnnouncement;
};

const INTRO_SEEN_KEY = "foj-home-arena-intro-v1";

export function HomeArena({ featured, announcement }: HomeArenaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"loading" | "intro" | "home">("loading");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    setPhase(window.localStorage.getItem(INTRO_SEEN_KEY) === "seen" ? "home" : "intro");
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || phase !== "home") return;

    video.muted = true;
    video.loop = true;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  }, [phase]);

  function finishIntro() {
    window.localStorage.setItem(INTRO_SEEN_KEY, "seen");
    setIsStarting(false);
    setPhase("home");
  }

  function playIntro() {
    const video = videoRef.current;
    if (!video) return;

    setPhase("intro");
    setIsStarting(true);
    video.loop = false;
    video.muted = false;
    video.currentTime = 0;
    void video.play().catch(() => setIsStarting(false));
  }

  if (phase === "loading") {
    return <div className="min-h-[560px] rounded-2xl bg-navy" aria-busy="true" />;
  }

  return (
    <section className="relative isolate min-h-[min(760px,calc(100dvh-12rem))] overflow-hidden rounded-2xl border border-[#6d4c1b] bg-[#140909] text-white shadow-[0_28px_70px_rgba(14,4,2,0.4)]">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-center"
        src="/home/nba-foj-2027-intro.mp4"
        playsInline
        preload="metadata"
        onEnded={finishIntro}
        aria-label="NBA Front Office Japan の開場演出"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(5,10,21,0.7)_0%,rgba(5,10,21,0.35)_46%,rgba(5,10,21,0.48)_100%)]" />

      {phase === "intro" ? (
        <div className="relative z-10 flex min-h-[min(760px,calc(100dvh-12rem))] items-end justify-center p-5 pb-10 sm:p-10 sm:pb-14">
          <div className="max-w-md rounded-2xl border border-[#f3c66d]/70 bg-[#071324]/75 p-5 text-center shadow-2xl backdrop-blur-md sm:p-6">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#f3c66d]">Opening Show</p>
            <p className="mt-2 text-sm leading-6 text-white/85">音声ありの開場演出を再生します。</p>
            <button
              type="button"
              onClick={playIntro}
              disabled={isStarting}
              className="mt-4 w-full rounded-xl bg-[#f3b83f] px-5 py-3 text-sm font-extrabold text-[#101827] transition hover:scale-[1.03] active:scale-[0.96] disabled:opacity-70"
            >
              {isStarting ? "再生中…" : "開場演出を始める"}
            </button>
            <button
              type="button"
              onClick={finishIntro}
              className="mt-3 text-xs font-bold text-white/70 underline decoration-white/40 underline-offset-4 hover:text-white"
            >
              今はスキップする
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 grid min-h-[min(760px,calc(100dvh-12rem))] grid-cols-1 content-center gap-5 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(310px,0.7fr)] lg:gap-8 lg:p-10">
          <div className="rounded-2xl border border-[#f3c66d]/75 bg-[#061326]/65 p-6 shadow-2xl backdrop-blur-md sm:p-9">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#f3c66d]">NBA Front Office Japan</p>
            <h1 className="mt-4 max-w-3xl font-serif text-[clamp(2.35rem,5.1vw,5.2rem)] font-semibold leading-[1.16] tracking-tight text-[#fffaf0]">
              勝敗の裏側にある、<br />
              フロントオフィスの<br className="sm:hidden" />意思決定を読む。
            </h1>
            <div className="mt-6 h-px w-24 bg-[#f3c66d]" />
            <p className="mt-6 max-w-xl text-[15px] leading-8 text-white/90 sm:text-base">
              契約、トレード、ロスター構築を、ニュースだけで終わらせない。NBAをGMの視点から深掘りするデータベース。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/news" className="rounded-xl bg-[#f3b83f] px-5 py-3 text-sm font-extrabold text-[#101827] transition hover:scale-[1.04] active:scale-[0.96]">
                NEWSを読む →
              </Link>
              <Link href="/teams" className="rounded-xl border border-white/40 bg-[#071324]/45 px-5 py-3 text-sm font-extrabold text-white transition hover:scale-[1.04] hover:bg-white/15 active:scale-[0.96]">
                チームDBを見る →
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <HomeInfoCard label="注目ニュース" href={featured?.href ?? "/news"}>
              {featured ? (
                <>
                  <p className="mt-3 text-lg font-bold leading-7 text-white">{featured.headline}</p>
                  {featured.summary && <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/75">{featured.summary}</p>}
                </>
              ) : (
                <p className="mt-3 text-sm leading-6 text-white/75">公開中のニュースはありません。</p>
              )}
            </HomeInfoCard>
            <HomeInfoCard label="お知らせ" href={announcement?.href ?? "/announcements"}>
              {announcement ? (
                <>
                  <p className="mt-3 text-xs text-[#f3c66d]">{announcement.date}</p>
                  <p className="mt-1 text-lg font-bold leading-7 text-white">{announcement.title}</p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-6 text-white/75">現在、お知らせはありません。</p>
              )}
            </HomeInfoCard>
            <HomeInfoCard label="Introduction" href="/guide/introduction">
              <p className="mt-3 text-lg font-bold leading-7 text-white">NBAは、試合だけ見ていては半分しか分からない。</p>
            </HomeInfoCard>
            <button
              type="button"
              onClick={playIntro}
              className="self-end px-2 py-1 text-xs font-bold text-white/65 underline decoration-white/40 underline-offset-4 transition hover:text-white"
            >
              開場演出をもう一度見る
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function HomeInfoCard({ label, href, children }: { label: string; href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[#f3c66d]/75 bg-[#061326]/65 p-5 shadow-xl backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:bg-[#061326]/80 hover:shadow-2xl active:translate-y-1 active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="font-serif text-2xl font-semibold text-[#fffaf0]">{label}</p>
        <span aria-hidden="true" className="text-3xl font-light text-[#f3c66d] transition group-hover:translate-x-1">›</span>
      </div>
      <div className="mt-3 h-px w-16 bg-[#f3c66d]" />
      {children}
    </Link>
  );
}
