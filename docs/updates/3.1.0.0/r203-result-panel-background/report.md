# 3.1.0.0 r203 検索結果パネル背景の是正 Report

## 検証結果

`python -X utf8 tools/run_app_validation.py` の全162件、`python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.1.0.0`、GitHub Actionsの`App Validation`はすべて成功した。

## Preview確認

`Notify Hado Library Preview`（run `33380636698`）が成功し、Previewリポジトリ`main`の`ac38637`へ同期された。

- `PREVIEW_SOURCE_COMMIT.txt`: `28cc27157f1830ff5676c7dbc04b0209f39f7555`
- `PREVIEW_SOURCE_BRANCH.txt`: `feature/app-3.1.0.0`
- `PREVIEW_DISPLAY_VERSION.txt`: `3.1.0.0 r203`

公開URLで、検索結果パネルは`rgb(239, 246, 255)`、詳細パネルは`rgb(255, 255, 255)`、対象パネルは1件だけであることを確認した。コンソールの警告・エラーはない。

## 確認事項

なし。正式公開は行わない。
