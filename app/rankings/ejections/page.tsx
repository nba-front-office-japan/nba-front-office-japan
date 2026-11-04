import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { EjectionsTable, EjectionsTabs } from "@/components/ejections-table";
import { ACTIVE_EJECTIONS, ALL_TIME_EJECTIONS, EJECTIONS_RETRIEVED_ON } from "@/lib/ejections";

export const metadata: Metadata = {
  title: "NBA 退場回数ランキング（1997-98以降・ESPN集計） | NBA Front Office Japan",
  description:
    "NBAで通算の退場回数が多い選手のランキング。1997-98シーズン以降のESPNのキャリア統計をもとに、レギュラーシーズンとプレーオフの内訳つきで、通算と現役の2つのタブで紹介します。",
  alternates: { canonical: "/rankings/ejections" },
};

// 出典欄: 情報源の名前と取得日
function SourceLine() {
  return (
    <p className="mb-3 text-xs leading-relaxed text-muted">
      出典：ESPN（各選手のキャリア統計。選手名から各ページへ移動できます）。{EJECTIONS_RETRIEVED_ON}取得。
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

const COMMON_NOTES = [
  "回数はESPNのキャリア統計（レギュラーシーズン＋プレーオフ）の集計です。同数は同順位（T）。",
  "グリーンは、Shot Clock・NGSC Sports・CBS Sportsなどで通算31回（プレーオフ8回）と報じられていますが、ESPNの統計ではプレーオフ2回で、集計基準が異なります。",
  "Wikipediaなど、ほかの集計とは数字が異なる場合があります。",
];

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
      {/* 狭い画面では「（」の前と「・」の後ろでだけ折り返す。「1997-98」はハイフンの前後にワードジョイナーを入れて分けない */}
      <h1 className="mb-3 text-[36px] font-semibold tracking-tight [word-break:keep-all]">
        {"NBA 退場回数ランキング​（1997⁠-⁠98以降・​ESPN集計）"}
      </h1>
      <p className="mb-6 text-sm text-muted">NBAで、試合中に退場を命じられた回数が多い選手を比べました。</p>

      <EjectionsTabs
        allTime={
          <section aria-label="通算">
            <p className="mb-3 border-l-4 border-gold bg-surface px-3 py-2.5 text-sm leading-relaxed">
              ESPNの退場データは1997-98シーズン以降のみです。そのため、チャールズ・バークレー、デニス・ロッドマンなど、それ以前に活躍した選手の数字は不完全で、本表には載せていません。
            </p>
            <SourceLine />
            <EjectionsTable rows={ALL_TIME_EJECTIONS} caption="1997-98シーズン以降の通算退場回数ランキング（ESPN集計）" />
            <p className="mt-4 text-sm leading-relaxed">
              1997-98シーズン以降のESPN集計で、通算の退場回数が最も多いのは、ラシード・ウォレスの29回（レギュラーシーズン26回、プレーオフ3回）。この29回は、Wikipedia・BetMGMなど、ほかの集計でも歴代最多として一致している。現役のドレイモンド・グリーンは、2026年11月2日のサンズ戦で今季初の退場となり、ESPNの集計では通算25回で、ウォレスまであと4回に迫った。報道では31回と伝えるものもあり、数え方によって差が出る。チャールズ・バークレーなど、それより前の時代に活躍した選手は、この表では比較できない。
            </p>
            <Notes
              items={[
                ...COMMON_NOTES,
                "通算10回以上の選手を載せています。",
              ]}
            />
          </section>
        }
        active={
          <section aria-label="現役">
            <SourceLine />
            <EjectionsTable rows={ACTIVE_EJECTIONS} caption="現役選手の通算退場回数ランキング（1997-98以降・ESPN集計）" />
            <p className="mt-4 text-sm leading-relaxed">
              1997-98シーズン以降のESPN集計で、現役で通算の退場回数が最も多いのは、ドレイモンド・グリーンの25回（レギュラーシーズン23回、プレーオフ2回）。2026年11月2日のサンズ戦で、今季初の退場となった。続くのは、10月30日のナゲッツ戦で退場したディロン・ブルックスの12回、アイザイア・スチュワートの8回。
            </p>
            <Notes
              items={[
                ...COMMON_NOTES,
                `載せた人数（${ACTIVE_EJECTIONS.length}人）。2026-27シーズンのロスター入りを、NBA公式かESPNで確認できた選手のみ掲載。`,
              ]}
            />
          </section>
        }
      />
    </PageShell>
  );
}
