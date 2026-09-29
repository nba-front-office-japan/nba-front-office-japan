// 年齢は DB に保存せず、生年月日から「シーズンの基準日」時点で計算する。
export interface AgeReference {
  year: number;
  month: number;
  day: number;
}

// シーズンごとの基準日(10月1日)は lib/seasons.ts の ageReferenceFor(season) で作る。

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
