# Update08 検証報告

3.2.0.0 Update08 r228を全体回帰の候補とした。

- `python tools/run_app_validation.py` は185項目すべて合格。現行データ監査、JSON契約、検索・詳細・編成、保存とExport/Importを含む。派生JSON契約で対象21ファイルを確認した。
- `python tools/validate_update_version_consistency.py` と `git diff --check` は合格。
- 公開Previewの結果は反映後に追記する。

## 確認事項

公開HTTPS PreviewのPC・スマートフォンでの確認と、Actions・公開markerの照合。
