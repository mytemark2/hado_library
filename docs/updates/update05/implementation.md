# Update05 実装内容
## 実施内容
- 候補トレイ責務を外部JSとして追加した。
- `evaluationTypeId` と `candidateTray` を保存した。
- 主将、副将、補佐、侍従、装備へ接続した。
- 直接代入せず、既存選択ダイアログへ委譲した。
## HTML肥大化判断
新規機能は外部化し、HTMLは読込宣言と最小限の連携に留めた。
## 旧形式資料
- `docs/HADO_APP_3.0.0.0_UPDATE05_SCOPE.md`
- `report/HADO_APP_3.0.0.0_UPDATE05_REPORT.json`
- `updates/applied/app-update05-candidate-tray-final.json`
