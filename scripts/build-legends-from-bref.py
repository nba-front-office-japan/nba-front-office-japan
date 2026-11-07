"""レジェンド枠(/legends)のデータ data/legends/legends.json を、公開データセットから作る。

元データ: sumitrodatta/bball-reference-datasets(GitHub、Basketball-Reference の記録をCSVにまとめたもの)の Data/ フォルダ
  Player Totals.csv        : シーズン別の合計成績(レギュラーシーズン。NBA と前身の BAA。ABA は含めない)
  Player Career Info.csv   : ポジション・身長(インチ)・体重(ポンド)・生年月日・出身校・殿堂入り
  Draft Pick History.csv   : ドラフト年・巡目・指名順位
  Player Award Shares.csv  : MVP・DPOY・新人王・MIP・シックスマン賞・クラッチ賞(winner=TRUE のみ)
  End of Season Teams.csv  : All-NBA(All-BAA を含む)・All-Defensive・All-Rookie
  All-Star Selections.csv  : オールスター選出(NBA のみ)
  Team Abbrev.csv          : シーズンごとのチーム名 → 略称(優勝チームの判定に使う)

このデータセットに無いもの(下の定数で持つ。出典はコメント):
  NBA優勝チーム(CHAMPIONS)、ファイナルMVP(FINALS_MVP)、オールスターMVP(ALL_STAR_MVP)
  プレーオフ成績は収録していない(playoffs は空。画面に「準備中」と出す)

使い方:
  git clone --depth 1 https://github.com/sumitrodatta/bball-reference-datasets <保存先>
  python scripts/build-legends-from-bref.py --data-dir <保存先>/Data

照合できない選手がいれば名前を表示して終了コード 1(JSON は書かない)。
"""

from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import sys
import time
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "data" / "legends" / "legends.json"

# 76人の一覧(英語名・50周年選出・スラッグ)は build-legends-data.py と共通
_spec = importlib.util.spec_from_file_location("legends_list", Path(__file__).with_name("build-legends-data.py"))
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)  # type: ignore[union-attr]
LEGENDS: list[tuple[str, bool, str]] = _mod.LEGENDS
normalize = _mod.normalize

# Basketball-Reference での選手ID(同名の選手がいる・表記が違う選手だけ)
BREF_ID_OVERRIDES = {
    "Nate Archibald": "architi01",  # 表記は Tiny Archibald
    "Patrick Ewing": "ewingpa01",  # 同名の息子(ewingpa02)と区別
}

