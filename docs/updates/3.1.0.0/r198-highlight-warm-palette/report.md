# 3.1.0.0 r198 選択タグハイライト配色修正 Report

## 1. Summary

選択タグのハイライト12色から青系・緑系を除外し、暖色・紫系・中立色へ置換する。検索ロジック、タグ対応、表示構造、正式公開は変更しない。

## 2. Bug classification and root cause

- 分類: UI配色の識別性改善。
- 原因: 選択タグ用12色に青・緑・水色・藍・黄緑が含まれ、アプリ本体の主要配色と用途を区別しにくかった。
- 恒久対策: 承認済み12色を専用回帰へ固定し、青系・緑系の再混入を検出する。

## 3. Impact scope checked

検索条件、タグ選択画面、PC検索結果、スマートフォン結果要約、内容詳細の選択タグハイライト。検索処理、タグ所有者判定、色番号割当、保存形式は変更しない。

## 4. Files changed

配色CSS、専用回帰、Preview revision・cache key、README、Roadmap、r198実装・報告記録。runtime JavaScript、JSON、crawler、`HADO_DEV_INFO.json`は変更しない。

## 5. HTML size change and externalization decision

`index.html`: Git blob 28,885 bytes → 28,885 bytes、±0 bytes。HTML構造は変更せず、既存資産の`r198` cache keyだけを更新した。配色は既存の外部`hado_styles.css`内に維持し、新しいruntime JavaScriptやインラインCSSは追加していない。

## 6. Validation commands executed

- `node tools/test_3_1_0_0_tag_highlight.js`
- `python -X utf8 tools/run_app_validation.py`
- `python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.1.0.0`

## 7. Validation results

暖色・紫系12枠の固定値、色番号の安定性、所有タグだけの表示、安全な複数文字列着色、PC・スマートフォン・詳細の共通経路に合格した。12色の文字色と背景色のコントラスト比は最小8.07:1、最大11.00:1だった。`python -X utf8 tools/run_app_validation.py`は160コマンドすべて合格した。

## 8. Git commit and pull request

完了後に記録する。

## 9. GitHub Actions result

完了後に記録する。

## 10. Preview synchronization result

### Preview confirmation

完了後に記録する。

## 11. Minimum user acceptance operation

公開Previewで2つ以上のタグを選択し、検索条件と検索結果の対応色に青系・緑系が使われていないことを確認する。

## 12. Remaining issues

完了後に確定する。正式公開は利用者の明示承認まで行わない。

## 確認事項

公開Preview確認後に確定する。
