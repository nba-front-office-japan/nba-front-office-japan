// レジェンドの成績計算(型と計算だけ。JSONは読まないので、画面の部品(クライアント)からも使える)
// 記録が無い項目は null。通算の1試合平均は「その項目が記録されているシーズンの試合数」で割る。

export type LegendStatLine = {
  gp: number | null;
  gs: number | null;
  min: number | null;
  fgm: number | null;
  fga: number | null;
  fg3m: number | null;
  fg3a: number | null;
  ftm: number | null;
  fta: number | null;
  oreb: number | null;
  dreb: number | null;
  reb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
  tov: number | null;
  pf: number | null;
  pts: number | null;
};

export type LegendSeasonRow = LegendStatLine & {
  season: number;
  team: string;
  isTotal: boolean;
  age: number | null;
};

export type LegendAwardRow = {
  description: string | null;
  season: number | null;
  allNbaTeam: number | null;
  type: string | null;
  month: string | null;
  week: string | null;
};

export type Legend = {
  slug: string;
  personId: number;
  name: string;
  nameJa: string;
  greatest50: boolean;
  greatest75: boolean;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  position: string | null;
  school: string | null;
  country: string | null;
  fromYear: number | null;
  toYear: number | null;
  draftYear: number | null;
  draftRound: number | null;
  draftNumber: number | null;
  isActive: boolean;
  regularSeason: LegendSeasonRow[];
  playoffs: LegendSeasonRow[];
  awards: LegendAwardRow[];
};

// ---------------------------------------------------------------------------
// シーズン別・通算
// ---------------------------------------------------------------------------

/** 1シーズン1行にまとめた表示用の行。移籍した年は TOT 行を使い、チーム名を並べる */
export type LegendDisplaySeason = LegendStatLine & { season: number; teams: string[]; age: number | null };

export function collapseLegendSeasons(rows: LegendSeasonRow[]): LegendDisplaySeason[] {
  const bySeason = new Map<number, LegendSeasonRow[]>();
  for (const r of rows) {
    const list = bySeason.get(r.season);
    if (list) list.push(r);
    else bySeason.set(r.season, [r]);
  }
  return [...bySeason.entries()]
    .sort(([a], [b]) => a - b)
    .map(([season, list]) => {
      const total = list.find((r) => r.isTotal);
      const teamRows = list.filter((r) => !r.isTotal);
      const base = total ?? teamRows[0];
      return { ...base, season, teams: teamRows.map((r) => r.team), age: base.age };
    });
}

const COUNT_KEYS = ["min", "fgm", "fga", "fg3m", "fg3a", "ftm", "fta", "oreb", "dreb", "reb", "ast", "stl", "blk", "tov", "pf", "pts"] as const;
type CountKey = (typeof COUNT_KEYS)[number];

/** 通算。各項目の合計と、その項目が記録されているシーズンの試合数(1試合平均の分母) */
export type LegendCareer = {
  seasons: number;
  gp: number;
  totals: Record<CountKey, number | null>;
  gamesWithStat: Record<CountKey, number>;
};

export function legendCareer(seasons: LegendDisplaySeason[]): LegendCareer {
  const totals = {} as Record<CountKey, number | null>;
  const gamesWithStat = {} as Record<CountKey, number>;
  for (const key of COUNT_KEYS) {
    let sum: number | null = null;
    let games = 0;
    for (const s of seasons) {
      const v = s[key];
      if (v === null || v === undefined || !s.gp) continue;
      sum = (sum ?? 0) + v;
      games += s.gp;
    }
    totals[key] = sum;
    gamesWithStat[key] = games;
  }
  return {
    seasons: seasons.length,
    gp: seasons.reduce((n, s) => n + (s.gp ?? 0), 0),
    totals,
    gamesWithStat,
  };
}

export function perGame(total: number | null, games: number | null | undefined): number | null {
  if (total === null || !games) return null;
  return total / games;
}

/** 成功率。分子・分母が両方記録されている場合だけ計算する(シーズン行用) */
export function pct(made: number | null, att: number | null): number | null {
  if (made === null || att === null || att === 0) return null;
  return made / att;
}

/** 通算の成功率。成功数・試投数が両方記録されているシーズンだけで計算する */
export function careerPct(seasons: LegendDisplaySeason[], made: "fgm" | "fg3m" | "ftm", att: "fga" | "fg3a" | "fta"): number | null {
  let m = 0;
  let a = 0;
  for (const s of seasons) {
    if (s[made] === null || s[att] === null) continue;
    m += s[made]!;
    a += s[att]!;
  }
  return a > 0 ? m / a : null;
}

export function careerAverages(seasons: LegendDisplaySeason[]) {
  const c = legendCareer(seasons);
  const avg = (key: CountKey) => perGame(c.totals[key], c.gamesWithStat[key]);
  return {
    career: c,
    ppg: avg("pts"),
    rpg: avg("reb"),
    apg: avg("ast"),
    spg: avg("stl"),
    bpg: avg("blk"),
    mpg: avg("min"),
    fgPct: careerPct(seasons, "fgm", "fga"),
    threePct: careerPct(seasons, "fg3m", "fg3a"),
    ftPct: careerPct(seasons, "ftm", "fta"),
  };
}