# NBA優勝チーム(ファイナル開催年 → チーム名)。出典: Wikipedia「List of NBA champions」(1947-2025)、
# 2026 は NBA.com「History of Finals MVP winners」(2025-26 ファイナルMVP ジェイレン・ブランソン / New York Knicks)
CHAMPIONS = {
    1947: "Philadelphia Warriors", 1948: "Baltimore Bullets", 1949: "Minneapolis Lakers", 1950: "Minneapolis Lakers",
    1951: "Rochester Royals", 1952: "Minneapolis Lakers", 1953: "Minneapolis Lakers", 1954: "Minneapolis Lakers",
    1955: "Syracuse Nationals", 1956: "Philadelphia Warriors", 1957: "Boston Celtics", 1958: "St. Louis Hawks",
    1959: "Boston Celtics", 1960: "Boston Celtics", 1961: "Boston Celtics", 1962: "Boston Celtics", 1963: "Boston Celtics",
    1964: "Boston Celtics", 1965: "Boston Celtics", 1966: "Boston Celtics", 1967: "Philadelphia 76ers", 1968: "Boston Celtics",
    1969: "Boston Celtics", 1970: "New York Knicks", 1971: "Milwaukee Bucks", 1972: "Los Angeles Lakers", 1973: "New York Knicks",
    1974: "Boston Celtics", 1975: "Golden State Warriors", 1976: "Boston Celtics", 1977: "Portland Trail Blazers",
    1978: "Washington Bullets", 1979: "Seattle SuperSonics", 1980: "Los Angeles Lakers", 1981: "Boston Celtics",
    1982: "Los Angeles Lakers", 1983: "Philadelphia 76ers", 1984: "Boston Celtics", 1985: "Los Angeles Lakers",
    1986: "Boston Celtics", 1987: "Los Angeles Lakers", 1988: "Los Angeles Lakers", 1989: "Detroit Pistons",
    1990: "Detroit Pistons", 1991: "Chicago Bulls", 1992: "Chicago Bulls", 1993: "Chicago Bulls", 1994: "Houston Rockets",
    1995: "Houston Rockets", 1996: "Chicago Bulls", 1997: "Chicago Bulls", 1998: "Chicago Bulls", 1999: "San Antonio Spurs",
    2000: "Los Angeles Lakers", 2001: "Los Angeles Lakers", 2002: "Los Angeles Lakers", 2003: "San Antonio Spurs",
    2004: "Detroit Pistons", 2005: "San Antonio Spurs", 2006: "Miami Heat", 2007: "San Antonio Spurs", 2008: "Boston Celtics",
    2009: "Los Angeles Lakers", 2010: "Los Angeles Lakers", 2011: "Dallas Mavericks", 2012: "Miami Heat", 2013: "Miami Heat",
    2014: "San Antonio Spurs", 2015: "Golden State Warriors", 2016: "Cleveland Cavaliers", 2017: "Golden State Warriors",
    2018: "Golden State Warriors", 2019: "Toronto Raptors", 2020: "Los Angeles Lakers", 2021: "Milwaukee Bucks",
    2022: "Golden State Warriors", 2023: "Denver Nuggets", 2024: "Boston Celtics", 2025: "Oklahoma City Thunder",
    2026: "New York Knicks",
}

# ファイナルMVP(開催年 → 選手)。出典: NBA.com「History of Finals MVP winners」
FINALS_MVP = {
    1969: "Jerry West", 1970: "Willis Reed", 1971: "Kareem Abdul-Jabbar", 1972: "Wilt Chamberlain", 1973: "Willis Reed",
    1974: "John Havlicek", 1975: "Rick Barry", 1976: "Jo Jo White", 1977: "Bill Walton", 1978: "Wes Unseld",
    1979: "Dennis Johnson", 1980: "Magic Johnson", 1981: "Cedric Maxwell", 1982: "Magic Johnson", 1983: "Moses Malone",
    1984: "Larry Bird", 1985: "Kareem Abdul-Jabbar", 1986: "Larry Bird", 1987: "Magic Johnson", 1988: "James Worthy",
    1989: "Joe Dumars", 1990: "Isiah Thomas", 1991: "Michael Jordan", 1992: "Michael Jordan", 1993: "Michael Jordan",
    1994: "Hakeem Olajuwon", 1995: "Hakeem Olajuwon", 1996: "Michael Jordan", 1997: "Michael Jordan", 1998: "Michael Jordan",
    1999: "Tim Duncan", 2000: "Shaquille O'Neal", 2001: "Shaquille O'Neal", 2002: "Shaquille O'Neal", 2003: "Tim Duncan",
    2004: "Chauncey Billups", 2005: "Tim Duncan", 2006: "Dwyane Wade", 2007: "Tony Parker", 2008: "Paul Pierce",
    2009: "Kobe Bryant", 2010: "Kobe Bryant", 2011: "Dirk Nowitzki", 2012: "LeBron James", 2013: "LeBron James",
    2014: "Kawhi Leonard", 2015: "Andre Iguodala", 2016: "LeBron James", 2017: "Kevin Durant", 2018: "Kevin Durant",
    2019: "Kawhi Leonard", 2020: "LeBron James", 2021: "Giannis Antetokounmpo", 2022: "Stephen Curry", 2023: "Nikola Jokic",
    2024: "Jaylen Brown", 2025: "Shai Gilgeous-Alexander", 2026: "Jalen Brunson",
}

