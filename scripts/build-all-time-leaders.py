"""オールタイムリーダーズ(/legends/leaders)のデータ data/legends/leaders.json を、公開データセットから作る。

元データ: sumitrodatta/bball-reference-datasets(GitHub、Basketball-Reference の記録をCSVにまとめたもの)の Data/
  Player Totals.csv   : シーズン別の合計成績(NBA・BAA・ABA。途中移籍は 2TM 等の合計行あり)
  Team Summaries.csv  : チームの試合数(2019-20・2020-21 の規定試合数の換算に使う)

集計の決まり(Basketball-Reference「Rate Statistic Requirements」に合わせる):
  ・対象は終了したシーズンまで(進行中のシーズンは入れない)。NBA・ABA の合計(BAA は NBA に含める)
  ・年度別リーダー(1試合平均・成功率): リーグ・シーズンごとに規定(試合数、または合計値)を満たした選手の1位
  ・通算: NBA と ABA の合計。通算の1試合平均は 400試合以上(得点は 400試合 または 10,000点)
    記録が無い年(1973-74より前のスティール・ブロック、3P導入前)の試合は分母に入れない
  ・シーズン最高: 各シーズンの規定を満たした成績の中での歴代上位

使い方:
  git clone --depth 1 https://github.com/sumitrodatta/bball-reference-datasets <保存先>
  python scripts/build-all-time-leaders.py --data-dir <保存先>/Data
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import time
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "data" / "legends" / "leaders.json"
TOP_N = 50

# 1試合平均の項目(合計値の列名)。導入年(シーズン終了年、リーグ別)より前は記録なし
PER_GAME = ["pts", "trb", "ast", "stl", "blk", "x3p"]
FIRST_RECORDED = {
    # (stat, lg) -> 記録が始まったシーズン終了年
    ("trb", "NBA"): 1951,
    ("stl", "NBA"): 1974,
    ("blk", "NBA"): 1974,
    ("x3p", "NBA"): 1980,
    ("stl", "ABA"): 1973,
    ("blk", "ABA"): 1973,
}
# 規定の「または合計値」で使う列(Basketball-Reference の表に合わせる)
OR_TOTAL_KEYS = {"pts": "pts", "trb": "trb", "ast": "ast", "stl": "stl", "blk": "blk", "x3p": "mp"}


def num(v: str | None) -> float | None:
    if v is None or v == "" or v == "NA":
        return None
    return float(v)


def recorded(stat: str, lg: str, season: int) -> bool:
    return season >= FIRST_RECORDED.get((stat, lg), 0)


# ---------------------------------------------------------------------------
# シーズンごとの規定(シーズン終了年で判定)
# ---------------------------------------------------------------------------

NBA_GAMES = [  # (最初の年, 最後の年, 試合数)
    (1947, 1947, 40), (1948, 1948, 32), (1949, 1949, 40), (1950, 1951, 46), (1952, 1952, 44),
    (1953, 1957, 48), (1958, 1959, 55), (1960, 1960, 60), (1961, 1961, 55), (1962, 1969, 65),
    (1970, 1974, 70),
]
NBA_OR_70 = {"g": 70, "mp": 2000, "pts": 1400, "trb": 800, "ast": 400, "stl": 125, "blk": 100}
NBA_OR_1999 = {"g": 43, "mp": 1220, "pts": 854, "trb": 488, "ast": 244, "stl": 76, "blk": 61}
NBA_OR_2012 = {"g": 56, "mp": 1610, "pts": 1127, "trb": 644, "ast": 321, "stl": 100, "blk": 80}
ABA_TOTALS = {
    1969: {"mp": 2048, "pts": 1000, "trb": 500, "ast": 250},
    1970: {"mp": 2048, "pts": 1200, "trb": 750, "ast": 325},
    1971: {"mp": 2048, "pts": 1000, "trb": 650, "ast": 275},
    1972: {"mp": 2048, "pts": 1000, "trb": 700, "ast": 335},
    1973: {"mp": 2048, "pts": 1000, "trb": 600, "ast": 250, "stl": 100, "blk": 100},
    1974: {"mp": 2048, "pts": 1000, "trb": 500, "ast": 200, "stl": 100, "blk": 100},
    1975: {"mp": 2048, "pts": 1000, "trb": 600, "ast": 250, "stl": 100, "blk": 100},
    1976: {"mp": 2048, "pts": 1000, "trb": 600, "ast": 250, "stl": 100, "blk": 100},
}


def per_game_qualified(row: dict, stat: str, team_games: float | None) -> bool:
    lg, season, g = row["lg"], row["season"], row["g"] or 0
    total_key = OR_TOTAL_KEYS[stat]
    total = row.get(total_key) or 0
    if lg == "ABA":
        if season == 1968:
            return g >= 40
        rule = ABA_TOTALS[season]
        return total >= rule.get(total_key, rule["mp"])
    for first, last, games in NBA_GAMES:
        if first <= season <= last:
            return g >= games
    if season <= 2013:
        rule = NBA_OR_1999 if season == 1999 else NBA_OR_2012 if season == 2012 else NBA_OR_70
        return g >= rule["g"] or total >= rule[total_key]
    if season in (2020, 2021) and team_games:
        return g >= math.ceil(58 * team_games / 82)
    return g >= 58


NBA_FG = [
    (1947, 1951, 200), (1952, 1955, 210), (1956, 1959, 230), (1960, 1960, 190), (1961, 1962, 200),
    (1963, 1964, 210), (1965, 1965, 220), (1966, 1966, 210), (1967, 1968, 220), (1969, 1969, 230),
]


def fg_pct_qualified(row: dict, team_games: float | None) -> bool:
    lg, season = row["lg"], row["season"]
    fg, fga, g = row["fg"] or 0, row["fga"] or 0, row["g"] or 0
    if lg == "ABA":
        if season in (1968, 1970, 1972, 1974):
            return fga >= 560
        if season in (1969, 1971, 1973):
            return fg >= 560
        return fg >= 300
    for first, last, need in NBA_FG:
        if first <= season <= last:
            return fg >= need
    if season == 1970:
        return g >= 70 and fga >= 700
    if season in (1971, 1972):
        return fga >= 700
    if season in (1973, 1974):
        return fga >= 560
    if season == 1999:
        return fg >= 183
    if season == 2012:
        return fg >= 241
    if season in (2020, 2021) and team_games:
        return fg >= math.ceil(300 * team_games / 82)
    return fg >= 300


ABA_3P = {1968: 35, 1969: 40, 1970: 50, 1971: 35, 1972: 40, 1973: 28, 1974: 20, 1975: 27, 1976: 20}


def fg3_pct_qualified(row: dict, team_games: float | None) -> bool:
    lg, season, made = row["lg"], row["season"], row["x3p"] or 0
    if lg == "ABA":
        return made >= ABA_3P[season]
    if season < 1980:
        return False
    if season <= 1990:
        return made >= 25
    if season <= 1994:
        return made >= 50
    if season <= 1997:
        return made >= 82
    if season == 1999:
        return made >= 34
    if season == 2012:
        return made >= 44
    if season <= 2013:
        return made >= 55
    if season in (2020, 2021) and team_games:
        return made >= math.ceil(82 * team_games / 82)
    return made >= 82


# ---------------------------------------------------------------------------


def season_label(end: int) -> str:
    return f"{end - 1}-{str(end)[-2:]}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data-dir", required=True, type=Path)
    args = ap.parse_args()

    with open(args.data_dir / "Player Totals.csv", encoding="utf-8") as f:
        totals = list(csv.DictReader(f))
    with open(args.data_dir / "Team Summaries.csv", encoding="utf-8") as f:
        teams = list(csv.DictReader(f))

    latest_in_file = max(int(r["season"]) for r in totals)
    # 進行中のシーズン(ファイルの最新年)は入れない
    last_complete = latest_in_file - 1
    active_ids = {r["player_id"] for r in totals if int(r["season"]) == latest_in_file}

    team_games: dict[tuple[int, str], float] = {}
    for t in teams:
        w, l = num(t["w"]), num(t["l"])
        if t["abbreviation"] and w is not None and l is not None:
            team_games[(int(t["season"]), t["abbreviation"])] = w + l

    # (season, lg, player_id) ごとに1行(移籍した年は合計行、所属は在籍チームを / で並べる)
    rows_by_key: dict[tuple[int, str, str], list[dict]] = defaultdict(list)
    for r in totals:
        season = int(r["season"])
        if season > last_complete:
            continue
        lg = "NBA" if r["lg"] == "BAA" else r["lg"]
        rows_by_key[(season, lg, r["player_id"])].append(r)

    seasons: list[dict] = []
    names: dict[str, str] = {}
    for (season, lg, pid), rs in rows_by_key.items():
        total_row = next((r for r in rs if r["team"].endswith("TM") or r["team"] == "TOT"), None)
        team_rows = [r for r in rs if r is not total_row]
        base = total_row or rs[0]
        row = {
            "season": season, "lg": lg, "id": pid,
            "team": "/".join(r["team"] for r in team_rows),
            "lastTeam": team_rows[-1]["team"] if team_rows else base["team"],
        }
        for k in ["g", "mp", "fg", "fga", "x3p", "x3pa", "trb", "ast", "stl", "blk", "pts"]:
            row[k] = num(base[k])
        seasons.append(row)
        names[pid] = base["player"].rstrip("*")

    def tg(row: dict) -> float | None:
        return team_games.get((row["season"], row["lastTeam"]))

    def per_game(row: dict, stat: str) -> float | None:
        if not recorded(stat, row["lg"], row["season"]) or row[stat] is None or not row["g"]:
            return None
        return row[stat] / row["g"]

    def pct(made: float | None, att: float | None) -> float | None:
        return made / att if made is not None and att else None

    yearly_stats = {
        "pts": lambda r: per_game(r, "pts") if per_game_qualified(r, "pts", tg(r)) else None,
        "trb": lambda r: per_game(r, "trb") if per_game_qualified(r, "trb", tg(r)) else None,
        "ast": lambda r: per_game(r, "ast") if per_game_qualified(r, "ast", tg(r)) else None,
        "stl": lambda r: per_game(r, "stl") if per_game_qualified(r, "stl", tg(r)) else None,
        "blk": lambda r: per_game(r, "blk") if per_game_qualified(r, "blk", tg(r)) else None,
        "x3p": lambda r: per_game(r, "x3p") if (recorded("x3p", r["lg"], r["season"]) and per_game_qualified(r, "x3p", tg(r))) else None,
        # 3P成功の合計(規定なし。ステフィン・カリーの402本など)
        "x3p_total": lambda r: r["x3p"] if recorded("x3p", r["lg"], r["season"]) else None,
        "fg_pct": lambda r: pct(r["fg"], r["fga"]) if fg_pct_qualified(r, tg(r)) else None,
        "x3p_pct": lambda r: pct(r["x3p"], r["x3pa"]) if recorded("x3p", r["lg"], r["season"]) and fg3_pct_qualified(r, tg(r)) else None,
    }
    digits = {"fg_pct": 3, "x3p_pct": 3, "x3p_total": 0}

    def entry(r: dict, value: float, stat: str) -> dict:
        return {"id": r["id"], "team": r["team"], "g": int(r["g"] or 0), "value": round(value, digits.get(stat, 1))}

    # 年度別リーダー(同率1位は全員)
    yearly: dict[str, list[dict]] = {}
    for stat, fn in yearly_stats.items():
        groups: dict[tuple[int, str], list[tuple[float, dict]]] = defaultdict(list)
        for r in seasons:
            v = fn(r)
            if v is not None:
                groups[(r["season"], r["lg"])].append((v, r))
        out = []
        for (season, lg), vals in sorted(groups.items(), key=lambda x: (-x[0][0], x[0][1] != "NBA")):
            nd = digits.get(stat, 1)
            best = max(round(v, nd + 2) for v, _ in vals)
            leaders = [entry(r, v, stat) for v, r in vals if round(v, nd + 2) == best]
            out.append({"season": season - 1, "lg": lg, "leaders": leaders})
        yearly[stat] = out

    # シーズン最高(規定到達のみ、NBA・ABA 合わせて上位)
    season_best: dict[str, list[dict]] = {}
    for stat in ["pts", "trb", "ast", "stl", "blk", "x3p", "x3p_total", "fg_pct", "x3p_pct"]:
        vals = [(yearly_stats[stat](r), r) for r in seasons]
        vals = sorted(((v, r) for v, r in vals if v is not None), key=lambda x: -x[0])
        season_best[stat] = [
            {**entry(r, v, stat), "season": r["season"] - 1, "lg": r["lg"]} for v, r in vals[:TOP_N]
        ]

    # 通算
    career: dict[str, dict] = defaultdict(lambda: defaultdict(float))
    for r in seasons:
        c = career[r["id"]]
        c["g"] += r["g"] or 0
        c["first"] = min(c.get("first", 9999), r["season"])
        c["last"] = max(c.get("last", 0), r["season"])
        c.setdefault("lgs", set()).add(r["lg"])  # type: ignore[arg-type]
        for stat in PER_GAME:
            if recorded(stat, r["lg"], r["season"]) and r[stat] is not None:
                c[stat] += r[stat]
                c[f"{stat}_g"] += r["g"] or 0
        for k in ["fg", "fga", "x3pa"]:
            if r[k] is not None and (k != "x3pa" or recorded("x3p", r["lg"], r["season"])):
                c[k] += r[k]

    def career_entry(pid: str, value: float, nd: int) -> dict:
        c = career[pid]
        return {
            "id": pid,
            "value": round(value, nd),
            "g": int(c["g"]),
            "from": int(c["first"]) - 1,
            "to": int(c["last"]) - 1,
            "lgs": sorted(c["lgs"]),
        }

    career_total: dict[str, list[dict]] = {}
    career_avg: dict[str, list[dict]] = {}
    for stat in ["g", *PER_GAME]:
        ranked = sorted(career.items(), key=lambda x: -x[1][stat])[:TOP_N]
        career_total[stat] = [career_entry(pid, c[stat], 0) for pid, c in ranked]
    for stat in PER_GAME:
        cand = []
        for pid, c in career.items():
            g = c[f"{stat}_g"]
            if not g:
                continue
            if c["g"] >= 400 or (stat == "pts" and c["pts"] >= 10000):
                cand.append((c[stat] / g, pid))
        cand.sort(key=lambda x: -x[0])
        career_avg[stat] = [career_entry(pid, v, 2) for v, pid in cand[:TOP_N]]

    used_ids = set()
    for lists in [*career_total.values(), *career_avg.values(), *season_best.values()]:
        used_ids.update(e["id"] for e in lists)
    for lists in yearly.values():
        for s in lists:
            used_ids.update(e["id"] for e in s["leaders"])

    out = {
        "source": "Basketball-Reference (sumitrodatta/bball-reference-datasets)",
        "generatedAt": time.strftime("%Y-%m-%d"),
        "lastSeason": last_complete - 1,  # 開始年(例: 2025 = 2025-26 シーズン終了時点)
        "players": {pid: {"name": names[pid], "active": pid in active_ids} for pid in sorted(used_ids)},
        "yearly": yearly,
        "careerTotal": career_total,
        "careerAvg": career_avg,
        "seasonBest": season_best,
    }
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUT_PATH} ({OUT_PATH.stat().st_size // 1024} KB), last complete season {season_label(last_complete)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
