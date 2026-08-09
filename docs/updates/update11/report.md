# Update11 Report

## Update11.2 完了報告

- 表示版: `3.0.1.0 Update11.2 r162`。
- 実装: 有効タグ完全一致時の自動追加、IME変換保護、無効入力保持、重複追加の副作用抑止、「追加」ボタン削除、3列レスポンシブ化。
- HTML: 変更前29,257 bytes、変更後29,180 bytes（77 bytes減）。HTMLはボタン削除と外部asset cache key更新のみで、動作・表示は外部JavaScript/CSSへ実装。
- 専用回帰: `node tools/test_update11_2_tag_auto_add.js` 成功。
- 全体回帰: `python -X utf8 tools/run_app_validation.py` 126/126成功。JavaScript・JSON・HTML・外部CSS・派生JSON 20件・検索・詳細・編成・保存Import / Export・レスポンシブ契約を確認した。
- ローカル実操作: 「追加」ボタンなし、部分一致入力保持、`技能:練兵` の完全一致入力で自動追加・入力欄消去・武将5件、重複入力でbadge 1件・結果5件を維持、無効な `技能:連兵` はEnter後も保持、状態変化「攻撃上昇」とタグ「技能:練兵」のAND検索5件を確認した。
- PC 1280px: 状態変化分類・状態変化・解除・タグのtop座標がすべて231pxで同一行、横overflowなし。ブラウザconsole error / warning 0件。
- IME境界: 専用回帰で `compositionstart` / `compositionend`、`isComposing`、keyCode 229の保護を固定した。
- Git: 基準 `497199f25df2208e72241925d399acc8a74297bb`、実装commit `d96d76ea8cf474e1e46ea1fc556381cf5c79ac7a`、PR [#270](https://github.com/mytemark2/hado_library/pull/270)、正本merge commit `0ea7d86c2cbaae662f7fe10ee1a5763bf04d3b11`。
- マージ準備: `python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.0.0.0` 成功。取得base `497199f25df2208e72241925d399acc8a74297bb`、head `d96d76ea8cf474e1e46ea1fc556381cf5c79ac7a`、競合なし。
- Actions: `App Validation / app-validation` run `31305115421` 成功、`Notify Hado Library Preview` run `31305131954` 成功。
- Preview repository `main`: `3e8af11b282f9cd64ae216d38d02a8586d45efb0`。`Deploy Hado Library Preview` run `31305149606` 成功。
- Preview marker: `PREVIEW_SOURCE_COMMIT.txt=0ea7d86c2cbaae662f7fe10ee1a5763bf04d3b11`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.0.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.0.1.0 Update11.2`。
- 公開URL: https://mytemark2.github.io/hado_library-preview/ 。表示版、必須runtime・派生JSON、cache key、自動追加、部分一致・無効入力保持、重複抑止、状態変化AND検索、PC同一行・横overflowなし、Debug Log、console error / warning 0件を確認した。
- 最小受入操作: 通常検索のタグ欄で `技能:練兵` を入力し、「追加」ボタンを押さずにタグが追加され、武将5件になることを確認する。
- 残課題: none。

## Update11.1 完了報告

- 表示版: `3.0.1.0 Update11.1 r161`。
- 実装: 技能651件のタグを武将所有関係1,598件、装備所有関係427件へ共通反映。
- 個別確認: `技能:練兵` は武将5件、装備5件、技能1件。状態変化「攻撃上昇」とのAND検索も武将5件。
- タグ表示: `武将・技能・装備｜技能`。
- HTML: 変更前29,230 bytes、変更後29,257 bytes（27 bytes増）。変更は外部asset cache keyのみで、動作は外部JavaScriptへ実装。
- ローカル検証: `python -X utf8 tools/run_app_validation.py` 125/125成功。専用回帰、派生JSON 20件契約、版数整合、保存Import / Export、部隊編成、レスポンシブ契約、PC実操作、ブラウザconsoleを確認済み。
- Git: 基準 `bf05d58a57e0d0cb1180b649c0d38f531ea16367`、実装commit `a99e58593f7bdfb7556be96ee707e8acd04f3413`、PR [#268](https://github.com/mytemark2/hado_library/pull/268)、正本merge commit `3e715a233cc4364ac7a6e7bd0a17e5901bc3e0aa`。
- Actions: `App Validation / app-validation` run `31303341917` 成功、`Notify Hado Library Preview` run `31303366732` 成功。
- Preview repository `main`: `575023323a8212e1779c691de1d2996c3304ad97`。`Deploy Hado Library Preview` run `31303384185` 成功。
- Preview marker: `PREVIEW_SOURCE_COMMIT.txt=3e715a233cc4364ac7a6e7bd0a17e5901bc3e0aa`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.0.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.0.1.0 Update11.1`。
- 公開URL: https://mytemark2.github.io/hado_library-preview/ 。表示版、必須runtime・派生JSON、`技能:練兵` の武将5件・装備5件、状態変化「攻撃上昇」とのAND 5件、同一行配置、cache key、Debug Log、console error 0件を確認した。
- 最小受入操作: 武将カテゴリで `技能:練兵` を設定し、越吉・曹真・関索・曹洪・関興の5件が表示されることを確認する。
- 残課題: none。

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