# オールスターMVP(開催年 → 選手。共同受賞は複数)。出典: CBS Sports「NBA All-Star Game MVPs: a complete list」(1951-2023)、
# 1959 の共同受賞(エルジン・ベイラー)と 2024-2026 は Wikipedia「NBA All-Star Game Kobe Bryant Most Valuable Player Award」
ALL_STAR_MVP: dict[int, list[str]] = {
    1951: ["Ed Macauley"], 1952: ["Paul Arizin"], 1953: ["George Mikan"], 1954: ["Bob Cousy"], 1955: ["Bill Sharman"],
    1956: ["Bob Pettit"], 1957: ["Bob Cousy"], 1958: ["Bob Pettit"], 1959: ["Bob Pettit", "Elgin Baylor"],
    1960: ["Wilt Chamberlain"], 1961: ["Oscar Robertson"], 1962: ["Bob Pettit"], 1963: ["Bill Russell"],
    1964: ["Oscar Robertson"], 1965: ["Jerry Lucas"], 1966: ["Adrian Smith"], 1967: ["Rick Barry"], 1968: ["Hal Greer"],
    1969: ["Oscar Robertson"], 1970: ["Willis Reed"], 1971: ["Lenny Wilkens"], 1972: ["Jerry West"], 1973: ["Dave Cowens"],
    1974: ["Bob Lanier"], 1975: ["Walt Frazier"], 1976: ["Dave Bing"], 1977: ["Julius Erving"], 1978: ["Randy Smith"],
    1979: ["David Thompson"], 1980: ["George Gervin"], 1981: ["Nate Archibald"], 1982: ["Larry Bird"], 1983: ["Julius Erving"],
    1984: ["Isiah Thomas"], 1985: ["Ralph Sampson"], 1986: ["Isiah Thomas"], 1987: ["Tom Chambers"], 1988: ["Michael Jordan"],
    1989: ["Karl Malone"], 1990: ["Magic Johnson"], 1991: ["Charles Barkley"], 1992: ["Magic Johnson"],
    1993: ["Karl Malone", "John Stockton"], 1994: ["Scottie Pippen"], 1995: ["Mitch Richmond"], 1996: ["Michael Jordan"],
    1997: ["Glen Rice"], 1998: ["Michael Jordan"], 2000: ["Shaquille O'Neal", "Tim Duncan"], 2001: ["Allen Iverson"],
    2002: ["Kobe Bryant"], 2003: ["Kevin Garnett"], 2004: ["Shaquille O'Neal"], 2005: ["Allen Iverson"], 2006: ["LeBron James"],
    2007: ["Kobe Bryant"], 2008: ["LeBron James"], 2009: ["Kobe Bryant", "Shaquille O'Neal"], 2010: ["Dwyane Wade"],
    2011: ["Kobe Bryant"], 2012: ["Kevin Durant"], 2013: ["Chris Paul"], 2014: ["Kyrie Irving"], 2015: ["Russell Westbrook"],
    2016: ["Russell Westbrook"], 2017: ["Anthony Davis"], 2018: ["LeBron James"], 2019: ["Kevin Durant"],
    2020: ["Kawhi Leonard"], 2021: ["Giannis Antetokounmpo"], 2022: ["Stephen Curry"], 2023: ["Jayson Tatum"],
    2024: ["Damian Lillard"], 2025: ["Stephen Curry"], 2026: ["Anthony Edwards"],
}

# シーズン途中で引退し、優勝チームのプレーオフに出ていない選手(シーズン最後の所属だけでは判定できない)
NOT_CHAMPION = {("Elgin Baylor", 1972)}  # 1971-72 の9試合目で引退。NBA・Basketball-Reference とも優勝回数に数えない

