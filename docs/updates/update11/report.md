# Update11 Report

## 状態

完了。実装、ローカル検証、Pull Request、Actions、イベント駆動Preview同期、公開URL実操作を確認済み。

## 変更概要

- 表示版: `3.0.1.0 Update11 r160`。
- タググループ: 対象カテゴリをbadge表示し、検索カテゴリ順へ統一した。
- 状態変化検索: 状態変化とタグ入口を同一行にし、タグによるAND絞り込みを同期・非同期の全検索経路へ追加した。
- 回帰防止: タグカテゴリ対応、表示順、状態変化検索、キャッシュ、モード復元、1行CSS、版数cache keyを専用回帰で固定した。

## HTMLサイズと外部化

- 変更前: 29,254 bytes。
- 変更後: 29,230 bytes（24 bytes減）。
- 差分は外部asset cache keyの更新のみ。動作とCSSは既存外部ファイルへ実装した。

## 検証

- `node tools/test_update11_tag_organization.js`: 成功。
- `node tools/test_update09_5_60_search_mode_isolation.js`: 成功。
- `node tools/test_json_index_contract.js`: 派生JSON 20件の契約成功。
- `python -X utf8 tools/validate_update_version_consistency.py`: 成功。
- `python -X utf8 tools/validate_external_css.py`: 成功。
- `python -X utf8 tools/validate_app_js.py`: 成功。
- `python -X utf8 tools/run_app_validation.py`: 124/124 成功。
- PC表示（1280px）: 状態変化2条件・リセット・タグ入口が同一行、横overflowなし。
- スマートフォン表示（実効375px）: 同一行表示、タグpanelを含め横overflowなし。
- 実操作: 状態変化「攻撃上昇」363件にタグ「兵科:騎兵」を追加し82件へAND絞り込みされることを確認。
- タグ表示: 対象カテゴリbadge、カテゴリ順、選択済み条件のカテゴリ表示を確認。
- ブラウザconsole: error / warning なし。

## Git・Actions・Preview

- 基準ブランチ: `feature/app-3.0.0.0`。
- 基準commit: `5a06478461e756e41305c57e9b9b649f5fcb2fe4`。
- 作業ブランチ: `codex/update301-tag-organization`。
- 実装commit: `0ec6d719cc251d8e6254c5a2ef0d02b7f893960d`。
- Pull Request: [#266](https://github.com/mytemark2/hado_library/pull/266)（`feature/app-3.0.0.0`向け、merge済み）。
- 正本merge commit: `f127ca3d80682b032aa1a66e70ccbc1c8a2cc8e1`。
- `App Validation / app-validation`: run `30015078301`、成功。
- `Notify Hado Library Preview`: run `30015225348`、成功。
- `Deploy Hado Library Preview`: run `30015272034`、成功。

## Preview confirmation

- 公開URL: https://mytemark2.github.io/hado_library-preview/
- 表示版: `3.0.1.0 Update11 r160`。
- Preview repository `main`: `50fd95fc30c4052d4c0a8434cfb35329c743b624`。
- marker: `PREVIEW_SOURCE_COMMIT.txt=f127ca3d80682b032aa1a66e70ccbc1c8a2cc8e1`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.0.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.0.1.0 Update11`。
- 必須ファイル: `index.html`、`hado_formation.js`、`hado_styles.css`、`hadou_*.json`、`.nojekyll`、marker 3件を確認。
- DOM / asset: Update11のタイトル、状態変化検索、タグ入口、カテゴリbadge、`hado_search.js?v=11-r160`、`hado_styles.css?v=11-r160`を確認。
- 実操作: 公開版でも「攻撃上昇」363件に「兵科:騎兵」を追加して82件へAND絞り込み。PCの同一行配置とスマートフォン実効375pxの同一行・横overflowなしを確認。
- Debug Log / console: error / warning なし。
- 判定: PASS。

## 最小受入操作

1. 状態変化検索を開き、状態変化選択と「タグ」が同じ1行にあることを確認する。
2. 状態変化を1件選択し、対象カテゴリのタグを追加して結果が両条件のANDで減ることを確認する。
3. タグ一覧で各グループに「武将」「装備」「状態変化」などの対象カテゴリが表示され、カテゴリ順に並ぶことを確認する。
4. 通常検索、状態変化検索、型検索を切り替え、各モードのタグ条件が復元されることを確認する。

## 残課題

none
