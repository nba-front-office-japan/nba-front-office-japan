import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/components/page-shell";
import { BackToGuide, GuideHeader, GuideTitle } from "@/components/guide-article";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WORKS, WORK_CATEGORIES, type Work, type WorkLink, type WorkPlayer } from "@/lib/watch-read";
import { fetchWorkPlayerHrefs } from "@/lib/watch-read-links";

// 選手ページのIDはDBから引くので、動画一覧(/videos)と同じくリクエストごとに表示する
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "観る・読むNBA｜NBAのドキュメンタリー・映画・本 | NBAガイド | NBA Front Office Japan",
  description:
    "NBAをもっと楽しむためのドキュメンタリー・映画・本を47本まとめました。ラストダンス、スペース・ジャム、ハッスル、コービーの『マンバ・メンタリティー』など、出演・関連する選手のページへのリンク付き。",
  alternates: { canonical: "/guide/watch-read" },
};

// 作品データ・配信リンクはすべて lib/watch-read.ts。このページは並べて表示するだけ。

/** 紹介文の中の選手名(最初に出てきた箇所)を、選手ページ/レジェンドページへのリンクにする */
function LinkedText({ text, players, hrefs }: { text: string; players: WorkPlayer[]; hrefs: Record<string, string> }) {
  const targets = players
    .filter((p) => hrefs[p.ja])
    .map((p) => ({ p, at: text.indexOf(p.ja) }))
    .filter((t) => t.at >= 0)
    .sort((a, b) => a.at - b.at);
  const parts: ReactNode[] = [];
  let pos = 0;
  for (const { p, at } of targets) {
    if (at < pos) continue;
    parts.push(text.slice(pos, at));
    parts.push(
      <Link key={p.ja} href={hrefs[p.ja]} className="font-semibold text-blue underline underline-offset-4 hover:no-underline">
        {p.ja}
      </Link>,
    );
    pos = at + p.ja.length;
  }
  parts.push(text.slice(pos));
  return <>{parts}</>;
}

/** 配信・購入リンクのボタン(リンクのURLは lib/watch-read.ts でまとめて管理) */
function WatchLinks({ links, note, className = "" }: { links: WorkLink[]; note?: string; className?: string }) {
  return (
    <span className={`flex flex-wrap items-center gap-2 text-[13px] ${className}`}>
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="selection-button selection-blue inline-flex items-center gap-1 rounded-lg border border-blue px-2.5 py-1 font-bold text-blue"
        >
          {l.label}で見る
          <span aria-hidden>↗</span>
        </a>
      ))}
      {note && <span className="text-muted">{note}</span>}
    </span>
  );
}

function WorkItem({ work, hrefs }: { work: Work; hrefs: Record<string, string> }) {
  const meta = [work.year, work.credit].filter(Boolean).join("／");
  return (
    <li id={work.id} className="scroll-mt-20 border border-line border-l-4 border-l-gold bg-surface px-4 py-3.5 sm:px-5">
      <h3 className="text-[16px] font-bold leading-snug">
        {work.title}
        {meta && <span className="ml-2 text-[12px] font-semibold text-muted tabular-nums">（{meta}）</span>}
      </h3>
      <p className="mt-1.5 text-sm leading-7">
        <LinkedText text={work.intro} players={work.players ?? []} hrefs={hrefs} />
      </p>
      {work.episodes && (
        <ul className="mt-2 space-y-1.5 border-t border-line pt-2 text-sm leading-6">
          {work.episodes.map((e) => (
            <li key={e.title} className="flex gap-2">
              <span aria-hidden className="mt-[9px] h-1.5 w-1.5 flex-none bg-gold" />
              <span>
                <span className="font-bold">{e.title}</span>：<LinkedText text={e.intro} players={e.players ?? []} hrefs={hrefs} />
                {e.links && <WatchLinks links={e.links} className="mt-1.5" />}
              </span>
            </li>
          ))}
        </ul>
      )}
      {(work.links || work.availability) && (
        <WatchLinks links={work.links ?? []} note={work.availability} className="mt-2.5" />
      )}
    </li>
  );
}

export default async function WatchReadPage() {
  const hrefs = await fetchWorkPlayerHrefs(createServerSupabaseClient()).catch(() => ({}) as Record<string, string>);

  return (
    <PageShell>
      <GuideHeader category="観る・読む" current="観る・読むNBA" />
      <GuideTitle subject="観る・読むNBA" suffix="" />
      <p className="mb-6 max-w-3xl text-sm leading-7 text-muted">
        NBAをもっと楽しむための、ドキュメンタリー・映画・本を{WORKS.length}本まとめました。選手名をクリックすると、その選手のページに移れます。
        配信先は掲載時点のものです。
      </p>

      <nav aria-label="カテゴリー" className="mb-8 flex flex-wrap gap-2">
        {WORK_CATEGORIES.map((c) => (
          <a
            key={c.key}
            href={`#${c.key}`}
            className="selection-button selection-blue rounded-lg border border-line px-3 py-1.5 text-sm font-bold text-foreground hover:text-blue"
          >
            {c.label}
            <span className="ml-1.5 text-[12px] font-semibold text-muted tabular-nums">{WORKS.filter((w) => w.category === c.key).length}</span>
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        {WORK_CATEGORIES.map((c) => {
          const works = WORKS.filter((w) => w.category === c.key);
          return (
            <section key={c.key} id={c.key} aria-labelledby={`${c.key}-heading`} className="scroll-mt-20">
              <div className="mb-3 border-b-2 border-foreground pb-2">
                <h2 id={`${c.key}-heading`} className="flex items-baseline gap-2 text-xl font-semibold tracking-tight">
                  {c.label}
                  <span className="text-[13px] font-bold text-muted tabular-nums">{works.length}本</span>
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">{c.description}</p>
              </div>
              <ul className="grid gap-3 lg:grid-cols-2">
                {works.map((w) => (
                  <WorkItem key={w.id} work={w} hrefs={hrefs} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <BackToGuide />
    </PageShell>
  );
}