AWARD_SHARE_DESCRIPTIONS = {
    "nba mvp": "NBA Most Valuable Player",
    "nba dpoy": "NBA Defensive Player of the Year",
    "nba roy": "NBA Rookie of the Year",
    "baa roy": "NBA Rookie of the Year",
    "nba mip": "NBA Most Improved Player",
    "nba smoy": "NBA Sixth Man of the Year",
    "nba clutch_poy": "NBA Clutch Player of the Year",
}
END_OF_SEASON_DESCRIPTIONS = {
    "All-NBA": "All-NBA",
    "All-BAA": "All-NBA",  # NBA は前身 BAA のオールチームも All-NBA として数える
    "All-Defense": "All-Defensive Team",
    "All-Rookie": "All-Rookie Team",
}
TEAM_NUMBER = {"1st": 1, "2nd": 2, "3rd": 3}


def read(data_dir: Path, name: str) -> list[dict]:
    with open(data_dir / name, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def num(value: str | None) -> int | None:
    if value in (None, "", "NA"):
        return None
    return int(round(float(value)))


def award(description: str, season_end: int | None, team: int | None = None) -> dict:
    # シーズンは開始年(2023 = 2023-24)で持つ。データセットは終了年なので 1 を引く
    return {
        "description": description,
        "season": season_end - 1 if season_end is not None else None,
        "allNbaTeam": team,
        "type": "Award",
        "month": None,
        "week": None,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--out", default=str(OUT_PATH))
    args = parser.parse_args()
    data_dir = Path(args.data_dir)

    info_rows = read(data_dir, "Player Career Info.csv")
    totals = read(data_dir, "Player Totals.csv")
    drafts = read(data_dir, "Draft Pick History.csv")
    shares = read(data_dir, "Player Award Shares.csv")
    teams_eos = read(data_dir, "End of Season Teams.csv")
    all_stars = read(data_dir, "All-Star Selections.csv")
    team_abbrev = read(data_dir, "Team Abbrev.csv")
    latest_season = max(int(r["season"]) for r in totals)

    info_by_name: dict[str, list[dict]] = defaultdict(list)
    info_by_id = {r["player_id"]: r for r in info_rows}
    for r in info_rows:
        info_by_name[normalize(r["player"])].append(r)

    abbr_by_season_name = {(int(r["season"]), r["team"].rstrip("*")): r["abbreviation"] for r in team_abbrev}

    problems: list[str] = []
    out: list[dict] = []
    for name, in_50, slug in LEGENDS:
        if name in BREF_ID_OVERRIDES:
            info = info_by_id.get(BREF_ID_OVERRIDES[name])
        else:
            matches = info_by_name.get(normalize(name), [])
            info = matches[0] if len(matches) == 1 else None
            if len(matches) != 1:
                problems.append(f"{name}: 選手情報が {len(matches)} 件")
                continue
        if info is None:
            problems.append(f"{name}: 選手IDが見つかりません")
            continue
        pid = info["player_id"]

        rows = [r for r in totals if r["player_id"] == pid and r["lg"] in ("NBA", "BAA")]
        if not rows:
            problems.append(f"{name}: レギュラーシーズン成績がありません")
            continue
        regular = []
        last_team_by_season: dict[int, str] = {}
        for r in rows:
            season_end = int(r["season"])
            team = r["team"]
            is_total = team.endswith("TM")
            if not is_total:
                # 同じシーズンのチーム別の行は在籍順に並んでいる → 最後の行がシーズン終了時(プレーオフ時)の所属
                last_team_by_season[season_end] = team
            regular.append({
                "season": season_end - 1,
                "team": "TOT" if is_total else team,
                "isTotal": is_total,
                "age": num(r["age"]),
                "gp": num(r["g"]), "gs": num(r["gs"]), "min": num(r["mp"]),
                "fgm": num(r["fg"]), "fga": num(r["fga"]), "fg3m": num(r["x3p"]), "fg3a": num(r["x3pa"]),
                "ftm": num(r["ft"]), "fta": num(r["fta"]), "oreb": num(r["orb"]), "dreb": num(r["drb"]),
                "reb": num(r["trb"]), "ast": num(r["ast"]), "stl": num(r["stl"]), "blk": num(r["blk"]),
                "tov": num(r["tov"]), "pf": num(r["pf"]), "pts": num(r["pts"]),
            })
        regular.sort(key=lambda r: (r["season"], not r["isTotal"]))

        awards: list[dict] = []
        for r in shares:
            if r["player_id"] == pid and r["winner"] == "TRUE" and r["award"] in AWARD_SHARE_DESCRIPTIONS:
                awards.append(award(AWARD_SHARE_DESCRIPTIONS[r["award"]], int(r["season"])))
        for r in teams_eos:
            if r["player_id"] == pid and r["type"] in END_OF_SEASON_DESCRIPTIONS:
                awards.append(award(END_OF_SEASON_DESCRIPTIONS[r["type"]], int(r["season"]), TEAM_NUMBER.get(r["number_tm"])))
        for r in all_stars:
            if r["player_id"] == pid and r["lg"] == "NBA":
                awards.append(award("NBA All-Star", int(r["season"])))
        for year, champ in CHAMPIONS.items():
            abbr = abbr_by_season_name.get((year, champ))
            if abbr is None:
                problems.append(f"優勝チームの略称が見つかりません: {year} {champ}")
            elif last_team_by_season.get(year) == abbr and (name, year) not in NOT_CHAMPION:
                awards.append(award("NBA Champion", year))
        for year, winner in FINALS_MVP.items():
            if normalize(winner) == normalize(name):
                awards.append(award("NBA Finals Most Valuable Player", year))
        for year, winners in ALL_STAR_MVP.items():
            if any(normalize(w) == normalize(name) for w in winners):
                awards.append(award("NBA All-Star Most Valuable Player", year))
        if info["hof"] == "TRUE":
            awards.append(award("Hall of Fame Inductee", None))

        draft = next((d for d in drafts if d["player_id"] == pid and d["lg"] in ("NBA", "BAA")), None)
        ht = num(info["ht_in_in"])
        wt = num(info["wt"])
        seasons_played = sorted({r["season"] for r in regular})
        out.append({
            "slug": slug,
            "personId": pid,
            "name": name,
            "greatest50": in_50,
            "greatest75": True,
            "birthDate": info["birth_date"] if info["birth_date"] not in ("", "NA") else None,
            "heightCm": round(ht * 2.54) if ht else None,
            "weightKg": round(wt * 0.45359237, 1) if wt else None,
            "position": info["pos"] if info["pos"] not in ("", "NA") else None,
            "school": info["colleges"] if info["colleges"] not in ("", "NA") else None,
            "country": None,
            "fromYear": seasons_played[0],
            "toYear": seasons_played[-1],
            "draftYear": int(draft["season"]) if draft else None,
            "draftRound": num(draft["round"]) if draft else None,
            "draftNumber": num(draft["overall_pick"]) if draft else None,
            "draftTeam": draft["tm"] if draft else None,
            "isActive": int(info["to"]) >= latest_season,
            "hallOfFame": info["hof"] == "TRUE",
            "regularSeason": regular,
            "playoffs": [],
            "awards": awards,
        })
        print(f"OK {name} ({pid}) {len(seasons_played)}シーズン 受賞{len(awards)}件")

    if problems:
        print("\n次を確認してください(JSONは書き出していません):", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(
            {
                "source": "Basketball-Reference (sumitrodatta/bball-reference-datasets)",
                "generatedAt": time.strftime("%Y-%m-%d"),
                "latestSeason": latest_season - 1,
                "playoffsAvailable": False,
                "legends": out,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    print(f"\n{len(out)}人分を書き出しました: {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
