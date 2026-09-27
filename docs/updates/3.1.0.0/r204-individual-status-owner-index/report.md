# 3.1.0.0 r204 個別状態変化検索の最大技能レベル索引補完 Report

## Summary

全データ・最大技能レベルでの個別状態変化検索に生成済み所有者索引を適用し、参照付与技能経由の検索漏れを修正した。LR張角は「感電回避」で検索対象となる。初期技能段階・保存データの検索結果には最大段階の索引を流用しない。

## Bug classification and root cause

- 分類: 検索漏れ。
- 根本原因: 通常の技能レベル解決と参照付与技能の個別検索経路が分離しており、後者は付与されたLvの原文だけを調べていた。さらに個別検索は、最大技能レベルで生成された状態変化所有者索引を参照していなかった。

## Impact scope checked

状態変化の個別検索とグループ検索、生成索引の効果名一致、全データ最大・初期・保存データのモード境界、技能段階変更時の再検索、検索キャッシュ。

## Files changed

`hado_search.js`、`hado_core.js`、`hado_version.js`、`index.html`、`tools/run_app_validation.py`、`tools/test_individual_status_effect_max_level_owner_index.js`、revision参照を持つ既存回帰テスト7件、r204の実装記録・完了報告、3.1.0.0 roadmap。

## HTML size and externalization

index.htmlの内容変更はキャッシュキーのr203→r204だけで、文字数・ファイルサイズの増減は0 bytes。処理本体は外部JavaScriptへ実装し、巨大なインライン処理は追加していない。`hado_version.js`はPreview revisionを204へ進める目的で更新し、正式リリース状態と公開版3.1.0.0は維持した。

## Validation commands and results

`python -X utf8 tools/run_app_validation.py`: 165/165成功。内訳にJS構文・JSON/HTML/外部CSS・プレビュー同期workflow・保存/検索/状態変化・タグ全数・JSON index契約を含む。追加回帰 `tools/test_individual_status_effect_max_level_owner_index.js` も成功。`git diff --check` 成功。PR merge readiness、GitHub Actions、公開PreviewはPR反映後に確認する。

## GitHub Actions and Preview confirmation

同一範囲の既存PRなし。PR/merge readiness/Actions/Preview同期/公開Pages実操作はこれから確認する。未確認項目が残る間はPreview完了扱いにしない。

## Minimum user acceptance operation

Previewを全データ・最大に設定し、「自部隊不利対策 → 感電回避 → 武将」でLR張角がヒットすることを確認する。初期段階と保存データでは同じ索引補完が行われないことも確認する。

## Remaining issues

なし（PR/Preview確認待ち）。
