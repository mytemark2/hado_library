# 3.1.2 Preview同期元の停止（3.2移行準備）

## 状態

マージ承認待ち。PRを準備しただけでは旧同期は停止しない。

## 目的・範囲

新しい3.2 Previewに旧3.1.2ブランチからのpushが上書きすることを防ぐ。旧ブランチのnotify-preview jobを無条件falseにし、実行されないことを回帰テストへ追加する。

アプリ機能、JSON、表示版、保存形式、正式版、公開Previewの内容を変更しない。HADO_DEV_INFO.json / hado_version.js / index.htmlは変更しない（HTML差0）。元の同期処理は履歴として保持し、別経路の同期や手動dispatchは追加しない。

起点: feature/app-3.1.2.0、dbad5ed909f4a0acb2c5d4e8fcd40db5091e43f1。
作業: codex/retire-312-preview。隔離作業ツリー。

## 承認後の適用順

1. 本PRを旧feature/app-3.1.2.0へマージする。旧ブランチのNotify jobがskipであることを確認する。
2. Update01本体PRをfeature/app-3.2.0.0へマージする。
3. 新ブランチのpush同期、Pagesデプロイ、公開marker、表示版、全bundle hash、実動作を確認する。

base branchが異なるため本体PRと別PRが必要。旧ブランチの履歴・データは削除しない。正式公開は別承認。

## 検証

- node tools/test_retired_preview_source.js
- python -X utf8 tools/validate_preview_workflow.py
- node tools/test_notify_preview_workflow_no_preview_workflow_edit.js
- python -X utf8 tools/run_app_validation.py（既存回帰を含む）
- python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.1.2.0（コミット後、最新remote取得とmerge dry-run）

上記ローカル総合検証172項目すべて合格。個別の停止検証・既存同期検証も合格。PR・commitとmerge-readiness結果は提出時に報告。マージ後skipの実確認は承認後のゲートであり、未確認のまま完了扱いしない。

## 確認事項

本PRと3.2 Update01本体PRを上記順序でマージし、Previewを切り替える承認。正式公開の承認は含まない。

## 残件

マージ承認と、旧同期skip・新同期成功・公開Preview検証。
