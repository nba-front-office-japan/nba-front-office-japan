"""レジェンドのプレーオフ成績を、Excel(NBA_76_Legends_Playoff_Totals.xlsx)から data/legends/legends.json に取り込む。

Excel の形式(Basketball-Reference の Totals → Playoffs を選手ごとに集めたもの):
  「All Seasons」シート : 5行目が見出し(Player, Season, Age, Team, Lg, Pos, G, GS, MP, FG, ...)。1行 = 選手 × シーズン
  「Totals and Averages」シート : 5行目が見出し。Row Type = "Career" の行が選手ごとの通算(全リーグ合計)

取り込むのは Lg が NBA / BAA の行だけ(ABA は除く。レギュラーシーズンと同じ扱い)。
確認(1つでも合わなければ、その選手は取り込まない):
  1. シーズン行(全リーグ)の合計が Career 行と一致する(G・MP・PTS・TRB・AST)
  2. 各シーズンのチームが、同じシーズンのレギュラーシーズンで在籍していたチームである

使い方: python scripts/import-legend-playoffs-xlsx.py NBA_76_Legends_Playoff_Totals.xlsx
"""

from __future__ import annotations

import json
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
JSON_PATH = ROOT / "data" / "legends" / "legends.json"

NAME_ALIASES = {"Tiny Archibald": "Nate Archibald"}
CHECK_KEYS = ("G", "MP", "PTS", "TRB", "AST")
STAT_MAP = {
    "gp": "G", "gs": "GS", "min": "MP", "fgm": "FG", "fga": "FGA", "fg3m": "3P", "fg3a": "3PA",
    "ftm": "FT", "fta": "FTA", "oreb": "ORB", "dreb": "DRB", "reb": "TRB", "ast": "AST",
    "stl": "STL", "blk": "BLK", "tov": "TOV", "pf": "PF", "pts": "PTS",
}


def plain(name: str) -> str:
    text = unicodedata.normalize("NFKD", name)
    return "".join(c for c in text if not unicodedata.combining(c)).lower()


def num(v) -> int | None:
    if v in (None, ""):
        return None
    return int(round(float(v)))


def sheet_rows(ws) -> list[dict]:
    rows = list(ws.iter_rows(values_only=True))
    header_index = next(i for i, r in enumerate(rows) if r and r[0] == "Player")
    header = rows[header_index]
    return [dict(zip(header, r)) for r in rows[header_index + 1:] if r and r[0]]


def main() -> int:
    if len(sys.argv) != 2:
        print("使い方: python scripts/import-legend-playoffs-xlsx.py <Excelファイル>", file=sys.stderr)
        return 2
    wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
    seasons = sheet_rows(wb["All Seasons"])
    careers = {r["Player"]: r for r in sheet_rows(wb["Totals and Averages"]) if r.get("Row Type") == "Career"}

    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    by_name = {plain(l["name"]): l for l in data["legends"]}

    rows_by_player: dict[str, list[dict]] = defaultdict(list)
    for r in seasons:
        rows_by_player[r["Player"]].append(r)

    imported, problems = [], []
    for player, rows in rows_by_player.items():
        legend = by_name.get(plain(NAME_ALIASES.get(player, player)))
        if legend is None:
            problems.append(f"{player}: レジェンド76人の中に見つかりません")
            continue
        career = careers.get(player)
        if career is None:
            problems.append(f"{player}: Career 行がありません")
            continue
        mismatch = [k for k in CHECK_KEYS if sum(num(r[k]) or 0 for r in rows) != (num(career[k]) or 0)]
        if mismatch:
            problems.append(f"{player}: シーズン合計と Career 行が一致しません({', '.join(mismatch)})")
            continue

        regular_teams: dict[int, set[str]] = defaultdict(set)
        for r in legend["regularSeason"]:
            if not r["isTotal"]:
                regular_teams[r["season"]].add(r["team"])

        playoffs, team_errors = [], []
        for r in rows:
            if r["Lg"] not in ("NBA", "BAA"):
                continue
            season = int(str(r["Season"])[:4])
            team = r["Team"]
            if team not in regular_teams.get(season, set()):
                team_errors.append(f"{r['Season']} {team}")
            playoffs.append({
                "season": season,
                "team": team,
                "isTotal": False,
                "age": num(r["Age"]),
                **{key: num(r[col]) for key, col in STAT_MAP.items()},
            })
        if team_errors:
            problems.append(f"{player}: レギュラーシーズンに在籍していないチームの行があります({', '.join(team_errors)})")
            continue
        playoffs.sort(key=lambda p: p["season"])
        legend["playoffs"] = playoffs
        legend["playoffsLoaded"] = True
        imported.append(f"{legend['name']}: {len(playoffs)}シーズン {sum(p['gp'] or 0 for p in playoffs)}試合 {sum(p['pts'] or 0 for p in playoffs)}得点")

    missing = [l["name"] for l in data["legends"] if not l.get("playoffsLoaded")]
    data["playoffsAvailable"] = not missing
    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    print(f"取り込み: {len(imported)}人")
    for s in imported:
        print("  OK", s)
    if problems:
        print("\n取り込めなかった選手:")
        for p in problems:
            print("  -", p)
    print(f"\nまだ無い選手({len(missing)}人): {', '.join(missing) if missing else 'なし'}")
    return 0 if not problems else 1


if __name__ == "__main__":
    sys.exit(main())
