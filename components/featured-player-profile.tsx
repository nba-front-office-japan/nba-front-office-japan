import Link from "next/link";
import type { FeaturedPlayer } from "@/lib/featured-players";
import type { SalaryPlayer } from "@/lib/salary/types";
import { SALARY_SEASONS, formatUsd } from "@/lib/salary/types";
import { formatUsdJa } from "@/lib/salary/lines";

// 有名選手の選手ページ(Profile)に出す日本語の解説: 経歴・プレースタイル・主な実績・日本との関わり・年俸・よくある質問。
// よくある質問は FAQPage の構造化データ(JSON-LD)にも出す。

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-8 border border-line bg-surface p-5 sm:p-6">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">{eyebrow}</p>
      <h2 id={id} className="mb-4 text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="space-y-3 text-sm leading-7">
      {items.map((text) => (
        <p key={text}>{text}</p>
      ))}
    </div>
  );
}

/** 年俸のよくある質問(サラリーデータに2026-27の年俸がある選手だけ) */
export function salaryFaq(featured: FeaturedPlayer, salary: SalaryPlayer | null) {
  const current = salary?.salaries[0];
  if (featured.hideSalary || current === null || current === undefined) return null;
  return {
    q: `${featured.nameJa}の年俸はいくら？`,
    a: `${SALARY_SEASONS[0]}シーズンの年俸は${formatUsd(current)}(${formatUsdJa(current)})です。`,
  };
}

export function FeaturedPlayerProfile({ featured, salary }: { featured: FeaturedPlayer; salary: SalaryPlayer | null }) {
  const salaryQa = salaryFaq(featured, salary);
  const faqs = salaryQa && !featured.faqs.some((f) => f.q.includes("年俸")) ? [salaryQa, ...featured.faqs] : featured.faqs;
  const futureSalaries = salary
    ? SALARY_SEASONS.map((season, i) => ({ season, value: salary.salaries[i] })).filter(
        (s): s is { season: (typeof SALARY_SEASONS)[number]; value: number } => s.value !== null,
      )
    : [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <Section id="featured-career" eyebrow="Career" title={`${featured.nameJa}の経歴`}>
        <p className="mb-4 text-base font-semibold leading-7">{featured.catchphrase}</p>
        <Paragraphs items={featured.career} />
      </Section>
      <Section id="featured-style" eyebrow="Play Style" title="プレースタイル・強み">
        <Paragraphs items={featured.playStyle} />
      </Section>
      <Section id="featured-achievements" eyebrow="Highlights" title="主なタイトル・実績">
        <ul className="space-y-2">
          {featured.achievements.map((a) => (
            <li key={a} className="border-l-[3px] border-gold pl-3 text-sm font-bold">
              {a}
            </li>
          ))}
        </ul>
      </Section>
      {featured.japan && featured.japan.length > 0 && (
        <Section id="featured-japan" eyebrow="Japan" title="日本との関わり">
          <Paragraphs items={featured.japan} />
        </Section>
      )}
      {!featured.hideSalary && futureSalaries.length > 0 && (
        <Section id="featured-salary" eyebrow="Salary" title="年俸・契約">
          <dl className="divide-y divide-line text-sm">
            {futureSalaries.map((s) => (
              <div key={s.season} className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
                <dt className="font-bold tabular-nums">{s.season}</dt>
                <dd className="text-right tabular-nums">
                  {formatUsd(s.value)}
                  <span className="ml-2 text-xs text-muted">{formatUsdJa(s.value)}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted">
            ほかの選手の年俸は
            <Link href="/salary/players" className="mx-1 font-semibold text-blue underline-offset-2 hover:underline">
              選手別サラリー一覧
            </Link>
            で確認できます。
          </p>
        </Section>
      )}
      <Section id="featured-faq" eyebrow="FAQ" title="よくある質問">
        <dl className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q}>
              <dt className="text-sm font-bold">Q. {f.q}</dt>
              <dd className="mt-1 text-sm leading-7">A. {f.a}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <p className="mt-3 text-xs text-muted">※ 解説は{featured.asOf}時点の情報です。</p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
