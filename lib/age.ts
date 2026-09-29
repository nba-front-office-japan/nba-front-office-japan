// 年齢は DB に保存せず、生年月日から「シーズンの基準日」時点で計算する。
export interface AgeReference {
  year: number;
  month: number;
  day: number;
}

// 2025-26 シーズンの基準日(2025年10月1日)。2025-26 チーム記録(/teams/[teamId])で使う。
export const AGE_REFERENCE_2025_26: AgeReference = { year: 2025, month: 10, day: 1 };
// 2026-27 シーズンの基準日(2026年10月1日)。選手名鑑 2026(/players/guide/[teamId])で使う。
export const AGE_REFERENCE_2026_27: AgeReference = { year: 2026, month: 10, day: 1 };

// "YYYY-MM-DD" の生年月日から、基準日時点の満年齢を返す。生年月日が無い・不正なら null。
export function ageAt(birthDate: string | null, reference: AgeReference): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  let age = reference.year - y;
  if (m > reference.month || (m === reference.month && d > reference.day)) {
    age -= 1;
  }
  return age;
}
