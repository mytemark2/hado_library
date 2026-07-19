# Update10 Implementation

## 状態

準備完了、実装未着手。

## 実装方針

- Update09完了commitを唯一の起点とし、古いPreview成果物や過去PRから実装を戻さない。
- 個別要求ごとに影響範囲を調査し、既存責務のJavaScript/CSSへ実装する。
- 表示版を変更する修正では `hado_version.js` を正本として、関連するmetadata、cache key、開発記録を同一変更で同期する。
- JSON索引・クローラー契約が変わる場合は、アプリ側の部分補完ではなくクローラーで派生JSON一式を再生成する。
- Update09で追加した回帰を維持し、変更箇所の専用回帰を `tools/run_app_validation.py` の実行対象へ追加する。

## 最初の実装前チェック

1. 正本ブランチとHEADを取得する。
2. 対象機能のソース、JSON、CSS、workflow、既存の回帰、Update10記録を読む。
3. バグの場合は再現条件と同種経路を先に特定する。
4. `python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.0.0.0` をPR前に実行する。
