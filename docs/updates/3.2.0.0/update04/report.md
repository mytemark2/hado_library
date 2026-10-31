# 3.2.0.0 Update04 完了報告

## 状態

**完了（2026-10-31）。** 表示版は `3.2.0.0 Update04 r218`。正式公開は行っていない。

## 概要

- 検索条件を条件別チップへ分割し、各条件をその場で解除できるようにした。
- 結果カードをカテゴリ・名称・一致理由優先へ変更した。
- 複数タグの安定配色を維持し、青・緑系の操作色と区別した。
- コピー操作を `検索結果をコピー` と `検索条件リンクをコピー` に改称した。
- PC・スマートフォンの横はみ出しとタップ領域をCSS回帰へ追加した。

## 不具合分類と原因

- 分類: Preview実操作で検出した条件解除の機能不具合。
- 原因: キーワード条件チップが既存クリアボタンの合成クリックへ間接依存しており、チップ操作から検索状態を確実に更新できなかった。
- 恒久対策: キーワード解除を共通関数へ一本化し、条件チップと既存クリアボタンが同じ処理を直接呼ぶ。合成クリックへの回帰を専用テストで禁止する。
- 配信上の原因: 修正後も `04-r217` キャッシュキーを再利用したため、公開ブラウザーが旧JavaScriptを保持した。
- 配信上の恒久対策: 利用者向けPreviewビルドごとにrevisionを進める規則を適用し、修正版をr218として全アセットキーとともに再発行する。
- 完了ゲートで検出した分類: Windows改行差による回帰テスト不具合。監査生成器はLF正規化後のSHAを保存する一方、テストだけが生バイトSHAを比較していたため、自動データ更新後のCRLFで不一致になった。
- 完了ゲートの恒久対策: 回帰テストのSHA計算を生成器と同じLF正規化へ統一した。監査JSONは生成元からの正本出力を保持し、個別手修正していない。

## 変更ファイル

- 実行ソース: `hado_search.js`、`hado_status_effects.js`、`hado_share.js`、`hado_bootstrap.js`、`hado_styles.css`、`index.html`。
- 版情報: `hado_version.js`、`HADO_DEV_INFO.json`。
- 回帰: Update04専用テスト、App Validation登録、版固定テスト。
- 完了ゲート修正: `tools/test_update01_condition_census.js`。
- 記録: Update04 roadmap / implementation / report、全体roadmap、Update README。

## HTMLサイズと外部化

`index.html` は28,988 bytesから28,997 bytesへ9 bytes増加。増分は表示文言のみであり、挙動は外部JavaScriptとCSSへ実装した。

## 検証

- `node --check hado_search.js` ほか変更JavaScript: 合格。
- `node tools/test_3_2_0_0_update04_search_results.js`: 合格。
- `git diff --check`: 合格。
- `python -X utf8 tools/run_app_validation.py`: 176/176合格。保存Export/Import、検索モード分離、詳細、編成、JSON契約、Preview同期設定を含む。
- 完了記録ブランチ: `python -X utf8 tools/run_app_validation.py` 178/178合格。自動データ更新後のCRLF/LF差も含めて回帰した。
- GitHub ActionsのApp Validationと自動Preview同期: 合格。
- 公開PreviewのPC・375px幅実動作、対象DOM・JavaScript・CSS、デバッグログ: 合格。

## Git・Actions・Preview

- 開始正本: `73fadb6d430e5bcf1af25985910f1f852a5a7bc9`。
- 作業ブランチ: `codex/3200-update04-search-results`。
- 実装commit `bb274ee0a77c60e6c164ec8db639997bdd97b713`、PR #399、merge commit `838037d16909a55dd3ee2b320c1230630d677c3b`、App Validation run `40529945929`。
- キーワード解除修正commit `879792d3f04e93d8e677aacfa92a0c8ac40610bc`、PR #400、merge commit `17203936ee07022c43c2e1d1e81001a915383638`、App Validation run `40531625228`。
- r218発行commit `78729d673ebc933724bb917b439a364f8854d5ac`、PR #401、merge commit `10c01663f80f0ad12222bfb482ec9c25ee1ffb20`、App Validation run `40533272429`、Preview同期 run `40533533477`。
- 公開確認時の正本HEAD: `e3beb62731ccaa5b4fb551549f8ae2b177a639d7`。検証規約変更とデータ自動更新を含むが、Update04の検索実装は変更していない。
- 最新Preview同期 run: `41172700158`。Preview repository `main`: `2009ea6f6102f268291bb12b4b373d0b7d31086d`。

## 最小利用者確認

公開Previewで、通常検索のキーワード・カテゴリ・タグ解除、状態変化検索と型検索の条件解除、結果カードの一致理由、2つのコピー操作を自動操作で確認した。利用者側の追加確認は不要。

## 残件

なし。Update05は別Updateとして開始する。

## 確認事項

なし。

## Preview confirmation

- 公開URL: https://mytemark2.github.io/hado_library-preview/
- 表示版: `3.2.0.0 Update04 r218`。
- app repository branch / HEAD: `feature/app-3.2.0.0` / `e3beb62731ccaa5b4fb551549f8ae2b177a639d7`。
- preview repository `main`: `2009ea6f6102f268291bb12b4b373d0b7d31086d`。
- marker: `PREVIEW_SOURCE_COMMIT.txt=e3beb62731ccaa5b4fb551549f8ae2b177a639d7`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.2.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.2.0.0 Update04 r218`。
- 配置: `index.html`、`hado_formation.js`、`hado_styles.css`、36件の `hadou_*.json`、`.nojekyll`、marker 3件を確認した。
- DOM・資産: 条件チップ、検索結果コピー、検索条件リンクコピー、`hado_search.js`、`hado_status_effects.js`、`hado_share.js`、`hado_bootstrap.js`、`hado_styles.css` を確認し、版付きアセット31件が `04-r218` を使用していた。
- 操作: 工兵検索5件と一致理由、キーワード解除後499件、カテゴリ・工兵タグ・状態変化「結束」・型検索「鎮静型」の状態／要素条件の個別解除、2種のコピー完了表示を確認した。
- スマートフォン: 375px幅でdocument client/scroll幅はいずれも360px。条件チップ、検索領域、コピー操作に横はみ出しなし。
- デバッグログ: warning 0件、error 0件。
- 判定: PASS。
