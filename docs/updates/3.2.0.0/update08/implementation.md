# Update08 実装記録

候補を識別するため `hado_version.js` にUpdate08 r228を設定した。既存の `index.html` のアセット参照と版依存の回帰テストを `08-r228` に合わせた。HTMLの増減は0バイト。機能は既存の外部JavaScript・CSSを使用する。

最新の開発ブランチを基準に、既存の検証コマンド `python tools/run_app_validation.py` でUpdate01〜07の回帰を実施する。公開Previewの実機結果は[報告](report.md)に記録する。
