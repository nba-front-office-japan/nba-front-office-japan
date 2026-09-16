import type {
  ArticleType,
  ArticleDraftStatus,
  NewsEventCategory,
  VerificationStatus,
} from "@/lib/supabase/types";

export const CATEGORY_OPTIONS: { value: NewsEventCategory; label: string }[] = [
  { value: "breaking", label: "Breaking" },
  { value: "trade", label: "Trade" },
  { value: "free_agency", label: "Free Agency" },
  { value: "contract", label: "Contract" },
  { value: "injury", label: "Injury" },
  { value: "rumor", label: "Rumor" },
  { value: "interview", label: "Interview" },
  { value: "transaction", label: "Transaction" },
  { value: "analysis", label: "Analysis" },
  { value: "other", label: "Other" },
];

export const VERIFICATION_STATUS_OPTIONS: {
  value: VerificationStatus;
  label: string;
}[] = [
  { value: "official", label: "公式発表（official）" },
  { value: "confirmed_by_multiple_sources", label: "複数ソースで確認（confirmed）" },
  { value: "single_source", label: "単独ソース（single_source）" },
  { value: "rumor", label: "噂（rumor）" },
  { value: "unverified", label: "未確認（unverified）" },
];

export const ARTICLE_TYPE_OPTIONS: { value: ArticleType; label: string }[] = [
  { value: "breaking", label: "Breaking" },
  { value: "standard", label: "Standard" },
  { value: "deep_dive", label: "Deep Dive" },
];

export const ARTICLE_DRAFT_STATUS_LABEL: Record<ArticleDraftStatus, string> = {
  pending_review: "承認待ち",
  approved: "承認済み",
  published: "公開済み",
  rejected: "却下",
};

export const ARTICLE_DRAFT_STATUS_BADGE_CLASS: Record<ArticleDraftStatus, string> = {
  pending_review:
    "bg-[#fff0d9] text-[#ac6811] dark:bg-amber-950 dark:text-amber-200",
  approved: "bg-[#eaf1ff] text-[#2457b7] dark:bg-blue-950 dark:text-blue-200",
  published: "bg-[#e9f7f1] text-[#186b4f] dark:bg-emerald-950 dark:text-emerald-200",
  rejected: "bg-[#fde8e8] text-[#b0392f] dark:bg-red-950 dark:text-red-300",
};

// verification_statusがrumor/unverified、またはreliability_scoreが70未満の場合は
// 「未確定情報」として管理画面で警告ラベルを出す。
export function isLowConfidence(
  verificationStatus: VerificationStatus,
  reliabilityScore: number
): boolean {
  return (
    verificationStatus === "rumor" ||
    verificationStatus === "unverified" ||
    reliabilityScore < 70
  );
}

// 公開ページ用：reliability_scoreを見せない代わりに検証状態だけで判定する。
export function isRumorOrUnverified(verificationStatus: VerificationStatus): boolean {
  return verificationStatus === "rumor" || verificationStatus === "unverified";
}

export function isSingleSource(verificationStatus: VerificationStatus): boolean {
  return verificationStatus === "single_source";
}

// rumor/unverifiedの赤バッジより目立たせない、注意喚起程度の控えめなバッジ。
export const SINGLE_SOURCE_BADGE_CLASS =
  "border border-line text-[11px] font-bold text-muted px-1.5 py-1";

// 確認済み事実メモの最大文字数。入力欄のmaxLengthとサーバー側バリデーションで
// 同じ値を使う。
export const VERIFIED_FACTS_NOTES_MAX_LENGTH = 4000;
