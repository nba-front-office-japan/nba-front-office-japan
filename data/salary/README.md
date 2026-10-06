# サラリーの補助データ

## contract-status.csv（Qualifying Offer・Two-Way Contract）

選手サラリーの「契約状況」に表示する Q（Qualifying Offer）・TW（Two-Way Contract）を登録するファイルです。
元データの Excel（NBA Payroll 2026-27–2031-32）には Q・TW を判定できる情報がないため、
出典で確認できた選手だけをここに1行ずつ登録します。推測では登録しません。

| 列 | 内容 | 例 |
|---|---|---|
| team | チーム略称（Excel のチームと同じチーム） | NYK |
| player | 選手名（Excel のチームシートと同じ表記） | Kevin McCullar Jr. |
| season | 対象の年度 | 2026-27 |
| status | `Q` または `TW` | TW |
| source | 出典（確認したページのURLなど。空欄不可） | https://… |

登録後、次のコマンドでサイト用のデータ（lib/salary/payroll-data.ts）を作り直します。

```
python scripts/build-salary-data.py "<Excelのパス>"
```

Excel に載っていない選手・チーム、年度や status の書き間違い、出典の空欄はエラーになり、データは作られません。
