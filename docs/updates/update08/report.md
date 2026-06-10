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
- `hado_status_effects.js`
- `tools/validate_formation_link_helpers.py`

## HTMLサイズと外部化
- HTML変更なし。
- Update08の新規挙動は外部JSへ実装した。

## Update08.1 修正
- `3.0.0.0 Update08.1` として、部隊編成描画で `formationEntityLinkHtml is not defined` が発生する問題を修正した。
- 実際にHTMLから読み込まれる `hado_status_effects.js` に編成画面用リンクヘルパーを配置した。
- 旧結合ファイル `hado_app.js` には同ヘルパーが残っていたが、現在のHTMLロード順では読み込まれないため、外部分割後の配置漏れが原因だった。
- 再発防止として、HTMLで有効なスクリプト群に編成リンクヘルパーが存在することを検証する `tools/validate_formation_link_helpers.py` を追加した。

## 検証結果
- JavaScript構文検証: 成功。
- JSON構文検証: 成功。
- アプリJS検証: 成功。
- `updates/queue` は存在しない。
- HTML有効スクリプト内の編成リンクヘルパー存在検証: 成功。
- 型候補名と保存所有名の照合検証: 成功。
- 表示バージョンを `3.0.0.0 Update08.2` へインクリメント済み。

## Update08.2 修正
- 保存データ表示の型候補一覧で候補数が少なくなる問題を調査し、保存データ側の所有名（例: `【三國志 覇道】LR司馬師`）と型候補側の短縮名（例: `LR司馬師（しばし）`）を直接比較していたことが原因と特定した。
- 保存所有名と型候補名を同じ照合キーへ正規化し、武将4役割と装備候補が所有データへ正しく一致するようにした。
- 再発防止として、型候補JSONの武将/装備候補名が保存マスタ名へ照合可能であることを検証する `tools/validate_type_candidate_saved_name_matching.py` を追加した。
- 表示バージョンを `3.0.0.0 Update08.2` へインクリメント済み。

## Update08.3 修正
- 修正ごとの視認性を担保するため、表示バージョンを `3.0.0.0 Update08.3` へインクリメントした。
- 複数ファイルで表示バージョンを直接定義しないよう、実行時フォールバックの単一定義を `hado_update_meta.js` の `HADO_VERSION` に集約した。
- 型候補一覧は固定の Update 文字列を持たず、`window.HADO_APP_DISPLAY_VERSION` / `window.HADO_APP_VERSION_META` を参照する。
- 再発防止として、メタJSON、`hado_update_meta.js`、HTML読み込み順、型候補JSのハードコード有無を検証する `tools/validate_update_version_consistency.py` を追加した。

## プレビュー同期
この作業環境ではPush後のGitHub Actions結果とプレビューURLの実機確認は未実行。コミット後、push-triggered `Notify Hado Library Preview` の成功とデプロイcommit一致を確認する。

## ユーザー受け入れ確認
1. 保存データ表示に切り替え、所有武将・装備のみが型候補一覧に出ることを確認する。
2. 型候補一覧から「この型で新規部隊」を押し、既存部隊が上書きされず新規部隊が追加されることを確認する。
3. 評価スコアとマイメモを入力し、「履歴へ保存」で履歴が最大10件に収まることを確認する。
4. グループ追加と部隊追加で最大5グループ、各12部隊の上限が機能することを確認する。
