import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { EjectionsTable, EjectionsTabs } from "@/components/ejections-table";
import { ACTIVE_EJECTIONS, ALL_TIME_EJECTIONS, EJECTIONS_AS_OF, EJECTIONS_SOURCE, GREEN_NOTE } from "@/lib/ejections";

export const metadata: Metadata = {
  title: "NBA 退場回数ランキング（通算） | NBA Front Office Japan",
  description: "NBAで通算の退場回数が多い選手のランキング。歴代と現役の2つのタブで、回数と順位を紹介します。",
  alternates: { canonical: "/rankings/ejections" },
};

function SourceLine() {
  return (
    <p className="mb-3 text-xs text-muted">
      出典：
      <a href={EJECTIONS_SOURCE.url} className="text-blue hover:underline" target="_blank" rel="noopener noreferrer">
        {EJECTIONS_SOURCE.name}「{EJECTIONS_SOURCE.title}」
      </a>
      （{EJECTIONS_AS_OF}時点）
    </p>
  );
}

function Notes({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

const COMMON_NOTES = [GREEN_NOTE, "レギュラーシーズンとプレーオフの内訳は載せていない。同数は同順位（T）。"];

export default function EjectionsPage() {
  return (
    <PageShell>
      <nav aria-label="パンくずリスト" className="mb-4 text-xs text-muted">
        <Link href="/rankings" className="hover:text-blue">
          ランキング
        </Link>
        <span aria-hidden className="mx-1.5">›</span>
        <span aria-current="page">退場回数ランキング</span>
      </nav>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Rankings · Ejections</p>
      <h1 className="mb-3 text-[36px] font-semibold tracking-tight">NBA 退場回数ランキング（通算）</h1>
      <p className="mb-6 text-sm text-muted">NBAで、試合中に退場を命じられた回数が多い選手を比べました。</p>

      <EjectionsTabs
        allTime={
          <section aria-label="歴代">
            <SourceLine />
            <EjectionsTable rows={ALL_TIME_EJECTIONS} caption="歴代の通算退場回数ランキング" />
            <p className="mt-4 text-sm leading-relaxed">
              通算の退場回数で歴代1位は、ラシード・ウォレスの29回。現役のドレイモンド・グリーンが26回で2位につけ、あと3回で並ぶ。トップ10には、チャールズ・バークレー、デニス・ロッドマン、レジー・ミラーら、闘志あふれるプレーで知られた名前も並ぶ。
            </p>
            <Notes
              items={[
                ...COMMON_NOTES,
                "Wikipediaでは現役のディロン・ブルックスも12回で9位タイとしているが、ほかの情報源で回数を確認できなかったため載せていない。",
              ]}
            />
          </section>
        }
        active={
          <section aria-label="現役">
            <SourceLine />
            <EjectionsTable rows={ACTIVE_EJECTIONS} caption="現役選手の通算退場回数ランキング" />
            <p className="mt-4 text-sm leading-relaxed">
              現役で通算の退場回数が最も多いのは、ドレイモンド・グリーンの26回。歴代1位のラシード・ウォレスまで、あと3回に迫っている。
            </p>
            <Notes
              items={[
                ...COMMON_NOTES,
                `2026-27シーズン開幕時点の現役選手のうち、2つ以上の情報源で回数を確認できた選手だけを載せている（${ACTIVE_EJECTIONS.length}人）。`,
              ]}
            />
          </section>
        }
      />
    </PageShell>
  );
}
