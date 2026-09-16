import { PageShell } from "@/components/page-shell";

const FEATURES = [
  "Advanced Stats の全指標",
  "Contract Database",
  "Trade Machine",
  "GM Reports",
  "Salary Analysis",
];

export default function PremiumPage() {
  return (
    <PageShell>
      <div className="bg-navy p-8 text-center text-white sm:p-11">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-[#84b0ff]">
          Membership
        </p>
        <h1
          className="text-3xl font-semibold sm:text-4xl"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          NBA Front Office Membership
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-300">
          ニュースを読むだけでなく、意思決定の背景まで理解する。
        </p>
        <p className="mt-6 text-[40px] font-black">月額 1,980円</p>
        <p className="text-xs text-slate-400">いつでも解約可能</p>
        <ul className="mx-auto mt-6 max-w-[360px] space-y-2 text-left text-sm leading-6">
          {FEATURES.map((feature) => (
            <li key={feature}>・{feature}</li>
          ))}
        </ul>
        <button
          disabled
          className="mt-6 cursor-not-allowed bg-gold/50 px-5 py-3 text-sm font-extrabold text-[#182238]/60"
        >
          Premiumを始める（準備中）
        </button>
        <p className="mt-3 text-xs text-slate-400">
          決済機能は現在準備中です。実装までしばらくお待ちください。
        </p>
      </div>
    </PageShell>
  );
}
