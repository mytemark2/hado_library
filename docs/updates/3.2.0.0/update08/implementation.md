# Update08 実装記録

候補を識別するため `hado_version.js` にUpdate08 r228を設定した。既存の `index.html` のアセット参照と版依存の回帰テストを `08-r228` に合わせた。HTMLの増減は0バイト。機能は既存の外部JavaScript・CSSを使用する。

既存の `python tools/run_app_validation.py` でUpdate01〜07の回帰を実施し、185項目が合格した。公開Previewの実操作は[報告](report.md)に記録した。

## 変更ファイル

- `hado_version.js`、`index.html` の候補表示とキャッシュキー。
- `tools/test_3_1_0_0_update06_{referenced_skill_cards,search_clause_integration,ui_copy_reduction,user_facing_cards}.js`、`tools/test_3_1_0_0_update07_score_shadow.js`、`tools/test_3_1_0_0_update08_surface_unification.js`、`tools/test_3_1_0_0_update09_full_regression.js`、`tools/test_3_1_1_0_copy_share.js`、`tools/test_3_1_2_0_troop_skill_search.js`、`tools/test_3_2_0_0_update{02_troop_cross_search,04_search_results,05_detail_hierarchy}.js` の版期待値。
- 全体ロードマップ、更新一覧、Update08の計画・実装・報告。

候補の実装はPR #424。検証中に自動データ更新PR #425が反映されたため、後続の検証記録は `e9d547610d029e23b75fe22e533f96dfea892e0e` を起点とした。候補の実装差分にゲームデータ、保存形式、`HADO_DEV_INFO.json` の変更はない。
