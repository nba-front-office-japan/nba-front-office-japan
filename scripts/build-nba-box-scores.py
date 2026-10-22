"""NBA_Box_Scores YYYYMMDD.xlsx を作る(NBA公式の試合ページの __NEXT_DATA__ から)。

出力の書式は、管理画面の「ボックススコア Excel更新」が受け付ける NBA公式書式と同じ
(シート: Game Summary / Player Box Scores / Team Totals / Metadata / Errors)。

検査(必須):
  試合ごと・チームごとに、Excel に「書き出す」選手行の合計(FG, FGA, 3P, 3PA, FT, FTA, ORB, DRB, TRB,
  AST, STL, BLK, TOV, PF, PTS, MIN)が Team Totals と一致すること。あわせて Q1〜Q4・OT の合計 = Total。
  一致しない試合は、その試合だけ NBA公式の出典 URL から取り直して再照合する(--max-refetch 回まで)。
  取り直しても一致しなければ、Excel を完成データとして出力せず、試合・不足項目・出典 URL を表示して失敗(終了コード 1)にする。
  選手のデータを推測・補完することはしない。

出場の判定:
  出典の minutes が 0:00 より大きい選手を「Played」とし、その成績を書き出す。
  NBA公式のデータには、出場時間と成績があるのに comment が "DNP - Coach's Decision" の選手がいる
  (2026-10-21 の Liam McNeeley 3:18、Larry Nance Jr. 5:14)。comment の文字を優先して成績を空欄にすると、
  選手の合計がチーム合計より少なくなるため、出場時間と成績を優先し、comment はそのまま残して Errors シートに記録する。

取得元へのアクセス:
  --offline を付けると、--cache-dir に保存済みのページだけを使い、ネットワークには接続しない(検証用)。
  付けない場合は NBA公式の試合一覧ページ・各試合のボックススコアページを取得し、--cache-dir に保存する。
  ESPN のスコア照合は --espn を付けたときだけ行う(保存済みの ESPN データがあれば --offline でも使う)。

使い方:
  python scripts/build-nba-box-scores.py --date 2026-10-21 --cache-dir <保存先> --out "NBA_Box_Scores 20261021.xlsx" [--offline] [--espn]

キャッシュのファイル名:
  games_<date>.html(NBA公式の試合一覧) / nba_<gameId>.html(試合のボックススコア) /
  espn_scoreboard_<yyyymmdd>.json / espn_<eventId>.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

USER_AGENT = "Mozilla/5.0"
NEXT_DATA_RE = re.compile(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.S)

# (Excel の列名, NBA公式の statistics のキー)
STATS = [
    ("MIN", "minutes"),
    ("FG", "fieldGoalsMade"),
    ("FGA", "fieldGoalsAttempted"),
    ("FG%", "fieldGoalsPercentage"),
    ("3P", "threePointersMade"),
    ("3PA", "threePointersAttempted"),
    ("3P%", "threePointersPercentage"),
    ("FT", "freeThrowsMade"),
    ("FTA", "freeThrowsAttempted"),
    ("FT%", "freeThrowsPercentage"),
    ("ORB", "reboundsOffensive"),
    ("DRB", "reboundsDefensive"),
    ("TRB", "reboundsTotal"),
    ("AST", "assists"),
    ("STL", "steals"),
    ("BLK", "blocks"),
    ("TOV", "turnovers"),
    ("PF", "foulsPersonal"),
    ("PTS", "points"),
    ("+/-", "plusMinusPoints"),
]
# 選手の合計とチーム合計が一致しなければならない項目(率と +/- は除く。MIN は秒で比べる)
COUNTING = [(label, key) for label, key in STATS if label not in ("MIN", "FG%", "3P%", "FT%", "+/-")]

HEADERS = {
    "Game Summary": [
        "Game ID", "Date (ET)", "Start UTC", "Status", "Away", "Home", "Away Total", "Home Total", "Arena", "Attendance",
        "Periods", "Away Q1", "Away Q2", "Away Q3", "Away Q4", "Away OT", "Home Q1", "Home Q2", "Home Q3", "Home Q4",
        "Home OT", "Line Score Check", "Player PTS Check", "ESPN Score Check",
    ],
    "Player Box Scores": ["Game ID", "Date (ET)", "Team", "Side", "NBA Player ID", "Basketball-Reference ID", "Player", "Position", "Status", "Comment"]
    + [label for label, _ in STATS],
    "Team Totals": ["Game ID", "Date (ET)", "Team", "Side"] + [label for label, _ in STATS]
    + ["Q1", "Q2", "Q3", "Q4", "OT", "Total", "Team Rebounds", "Team Turnovers"],
    "Metadata": ["Type", "Game ID", "Key", "Value", "URL", "Retrieved UTC"],
    "Errors": ["Game ID", "Team", "Player ID", "Field / Scope", "Issue", "Detail", "Source URL"],
}

ESPN_ABBR = {"NY": "NYK", "GS": "GSW", "SA": "SAS", "NO": "NOP", "UTAH": "UTA", "WSH": "WAS"}


class SourceUnavailable(Exception):
    pass


def minutes_to_seconds(value: str | None) -> int:
    if not value:
        return 0
    m = re.fullmatch(r"(\d+):(\d{2})", value.strip())
    if m:
        return int(m.group(1)) * 60 + int(m.group(2))
    m = re.fullmatch(r"PT(\d+)M(\d+)(?:\.\d+)?S", value.strip())  # ISO 8601 の書き方が来た場合
    if m:
        return int(m.group(1)) * 60 + int(m.group(2))
    raise ValueError(f"MIN を読めません: {value!r}")


def mmss(seconds: int) -> str:
    return f"{seconds // 60}:{seconds % 60:02d}"


class Source:
    """取得元(NBA公式・ESPN)。--offline のときは保存済みのファイルだけを読む。"""

    def __init__(self, cache_dir: Path, offline: bool):
        self.cache_dir = cache_dir
        self.offline = offline
        cache_dir.mkdir(parents=True, exist_ok=True)

    def get(self, name: str, url: str, refresh: bool = False) -> str:
        path = self.cache_dir / name
        if path.exists() and not refresh:
            return path.read_text(encoding="utf-8")
        if self.offline:
            raise SourceUnavailable(f"{name} がキャッシュにありません(--offline のため取得しません): {url}")
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
                with urllib.request.urlopen(req, timeout=35) as res:
                    body = res.read().decode("utf-8")
                path.write_text(body, encoding="utf-8")
                return body
            except Exception as e:  # noqa: BLE001 - 取得失敗は理由を残して再試行する
                last_error = e
                time.sleep(2 ** attempt)
        raise SourceUnavailable(f"{url} を取得できませんでした: {last_error}")


def next_data(html: str) -> dict:
    m = NEXT_DATA_RE.search(html)
    if not m:
        raise SourceUnavailable("ページに __NEXT_DATA__ がありません")
    return json.loads(m.group(1))


def list_games(src: Source, date: str) -> list[dict]:
    """NBA公式の試合一覧ページから、その日(米国東部)の試合の gameId・出典 URL を取り出す。"""
    url = f"https://www.nba.com/games?date={date}"
    props = next_data(src.get(f"games_{date}.html", url))["props"]["pageProps"]
    games = []
    for module in props.get("gameCardFeed", {}).get("modules", []):
        for card in module.get("cards", []):
            data = card.get("cardData", {})
            if "gameId" in data:
                games.append({"gameId": data["gameId"], "url": data["shareUrl"] + "/box-score", "status": data.get("gameStatusText")})
    return games


def build_game(game: dict, date: str):
    """1試合分の行を作り、書き出す行で検査する。戻り値: (行の組, 検査で見つかった不一致の一覧, 出典の矛盾の一覧)"""
    gid = game["gameId"]
    sides = {"away": game["awayTeam"], "home": game["homeTeam"]}
    player_rows, total_rows, mismatches, conflicts = [], [], [], []
    line_ok = True
    pts_ok = True
    for side, team in sides.items():
        tri = team["teamTricode"]
        written = []  # Excel に書き出す選手行の成績(検査に使う)
        for p in team["players"]:
            st = p["statistics"]
            comment = (p.get("comment") or "").strip()
            seconds = minutes_to_seconds(st.get("minutes"))
            played = seconds > 0
            has_stats = any(st.get(k) for _, k in COUNTING)
            if played:
                status = "Played"
                if comment:
                    # 出典の矛盾: 出場時間・成績があるのに DNP などのコメント。成績を優先し、コメントは残して記録する
                    conflicts.append([gid, tri, str(p["personId"]), "Status / comment", "Source inconsistency",
                                      f"{p['firstName']} {p['familyName']}: minutes={st.get('minutes')} with comment={comment!r}; exported as Played with source statistics"])
            else:
                status = "Inactive" if comment.lower().startswith("inactive") else ("DNP" if comment.upper().startswith("DNP") else "Not played")
                if has_stats:
                    conflicts.append([gid, tri, str(p["personId"]), "Status / statistics", "Source inconsistency",
                                      f"{p['firstName']} {p['familyName']}: no minutes but statistics present; statistics left blank"])
            values = [st.get(k) if played else None for _, k in STATS]
            player_rows.append([gid, date, tri, side, str(p["personId"]), None, f"{p['firstName']} {p['familyName']}".strip(),
                                p.get("position") or None, status, comment or None] + values)
            if played:
                written.append(st)

        tstats = team["statistics"]
        # 検査: 書き出す選手行の合計 = チーム合計(MIN は秒)
        for label, key in COUNTING:
            total = sum((s.get(key) or 0) for s in written)
            if total != tstats.get(key):
                mismatches.append((tri, label, total, tstats.get(key)))
        # 出典の選手ごとの出場時間は秒単位に丸められているため、合計は数秒ずれることがある(2026-10-21 は最大 ±1秒)。
        # 出場した選手1人につき1秒までのずれは丸めとして認める(選手1人分の欠落は分単位でずれるため見逃さない)
        player_seconds = sum(minutes_to_seconds(s.get("minutes")) for s in written)
        team_seconds = minutes_to_seconds(tstats.get("minutes"))
        if abs(player_seconds - team_seconds) > len(written):
            mismatches.append((tri, "MIN", mmss(player_seconds), mmss(team_seconds)))
        pts_ok &= sum((s.get("points") or 0) for s in written) == team["score"]

        periods = {pp["period"]: pp["score"] for pp in team["periods"]}
        ot = sum(v for k, v in periods.items() if k > 4)
        line_ok &= sum(periods.values()) == team["score"]
        chart = game.get("postgameCharts", {}).get(f"{side}Team", {}).get("statistics", {})
        total_rows.append([gid, date, tri, side] + [tstats.get(k) for _, k in STATS]
                          + [periods.get(i) for i in range(1, 5)] + [ot, team["score"], chart.get("reboundsTeam"), chart.get("turnoversTeam")])

    def line(team):
        pr = {pp["period"]: pp["score"] for pp in team["periods"]}
        return [pr.get(i) for i in range(1, 5)] + [sum(v for k, v in pr.items() if k > 4)]

    a, h = sides["away"], sides["home"]
    start = dt.datetime.strptime(game["gameTimeUTC"], "%Y-%m-%dT%H:%M:%SZ")
    summary = [gid, date, start, game["gameStatusText"], a["teamTricode"], h["teamTricode"], a["score"], h["score"],
               game["arena"]["arenaName"], game.get("attendance"), game["period"]] + line(a) + line(h) + [
        "Match" if line_ok else "Mismatch", "Match" if pts_ok else "Mismatch", None]
    return {"summary": summary, "players": player_rows, "totals": total_rows}, mismatches, conflicts, line_ok


def espn_check(src: Source, date: str, built: dict, enabled: bool, errors: list, meta: list, now: str):
    """ESPN の最終スコアと照合する(--espn のときだけ。保存済みデータがあればそれを使う)。"""
    ymd = date.replace("-", "")
    if not enabled:
        for b in built.values():
            b["summary"][-1] = "Not checked"
        return
    try:
        events = json.loads(src.get(f"espn_scoreboard_{ymd}.json",
                                    f"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates={ymd}"))["events"]
    except SourceUnavailable as e:
        errors.append(["", "", "", "ESPN score check", "Unavailable", str(e), ""])
        for b in built.values():
            b["summary"][-1] = "Not checked"
        return
    for gid, b in built.items():
        s = b["summary"]
        away, home, a_score, h_score = s[4], s[5], s[6], s[7]
        match = [e for e in events if {ESPN_ABBR.get(c["team"]["abbreviation"], c["team"]["abbreviation"]) for c in e["competitions"][0]["competitors"]} == {away, home}]
        if len(match) != 1:
            s[-1] = "Not matched"
            errors.append([gid, "", "", "Final score", "ESPN cross-check", "Not matched", b["url"]])
            continue
        e = match[0]
        scores = {c["homeAway"]: int(c["score"]) for c in e["competitions"][0]["competitors"]}
        s[-1] = "Match" if scores.get("away") == a_score and scores.get("home") == h_score else "Mismatch"
        meta.append(["Source", gid, "ESPN score check", s[-1], f"https://www.espn.com/nba/boxscore/_/gameId/{e['id']}", now])
        if s[-1] != "Match":
            errors.append([gid, "", "", "Final score", "ESPN cross-check", s[-1], b["url"]])


def write_workbook(path: Path, sheets: dict[str, list[list]]):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill

    wb = Workbook()
    wb.remove(wb.active)
    for name, rows in sheets.items():
        ws = wb.create_sheet(name)
        for row in rows:
            ws.append(row)
        for cell in ws[1]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill("solid", fgColor="203C5B")
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.freeze_panes = "A2"
        header = rows[0]
        for col, title in enumerate(header, start=1):
            letter = ws.cell(row=1, column=col).column_letter
            ws.column_dimensions[letter].width = 14
            for r in range(2, len(rows) + 1):
                c = ws.cell(row=r, column=col)
                if title in ("Game ID",):
                    c.number_format = "@"
                elif title == "Date (ET)":
                    c.number_format = "yyyy-mm-dd"
                elif title in ("Start UTC", "Retrieved UTC"):
                    c.number_format = "yyyy-mm-dd hh:mm"
                elif title in ("FG%", "3P%", "FT%"):
                    c.number_format = "0.000"
    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--date", required=True, help="米国東部の試合日 YYYY-MM-DD")
    ap.add_argument("--cache-dir", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--offline", action="store_true", help="保存済みのページだけを使う(ネットワークに接続しない)")
    ap.add_argument("--espn", action="store_true", help="ESPN の最終スコアと照合する")
    ap.add_argument("--max-refetch", type=int, default=2, help="検査が通らない試合を取り直す回数")
    args = ap.parse_args()
    # Windows のコンソール(cp932)でも日本語のメッセージが読めるようにする
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")

    date = args.date
    date_cell = dt.datetime.strptime(date, "%Y-%m-%d")
    now = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
    src = Source(args.cache_dir, args.offline)

    errors: list[list] = []
    meta: list[list] = [
        ["Run", "", "Target date", f"{date} (America/New_York)", "", now],
        ["Run", "", "Method", "NBA.com embedded __NEXT_DATA__" + ("; ESPN independent score check" if args.espn else ""), "", now],
        ["Run", "", "Missing values", "Blank means unavailable. Nonparticipants have blank statistics; comments preserved. OT=0 means no overtime.", "", now],
        ["Run", "", "MIN / rates", "MIN is exact source mm:ss text; rates are source fractions, displayed to 3 decimals.", "", now],
        ["Run", "", "Basketball-Reference ID", "Unavailable; NBA player IDs provided instead. No IDs inferred.", "", now],
        ["Run", "", "Player / team check", "Required: per team, the exported player rows sum to Team Totals (FG, FGA, 3P, 3PA, FT, FTA, ORB, DRB, TRB, AST, STL, BLK, TOV, PF, PTS, MIN).", "", now],
        ["Run", "", "Played rule", "A player with source minutes > 0:00 is exported as Played with source statistics, even if the source comment says DNP (recorded in Errors).", "", now],
    ]

    try:
        games = list_games(src, date)
    except SourceUnavailable as e:
        print(f"失敗: 試合一覧を取得できません: {e}", file=sys.stderr)
        return 1
    if not games:
        print(f"失敗: {date} の試合が試合一覧にありません", file=sys.stderr)
        return 1

    def fetch_and_check(gid: str, url: str):
        """1試合を取得して検査する。一致しなければその試合だけ取り直す。戻り値: (行の組 | None, 失敗の説明 | None, 出典の矛盾)"""
        attempts = 0
        while True:
            try:
                game = next_data(src.get(f"nba_{gid}.html", url, refresh=attempts > 0))["props"]["pageProps"]["game"]
            except (SourceUnavailable, KeyError, json.JSONDecodeError) as e:
                return None, f"{gid}: 出典を読み取れません({e}) {url}", []
            if game.get("gameStatusText") != "Final":
                return None, f"{gid}: Final ではありません(Status={game.get('gameStatusText')}) {url}", []
            rows, mismatches, conflicts, line_ok = build_game(game, date_cell)
            if not mismatches and line_ok:
                return rows, None, conflicts
            if args.offline or attempts >= args.max_refetch:
                detail = "、".join(f"{tri} {label} 選手合計 {s} / チーム合計 {t}" for tri, label, s, t in mismatches)
                if not line_ok:
                    detail += ("、" if detail else "") + "Q1〜Q4・OT の合計が Total と一致しない"
                tried = "取り直しなし(--offline)" if args.offline else f"{attempts}回取り直した後も"
                return None, f"{gid}: {tried}選手別データとチーム合計が一致しません({detail}) 出典: {url}", conflicts
            attempts += 1
            meta.append(["Refetch", gid, "Player / team mismatch", f"refetch {attempts}", url, now])

    built: dict[str, dict] = {}
    failures: list[str] = []
    for g in games:
        gid, url = g["gameId"], g["url"]
        rows, failure, conflicts = fetch_and_check(gid, url)
        if failure:
            failures.append(failure)
            continue
        rows["url"] = url
        built[gid] = rows
        errors.extend(c + [url] for c in conflicts)
        meta.append(["Source", gid, "NBA official box score", "Line scores, all listed players, DNP/inactive, team totals", url, now])

    if failures:
        print("失敗: 次の試合が検査を通らないため、Excel を出力しません(選手データは推測で補完しません)。", file=sys.stderr)
        for f in failures:
            print("  - " + f, file=sys.stderr)
        return 1

    espn_check(src, date, built, args.espn, errors, meta, now)

    ordered = sorted(built.values(), key=lambda b: (b["summary"][2], b["summary"][0]))
    counts: dict[str, int] = {}
    for b in ordered:
        for r in b["players"]:
            counts[r[8]] = counts.get(r[8], 0) + 1
    meta += [["Run", "", "Game count", len(ordered), "", now], ["Run", "", "Listed player rows", sum(counts.values()), "", now]]
    meta += [["Run", "", k, v, "", now] for k, v in sorted(counts.items())]

    sheets = {
        "Game Summary": [HEADERS["Game Summary"]] + [b["summary"] for b in ordered],
        "Player Box Scores": [HEADERS["Player Box Scores"]] + [r for b in ordered for r in b["players"]],
        "Team Totals": [HEADERS["Team Totals"]] + [r for b in ordered for r in b["totals"]],
        "Metadata": [HEADERS["Metadata"]] + meta,
        "Errors": [HEADERS["Errors"]] + [e + [""] * (7 - len(e)) for e in errors],
    }
    write_workbook(args.out, sheets)
    print(f"出力しました: {args.out}  試合 {len(ordered)} / チーム合計 {len(ordered) * 2} / 選手行 {sum(counts.values())} {counts}")
    print(f"出典の矛盾(Errors シートに記録): {len([e for e in errors if e[4] == 'Source inconsistency'])} 件")
    return 0


if __name__ == "__main__":
    sys.exit(main())
