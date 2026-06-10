# Update08 Report

## 状態
完了（ローカル実装・静的検証済み、プレビュー同期はPush後確認が必要）

## 実装結果
- 保存データ表示モードの型候補一覧で、武将系候補は保存データの所有武将、装備候補は所有装備、名馬/軍馬技能候補は登録済み名馬がある場合に限定するようにした。
- 全データ表示では所有情報フィルターを適用しない。
- 型候補一覧に「この型で新規部隊」を追加し、選択中の型を新規部隊へ自動入力するようにした。
- 既存部隊は上書きせず、新規部隊として追加する。
- 部隊レコードに評価型名、トータルスコア、評価スコア、マイメモ、履歴、グループIDを保存するようにした。
- 1部隊10履歴、1グループ12部隊、最大5グループの上限を保存時の正規化とUI操作で適用した。

## 変更ファイル
- `hado_formation.js`
- `hado_core.js`
- `hado_type_candidates.js`
- `HADO_DEV_INFO.json`
- `hado_update_meta.js`
- `docs/updates/roadmap.md`
- `docs/updates/update08/roadmap.md`
- `docs/updates/update08/implementation.md`
- `docs/updates/update08/report.md`

## HTMLサイズと外部化
- HTML変更なし。
- Update08の新規挙動は外部JSへ実装した。

## 検証結果
- JavaScript構文検証: 成功。
- JSON構文検証: 成功。
- アプリJS検証: 成功。
- `updates/queue` は存在しない。

## プレビュー同期
この作業環境ではPush後のGitHub Actions結果とプレビューURLの実機確認は未実行。コミット後、push-triggered `Notify Hado Library Preview` の成功とデプロイcommit一致を確認する。

## ユーザー受け入れ確認
1. 保存データ表示に切り替え、所有武将・装備のみが型候補一覧に出ることを確認する。
2. 型候補一覧から「この型で新規部隊」を押し、既存部隊が上書きされず新規部隊が追加されることを確認する。
3. 評価スコアとマイメモを入力し、「履歴へ保存」で履歴が最大10件に収まることを確認する。
4. グループ追加と部隊追加で最大5グループ、各12部隊の上限が機能することを確認する。
