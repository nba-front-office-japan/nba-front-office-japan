"""河村勇輝の Gリーグ試合別成績を取得して、サイト用のデータファイルを更新する。

使い方(リポジトリのフォルダで実行):
  python -I scripts/update-kawamura-gleague.py            # 今季(2026-27)だけ取得して更新(週1回の更新)
  python -I scripts/update-kawamura-gleague.py --all      # 2024-25〜2026-27 を全部取得し直す(初回の一括取り込み)
  python -I scripts/update-kawamura-gleague.py --from-raw # ネットにつながず、保存済みの生データ(_kawamura_gleague/)から作り直す

取得元: stats.gleague.nba.com(NBA Gリーグ公式の成績サイト)の playergamelogs。河村(PlayerID 1642530)の分だけ。
  ・1件ごとに2秒あける。生データは _kawamura_gleague/ に保存する(git管理外)
  ・サイト用のデータは data/kawamura/gleague-games.json。取得したシーズンの試合だけ入れ替え、他のシーズンはそのまま残す
  ・最後に「追加・変更・削除された試合」と「シーズン別の試合数・平均」を表示する。
    数字を stats.gleague.nba.com の表示と見比べてから commit する(自動では公開しない)
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

PLAYER_ID = 1642530
SEASONS = {"2024-25": 2024, "2025-26": 2025, "2026-27": 2026}
CURRENT_SEASON = "2026-27"
# stats.gleague.nba.com の SeasonType → サイトの区分
SEASON_TYPES = [
    ("Regular Season", "Regular", "regular"),
    ("Showcase", "Showcase", "tipoff"),
    ("Playoffs", "Playoffs", "playoffs"),
]
URL = "https://stats.gleague.nba.com/stats/playergamelogs?LeagueID=20&PlayerID={pid}&Season={season}&SeasonType={type}"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130",
    "Referer": "https://stats.gleague.nba.com/",
    "Origin": "https://stats.gleague.nba.com",
    "Accept": "application/json",
}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(ROOT, "_kawamura_gleague")
OUT_FILE = os.path.join(ROOT, "data", "kawamura", "gleague-games.json")


def raw_path(season: str, type_file: str) -> str:
    return os.path.join(RAW_DIR, f"{season}_{type_file}.json")


def fetch(season: str, api_type: str, type_file: str) -> None:
    url = URL.format(pid=PLAYER_ID, season=season, type=urllib.parse.quote(api_type))
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            body = res.read()
            status = res.status
    except urllib.error.HTTPError as e:
        print(f"  {season} {type_file}: HTTP {e.code}")
        return
    except Exception as e:  # タイムアウトなど
        print(f"  {season} {type_file}: 取得失敗 ({type(e).__name__}: {e})")
        return
    os.makedirs(RAW_DIR, exist_ok=True)
    with open(raw_path(season, type_file), "wb") as f:
        f.write(body)
    print(f"  {season} {type_file}: HTTP {status}")


def rows_of(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    rs = data["resultSets"][0]
    return [dict(zip(rs["headers"], row)) for row in rs["rowSet"]]


def num(value) -> int:
    return int(value or 0)


def convert(row: dict, season_year: int, season_type: str) -> dict:
    # MATCHUP 例: "SDC vs. VAL"(ホーム) / "SDC @ VAL"(アウェイ)
    matchup = row["MATCHUP"]
    is_home = " vs. " in matchup
    opponent = matchup.split(" vs. " if is_home else " @ ")[-1].strip()
    minutes = row.get("MIN") or 0
    # MIN は分(小数)。MIN_SEC("25:30")があればそちらを優先する
    seconds = round(float(minutes) * 60)
    if isinstance(row.get("MIN_SEC"), str) and ":" in row["MIN_SEC"]:
        m, s = row["MIN_SEC"].split(":")
        seconds = int(m) * 60 + int(s)
    plus_minus = row.get("PLUS_MINUS")
    return {
        "gameId": str(row["GAME_ID"]),
        "season": season_year,
        "seasonType": season_type,
        "gameDate": str(row["GAME_DATE"])[:10],
        "teamAbbr": row["TEAM_ABBREVIATION"],
        "teamName": row["TEAM_NAME"],
        "opponentAbbr": opponent,
        "isHome": is_home,
        "result": row.get("WL") or None,
        "seconds": seconds,
        "pts": num(row["PTS"]),
        "oreb": num(row["OREB"]),
        "dreb": num(row["DREB"]),
        "reb": num(row["REB"]),
        "ast": num(row["AST"]),
        "stl": num(row["STL"]),
        "blk": num(row["BLK"]),
        "tov": num(row["TOV"]),
        "pf": num(row["PF"]),
        "fgm": num(row["FGM"]),
        "fga": num(row["FGA"]),
        "fg3m": num(row["FG3M"]),
        "fg3a": num(row["FG3A"]),
        "ftm": num(row["FTM"]),
        "fta": num(row["FTA"]),
        "plusMinus": None if plus_minus is None else int(plus_minus),
    }


def load_existing() -> list[dict]:
    if not os.path.exists(OUT_FILE):
        return []
    with open(OUT_FILE, encoding="utf-8") as f:
        return json.load(f).get("games", [])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true", help="2024-25〜2026-27 を全部取得し直す")
    parser.add_argument("--from-raw", action="store_true", help="取得せず、保存済みの生データから作り直す")
    args = parser.parse_args()
    seasons = list(SEASONS) if (args.all or args.from_raw) else [CURRENT_SEASON]

    if not args.from_raw:
        print("取得中(stats.gleague.nba.com):")
        for season in seasons:
            for api_type, type_file, _ in SEASON_TYPES:
                fetch(season, api_type, type_file)
                time.sleep(2)

    fresh: list[dict] = []
    loaded_seasons: set[int] = set()
    for season in seasons:
        year = SEASONS[season]
        found = False
        for _, type_file, season_type in SEASON_TYPES:
            path = raw_path(season, type_file)
            if not os.path.exists(path):
                continue
            try:
                rows = rows_of(path)
            except (ValueError, KeyError, IndexError):
                print(f"  {season} {type_file}: JSONとして読めませんでした(この区分は変更しません)")
                continue
            found = True
            fresh.extend(convert(r, year, season_type) for r in rows)
        if found:
            loaded_seasons.add(year)
        else:
            print(f"  {season}: 生データがないため、このシーズンは変更しません")

    if not loaded_seasons:
        print("更新できるデータがありませんでした。データファイルは変更していません。")
        return 1

    existing = load_existing()
    kept = [g for g in existing if g["season"] not in loaded_seasons]
    games = sorted(kept + fresh, key=lambda g: (g["gameDate"], g["gameId"]), reverse=True)

    # 差分の表示
    before = {g["gameId"]: g for g in existing if g["season"] in loaded_seasons}
    after = {g["gameId"]: g for g in fresh}
    added = [after[k] for k in after if k not in before]
    removed = [before[k] for k in before if k not in after]
    changed = [after[k] for k in after if k in before and before[k] != after[k]]

    def line(g: dict) -> str:
        where = "vs" if g["isHome"] else "@"
        return (f"{g['gameDate']} {where} {g['opponentAbbr']} {g['result'] or '-'} [{g['seasonType']}] "
                f"{g['seconds'] // 60}分 {g['pts']}点 {g['reb']}リバ {g['ast']}アシ "
                f"FG {g['fgm']}-{g['fga']} 3P {g['fg3m']}-{g['fg3a']} FT {g['ftm']}-{g['fta']}")

    print(f"\n追加 {len(added)}試合 / 変更 {len(changed)}試合 / 削除 {len(removed)}試合")
    for label, items in (("+ 追加", added), ("* 変更", changed), ("- 削除", removed)):
        for g in sorted(items, key=lambda x: x["gameDate"]):
            print(f"  {label} {line(g)}")

    print("\nシーズン別(データファイル全体):")
    for season, year in SEASONS.items():
        rows = [g for g in games if g["season"] == year]
        if not rows:
            print(f"  {season}: 0試合")
            continue
        n = len(rows)
        teams = sorted({g["teamName"] for g in rows})
        by_type = {t: sum(1 for g in rows if g["seasonType"] == t) for _, _, t in SEASON_TYPES}
        print(f"  {season} {'/'.join(teams)}: {n}試合 "
              f"(レギュラー{by_type['regular']}・Tip-Off{by_type['tipoff']}・プレーオフ{by_type['playoffs']}) "
              f"平均 {sum(g['pts'] for g in rows) / n:.1f}点 {sum(g['reb'] for g in rows) / n:.1f}リバ "
              f"{sum(g['ast'] for g in rows) / n:.1f}アシ")

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8", newline="\n") as f:
        json.dump(
            {
                "source": "stats.gleague.nba.com playergamelogs (PlayerID 1642530)",
                "updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "games": games,
            },
            f,
            ensure_ascii=False,
            indent=1,
        )
        f.write("\n")
    print(f"\n{os.path.relpath(OUT_FILE, ROOT)} を更新しました。数字を確認してから commit してください。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
