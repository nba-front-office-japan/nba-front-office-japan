"""レジェンドのプレーオフ成績を data/legends/legends.json に取り込む。

入力: Basketball-Reference の選手ページで「Totals」「Playoffs」の表を「Get table as CSV」で出したものを、
      1つのテキストファイルに続けて貼り付けたもの(選手名は不要)。
      各ブロックは "Season,Age,Team,Lg,..." の見出し行から始まる。通算行("18 Yrs" など)・空行は読み飛ばす。

選手の判定: ブロック内の (シーズン, チーム, 年齢) が、レギュラーシーズンの記録(legends.json)と最も多く一致する選手。
  シーズン行の合計(試合数・出場時間・得点・リバウンド・アシスト)が表の通算行と一致しないブロックは取り込まない。
  一致が少ない(プレーオフ出場シーズンの8割未満)ブロックは判定できないとして表示し、取り込まない。
  Per Game(1試合平均)の表が貼られた場合(MP に小数がある等)は取り込まない。

使い方: python scripts/import-legend-playoffs.py playoffs.txt
  取り込めた選手は playoffs に成績が入り playoffsLoaded=true になる。もう一度実行すると上書き(同じ選手は最新の貼り付けを使う)。
"""

from __future__ import annotations

import csv
import io
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JSON_PATH = ROOT / "data" / "legends" / "legends.json"

TEAM_ALIASES = {"TOT": "TOT"}  # B-Ref の 2TM/3TM は TOT に寄せる


def num(v: str) -> int | None:
    v = (v or "").strip()
    if v == "":
        return None
    f = float(v)
    return int(round(f))


def parse_blocks(text: str) -> list[list[dict]]:
    blocks: list[list[str]] = []
    for line in text.splitlines():
        if line.startswith("Season,Age,Team"):
            blocks.append([line])
        elif blocks and line.strip():
            blocks[-1].append(line)
    result = []
    for lines in blocks:
        rows = list(csv.DictReader(io.StringIO("\n".join(lines))))
        seasons = [r for r in rows if (r.get("Season") or "")[:4].isdigit() and "-" in r["Season"] and (r.get("G") or "").strip()]
        career = next((r for r in rows if (r.get("Season") or "").endswith("Yrs")), None)
        result.append((seasons, career))
    return result


def matches_career(rows: list[dict], career: dict | None) -> bool:
    # 貼り付け漏れ・途中で切れた貼り付けを見つけるため、シーズン行の合計が通算行("18 Yrs")と一致するか確かめる
    if career is None:
        return False
    for key in ("G", "MP", "PTS", "TRB", "AST"):
        total = sum(num(r[key]) or 0 for r in rows if not r["Team"].endswith("TM"))
        if (num(career.get(key, "")) or 0) != total:
            return False
    return True


def looks_per_game(rows: list[dict]) -> bool:
    # Totals の MP・PTS は整数。小数が混ざっていれば Per Game の表
    return any("." in (r.get("PTS") or "") or "." in (r.get("MP") or "") for r in rows)


def main() -> int:
    if len(sys.argv) != 2:
        print("使い方: python scripts/import-legend-playoffs.py playoffs.txt", file=sys.stderr)
        return 2
    text = Path(sys.argv[1]).read_text(encoding="utf-8-sig")
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    legends = data["legends"]

    keys_by_slug = {
        l["slug"]: {(r["season"], "TOT" if r["isTotal"] else r["team"], r["age"]) for r in l["regularSeason"]}
        for l in legends
    }

    imported, problems = [], []
    for i, (rows, career) in enumerate(parse_blocks(text), 1):
        if not rows:
            continue
        label = f"{i}番目の表({rows[0]['Season']}〜{rows[-1]['Season']}, {rows[0]['Team']})"
        if looks_per_game(rows):
            problems.append(f"{label}: 1試合平均(Per Game)の表です。Totals の表を貼ってください")
            continue
        if not matches_career(rows, career):
            problems.append(f"{label}: シーズンの合計が通算行と一致しません(貼り付けが途中で切れていないか確認してください)")
            continue
        block_keys = {
            (int(r["Season"][:4]), "TOT" if r["Team"].endswith("TM") else r["Team"], num(r["Age"])) for r in rows
        }
        scored = sorted(((len(block_keys & keys), slug) for slug, keys in keys_by_slug.items()), reverse=True)
        best, slug = scored[0]
        if best < 0.8 * len(block_keys) or (len(scored) > 1 and scored[1][0] == best):
            problems.append(f"{label}: どの選手か判定できません")
            continue
        legend = next(l for l in legends if l["slug"] == slug)
        playoffs = []
        for r in rows:
            team = r["Team"]
            is_total = team.endswith("TM")
            playoffs.append({
                "season": int(r["Season"][:4]),
                "team": "TOT" if is_total else team,
                "isTotal": is_total,
                "age": num(r["Age"]),
                "gp": num(r["G"]), "gs": num(r["GS"]), "min": num(r["MP"]),
                "fgm": num(r["FG"]), "fga": num(r["FGA"]), "fg3m": num(r["3P"]), "fg3a": num(r["3PA"]),
                "ftm": num(r["FT"]), "fta": num(r["FTA"]), "oreb": num(r["ORB"]), "dreb": num(r["DRB"]),
                "reb": num(r["TRB"]), "ast": num(r["AST"]), "stl": num(r["STL"]), "blk": num(r["BLK"]),
                "tov": num(r["TOV"]), "pf": num(r["PF"]), "pts": num(r["PTS"]),
            })
        legend["playoffs"] = playoffs
        legend["playoffsLoaded"] = True
        imported.append(f"{legend['name']}: {len(playoffs)}行")

    retired = [l for l in legends if not l["isActive"]]
    missing = [l["name"] for l in retired if not l.get("playoffsLoaded")]
    data["playoffsAvailable"] = len(missing) == 0
    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    print(f"取り込み: {len(imported)}人")
    for s in imported:
        print("  OK", s)
    if problems:
        print("\n取り込めなかった表:")
        for p in problems:
            print("  -", p)
    print(f"\nまだ無い選手({len(missing)}人): {', '.join(missing) if missing else 'なし'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
