"""レジェンド枠(/legends)のデータ data/legends/legends.json を作る(NBA公式の統計 stats.nba.com から)。

対象: NBA 75th Anniversary Team の76人(NBA 50 Greatest Players の50人は全員ここに含まれる)。
選手の一覧は下の LEGENDS(英語名・選出・スラッグ)。日本語名は lib/legends/names-ja.ts で持つ。

取得する内容(選手ごとに3回):
  commonplayerinfo  : 生年月日・身長・体重・ポジション・出身校・国・ドラフト・在籍年・現役かどうか
  playercareerstats : シーズン別の合計成績(レギュラーシーズン・プレーオフ。チーム別の行と、移籍した年の TOT 行)と通算
  playerawards      : MVP・ファイナルMVP・優勝・オールスター・オールNBA などの受賞歴
選手ID(PERSON_ID)は commonallplayers(全選手の一覧)から英語名で照合する。

記録が無い項目(1973-74より前のスティール・ブロック・ターンオーバー・ORB/DRB、1979-80より前の3P、
初期の出場時間)は NBA公式で空(null)になっている。0 で埋めず null のまま保存する(画面は「—」)。
ABA の成績は NBA公式に含まれないため収録しない(画面に注記する)。

使い方(yuのPC。stats.nba.com はクラウド環境からは接続できない):
  python scripts/build-legends-data.py --cache-dir _legends_cache
  ・取得した元データを --cache-dir に保存する。途中で止まっても、もう一度実行すれば保存済みの分は取得し直さない
  ・--offline: 保存済みのデータだけで data/legends/legends.json を作り直す(ネットワークに接続しない)

照合できない選手・取得に失敗した選手がいれば、名前を表示して終了コード 1 で終わる(JSON は書かない)。
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "data" / "legends" / "legends.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Referer": "https://www.nba.com/",
    "Origin": "https://www.nba.com",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
}

# (英語名, 50周年に選出, スラッグ)。75周年は全員。名前は NBA公式の表記に合わせる
LEGENDS: list[tuple[str, bool, str]] = [
    ("Kareem Abdul-Jabbar", True, "kareem-abdul-jabbar"),
    ("Ray Allen", False, "ray-allen"),
    ("Giannis Antetokounmpo", False, "giannis-antetokounmpo"),
    ("Carmelo Anthony", False, "carmelo-anthony"),
    ("Nate Archibald", True, "nate-archibald"),
    ("Paul Arizin", True, "paul-arizin"),
    ("Charles Barkley", True, "charles-barkley"),
    ("Rick Barry", True, "rick-barry"),
    ("Elgin Baylor", True, "elgin-baylor"),
    ("Dave Bing", True, "dave-bing"),
    ("Larry Bird", True, "larry-bird"),
    ("Kobe Bryant", False, "kobe-bryant"),
    ("Wilt Chamberlain", True, "wilt-chamberlain"),
    ("Bob Cousy", True, "bob-cousy"),
    ("Dave Cowens", True, "dave-cowens"),
    ("Billy Cunningham", True, "billy-cunningham"),
    ("Stephen Curry", False, "stephen-curry"),
    ("Anthony Davis", False, "anthony-davis"),
    ("Dave DeBusschere", True, "dave-debusschere"),
    ("Clyde Drexler", True, "clyde-drexler"),
    ("Tim Duncan", False, "tim-duncan"),
    ("Kevin Durant", False, "kevin-durant"),
    ("Julius Erving", True, "julius-erving"),
    ("Patrick Ewing", True, "patrick-ewing"),
    ("Walt Frazier", True, "walt-frazier"),
    ("Kevin Garnett", False, "kevin-garnett"),
    ("George Gervin", True, "george-gervin"),
    ("Hal Greer", True, "hal-greer"),
    ("James Harden", False, "james-harden"),
    ("John Havlicek", True, "john-havlicek"),
    ("Elvin Hayes", True, "elvin-hayes"),
    ("Allen Iverson", False, "allen-iverson"),
    ("LeBron James", False, "lebron-james"),
    ("Magic Johnson", True, "magic-johnson"),
    ("Sam Jones", True, "sam-jones"),
    ("Michael Jordan", True, "michael-jordan"),
    ("Jason Kidd", False, "jason-kidd"),
    ("Kawhi Leonard", False, "kawhi-leonard"),
    ("Damian Lillard", False, "damian-lillard"),
    ("Jerry Lucas", True, "jerry-lucas"),
    ("Karl Malone", True, "karl-malone"),
    ("Moses Malone", True, "moses-malone"),
    ("Pete Maravich", True, "pete-maravich"),
    ("Bob McAdoo", False, "bob-mcadoo"),
    ("Kevin McHale", True, "kevin-mchale"),
    ("George Mikan", True, "george-mikan"),
    ("Reggie Miller", False, "reggie-miller"),
    ("Earl Monroe", True, "earl-monroe"),
    ("Steve Nash", False, "steve-nash"),
    ("Dirk Nowitzki", False, "dirk-nowitzki"),
    ("Hakeem Olajuwon", True, "hakeem-olajuwon"),
    ("Shaquille O'Neal", True, "shaquille-oneal"),
    ("Robert Parish", True, "robert-parish"),
    ("Chris Paul", False, "chris-paul"),
    ("Gary Payton", False, "gary-payton"),
    ("Bob Pettit", True, "bob-pettit"),
    ("Paul Pierce", False, "paul-pierce"),
    ("Scottie Pippen", True, "scottie-pippen"),
    ("Willis Reed", True, "willis-reed"),
    ("Oscar Robertson", True, "oscar-robertson"),
    ("David Robinson", True, "david-robinson"),
    ("Dennis Rodman", False, "dennis-rodman"),
    ("Bill Russell", True, "bill-russell"),
    ("Dolph Schayes", True, "dolph-schayes"),
    ("Bill Sharman", True, "bill-sharman"),
    ("John Stockton", True, "john-stockton"),
    ("Isiah Thomas", True, "isiah-thomas"),
    ("Nate Thurmond", True, "nate-thurmond"),
    ("Wes Unseld", True, "wes-unseld"),
    ("Dwyane Wade", False, "dwyane-wade"),
    ("Bill Walton", True, "bill-walton"),
    ("Jerry West", True, "jerry-west"),
    ("Russell Westbrook", False, "russell-westbrook"),
    ("Lenny Wilkens", True, "lenny-wilkens"),
    ("Dominique Wilkins", False, "dominique-wilkins"),
    ("James Worthy", True, "james-worthy"),
]

# NBA公式の一覧で別の表記になっている選手(見つからなければここも試す)
NAME_ALIASES: dict[str, list[str]] = {
    "Nate Archibald": ["Tiny Archibald", "Nate 'Tiny' Archibald"],
    "Hakeem Olajuwon": ["Akeem Olajuwon"],
    "Magic Johnson": ["Earvin Johnson"],
    "Kareem Abdul-Jabbar": ["Lew Alcindor"],
    "Walt Frazier": ["Clyde Frazier"],
}


def normalize(name: str) -> str:
    text = unicodedata.normalize("NFKD", name)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return "".join(c for c in text.lower() if c.isalnum())


def fetch_json(endpoint: str, params: dict[str, str], cache_dir: Path, cache_name: str, offline: bool) -> dict:
    cache_path = cache_dir / cache_name
    if cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))
    if offline:
        raise RuntimeError(f"保存済みデータがありません: {cache_path}")
    url = f"https://stats.nba.com/stats/{endpoint}?{urllib.parse.urlencode(params)}"
    last_error: Exception | None = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=60) as res:
                body = res.read().decode("utf-8")
            data = json.loads(body)
            cache_path.write_text(body, encoding="utf-8")
            time.sleep(1.2)  # 連続アクセスで止められないよう間を空ける
            return data
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            last_error = e
            time.sleep(3 * (attempt + 1))
    raise RuntimeError(f"取得に失敗しました: {url} ({last_error})")


def result_set(data: dict, name: str) -> list[dict]:
    for rs in data.get("resultSets", []):
        if rs.get("name") == name:
            headers = rs["headers"]
            return [dict(zip(headers, row)) for row in rs["rowSet"]]
    return []


def height_cm(height: str | None) -> int | None:
    # "6-6" → 198
    if not height or "-" not in height:
        return None
    feet, inches = height.split("-", 1)
    try:
        return round((int(feet) * 12 + int(inches)) * 2.54)
    except ValueError:
        return None


def weight_kg(weight: str | int | None) -> float | None:
    try:
        return round(int(weight) * 0.45359237, 1) if weight not in (None, "") else None
    except (TypeError, ValueError):
        return None


def int_or_none(value) -> int | None:
    if value in (None, "", "Undrafted"):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


STAT_KEYS = {
    "gp": "GP", "gs": "GS", "min": "MIN", "fgm": "FGM", "fga": "FGA", "fg3m": "FG3M", "fg3a": "FG3A",
    "ftm": "FTM", "fta": "FTA", "oreb": "OREB", "dreb": "DREB", "reb": "REB", "ast": "AST",
    "stl": "STL", "blk": "BLK", "tov": "TOV", "pf": "PF", "pts": "PTS",
}


def stat_row(row: dict) -> dict:
    out = {key: row.get(src) for key, src in STAT_KEYS.items()}
    # 出場時間は小数で来ることがあるので整数に(合計値)
    if isinstance(out["min"], float):
        out["min"] = round(out["min"])
    return out


def season_rows(rows: list[dict]) -> list[dict]:
    result = []
    for row in rows:
        if row.get("LEAGUE_ID") not in (None, "00"):
            continue
        season_id = str(row["SEASON_ID"])  # "1984-85"
        result.append({
            "season": int(season_id[:4]),  # 開始年(2023 = 2023-24)
            "team": row.get("TEAM_ABBREVIATION") or "-",
            "isTotal": row.get("TEAM_ABBREVIATION") == "TOT",
            "age": int_or_none(row.get("PLAYER_AGE")),
            **stat_row(row),
        })
    return result


def career_row(rows: list[dict]) -> dict | None:
    return stat_row(rows[0]) if rows else None


def award_rows(rows: list[dict]) -> list[dict]:
    result = []
    for row in rows:
        season = str(row.get("SEASON") or "")
        result.append({
            "description": row.get("DESCRIPTION"),
            "season": int(season[:4]) if season[:4].isdigit() else None,
            "allNbaTeam": int_or_none(row.get("ALL_NBA_TEAM_NUMBER")),
            "type": row.get("TYPE"),
            "month": row.get("MONTH"),
            "week": row.get("WEEK"),
        })
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache-dir", required=True)
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--out", default=str(OUT_PATH))
    args = parser.parse_args()
    out_path = Path(args.out)
    cache_dir = Path(args.cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)

    all_players = result_set(
        fetch_json(
            "commonallplayers",
            {"IsOnlyCurrentSeason": "0", "LeagueID": "00", "Season": "2025-26"},
            cache_dir, "commonallplayers.json", args.offline,
        ),
        "CommonAllPlayers",
    )
    by_name: dict[str, list[dict]] = {}
    for p in all_players:
        by_name.setdefault(normalize(p["DISPLAY_FIRST_LAST"]), []).append(p)

    problems: list[str] = []
    legends: list[dict] = []
    for name, in_50, slug in LEGENDS:
        candidates: list[dict] = []
        for n in [name, *NAME_ALIASES.get(name, [])]:
            candidates = by_name.get(normalize(n), [])
            if candidates:
                break
        if len(candidates) != 1:
            problems.append(f"{name}: 一覧で {len(candidates)} 件見つかりました(1件に決められません)")
            continue
        person_id = candidates[0]["PERSON_ID"]
        try:
            info_data = fetch_json("commonplayerinfo", {"PlayerID": str(person_id), "LeagueID": "00"},
                                   cache_dir, f"info_{person_id}.json", args.offline)
            career_data = fetch_json("playercareerstats", {"PlayerID": str(person_id), "PerMode": "Totals", "LeagueID": "00"},
                                     cache_dir, f"career_{person_id}.json", args.offline)
            awards_data = fetch_json("playerawards", {"PlayerID": str(person_id)},
                                     cache_dir, f"awards_{person_id}.json", args.offline)
        except RuntimeError as e:
            problems.append(f"{name}: {e}")
            continue

        info = (result_set(info_data, "CommonPlayerInfo") or [{}])[0]
        regular = season_rows(result_set(career_data, "SeasonTotalsRegularSeason"))
        playoffs = season_rows(result_set(career_data, "SeasonTotalsPostSeason"))
        if not regular:
            problems.append(f"{name}: レギュラーシーズンの成績が空です")
            continue

        legends.append({
            "slug": slug,
            "personId": person_id,
            "name": info.get("DISPLAY_FIRST_LAST") or name,
            "greatest50": in_50,
            "greatest75": True,
            "birthDate": (info.get("BIRTHDATE") or "")[:10] or None,
            "heightCm": height_cm(info.get("HEIGHT")),
            "weightKg": weight_kg(info.get("WEIGHT")),
            "position": info.get("POSITION") or None,
            "school": info.get("SCHOOL") or None,
            "country": info.get("COUNTRY") or None,
            "jersey": info.get("JERSEY") or None,
            "fromYear": int_or_none(info.get("FROM_YEAR")),
            "toYear": int_or_none(info.get("TO_YEAR")),
            "draftYear": int_or_none(info.get("DRAFT_YEAR")),
            "draftRound": int_or_none(info.get("DRAFT_ROUND")),
            "draftNumber": int_or_none(info.get("DRAFT_NUMBER")),
            "isActive": info.get("ROSTERSTATUS") == "Active",
            "regularSeason": regular,
            "regularSeasonCareer": career_row(result_set(career_data, "CareerTotalsRegularSeason")),
            "playoffs": playoffs,
            "playoffsCareer": career_row(result_set(career_data, "CareerTotalsPostSeason")),
            "awards": award_rows(result_set(awards_data, "PlayerAwards")),
        })
        print(f"OK {name} ({person_id}) レギュラー{len(regular)}行 プレーオフ{len(playoffs)}行")

    if problems:
        print("\n次の選手を確認してください(JSONは書き出していません):", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps({"source": "stats.nba.com", "generatedAt": time.strftime("%Y-%m-%d"), "legends": legends},
                   ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"\n{len(legends)}人分を書き出しました: {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
