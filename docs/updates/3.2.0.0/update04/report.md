# 3.2.0.0 Update04 進捗報告

## 状態

**実装・検証中。** 表示版は `3.2.0.0 Update04 r218`。正式公開は行わない。

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

## 変更ファイル

- 実行ソース: `hado_search.js`、`hado_status_effects.js`、`hado_share.js`、`hado_bootstrap.js`、`hado_styles.css`、`index.html`。
- 版情報: `hado_version.js`、`HADO_DEV_INFO.json`。
- 回帰: Update04専用テスト、App Validation登録、版固定テスト。
- 記録: Update04 roadmap / implementation / report、全体roadmap、Update README。

## HTMLサイズと外部化

`index.html` は28,988 bytesから28,997 bytesへ9 bytes増加。増分は表示文言のみであり、挙動は外部JavaScriptとCSSへ実装した。

## 検証

- `node --check hado_search.js` ほか変更JavaScript: 合格。
- `node tools/test_3_2_0_0_update04_search_results.js`: 合格。
- `git diff --check`: 合格。
- `python -X utf8 tools/run_app_validation.py`: 176/176合格。保存Export/Import、検索モード分離、詳細、編成、JSON契約、Preview同期設定を含む。
- Actions、公開Preview: 実施中。

## Git・Actions・Preview

- 開始正本: `73fadb6d430e5bcf1af25985910f1f852a5a7bc9`。
- 作業ブランチ: `codex/3200-update04-search-results`。
- commit、PR、Actions、Preview repository、marker: 検証完了後に記録する。

## 最小利用者確認

公開Previewで、通常検索のキーワード・カテゴリ・タグ解除、状態変化検索と型検索の条件解除、結果カードの一致理由、2つのコピー操作を確認する。自動操作で完了した場合は利用者側の追加確認を不要とする。

## 残件

- PRとGitHub Actions。
- 自動Preview同期、marker、公開URLのPC・スマートフォン実動作、デバッグログ。

## 確認事項

なし。

## Preview confirmation

- 公開URL: https://mytemark2.github.io/hado_library-preview/
- 状態: 未検証。Preview反映後に記録する。
- 判定: BLOCKED（実装PR前のため）。
