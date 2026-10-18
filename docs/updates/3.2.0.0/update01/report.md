# 3.2.0.0 Update01 Report

## 1. Summary

**未完了。** 全件監査、回帰fixture、Update01 r210のローカル実装を用意した。明示的保留、マージ承認、公開Preview実動作、fileブラウザ検証が残る。正式版と既存ユーザー変更は無変更。

## 2. データ監査結果

取得日時: 2026-10-17 10:56:42 JST。取得・復旧・失敗後の修復記録は `provenance.json`、全ID差分は `data-audit.json`。アプリ生成基準SHAとクローラーSHAは区別して記録した。

| 分類 | 現在 | 追加 | raw変更 | 削除 |
|---|---:|---:|---:|---:|
| 武将 | 499 | 5 | 494 | 0 |
| 戦法JSON | 478 | 5 | 2 | 0 |
| 装備 | 266 | 6 | 260 | 0 |
| 技能JSON | 701 | 20 | 681 | 0 |
| 状態変化 | 214 | 8 | 0 | 0 |
| 陣形 | 22 | 0 | 22 | 0 |
| 兵器／武装／専用技能／五行／軍馬／軍馬技能 | 6/18/32/10/5/27 | 0 | 0 | 0 |

raw変更は取得時刻・ページ内容等を含む。意味変更458武将という既存クローラー警告を取り消していない。36 JSONのハッシュと全派生索引の差分キーも記録。兵科不明0、所有者・関連リンクの参照切れ0。検索alias検出は下記の明示的保留。

## 3. 不具合分類・原因・保留一覧

1. **装備識別子統合（2検出）**: 記事346228と381628の同名「青嚢書・名家医書」が検索では381628へ統合され、同じsourceEntityKeyが2行になる。既存生成器の名称ベース統合と記事IDの差。片方の一次記事を削除して隠さない。正規aliasか意図しない欠落かの生成器契約確定が必要。
2. **兵科タグ不足**: 一次の兵科セルから499件を判別できるが、派生タグで一致する兵科タグがない武将151件（騎54、弓40、歩45、工5、盾7）。これは派生タグ監査結果であり、全UIで同数が検索不能と断定しない。Update02でランタイム補完も含めて修正・検証する。
3. **戦法JSONと実行時の差20件**: ランタイムは武将sectionから戦法を再構築し、保存戦法JSONを直接採用しない。武将名を名称とする保持レコード20件が実行時に出ない。全ID・URLをgoldへ固定。保持レコードの要否と生成側fallbackの契約確定が必要で、推測削除しない。
4. **状態変化の分類未確定8件**: 意気、焔計、火属性威力変化、劇毒、相性変化、即時攻撃、即時戦法、即時兵器行動。原文・出典保持、味方／敵だけで極性を補わない。
5. **生成来歴の不足**: 元取得runにクローラーcommitが記録されていない。今回の再検証commitは確認済み。`sourceCommit`をクローラーSHAと誤記しない。
6. **世代メタデータ**: 派生20ファイルの`dataSetId`は2026-09-20、`generatedAt`は2026-10-17。生成器app.jsが継承meta.exportedAtを優先するため。件数・bundle・生成時刻で世代を照合し、dataSetIdだけで最新取得日時を判断しない。Update03の要件とする。
7. **CI検証不足**: 旧mainのApp Validationはローカル検証の案内echoのみ。今回、実検証をCIへ接続し、欠落注入テストもCIで実行する。

これらを保留として登録したことは、仕様承認・意味変更レビュー完了を意味しない。重要な未確認があるためUpdate01全体は未完了。

## 4. Files changed / 影響範囲

- 監査スクリプト、gold、全件差分、来歴、Roadmap／implementation／report／README。
- `hado_version.js`をUpdate01 r210へ変更。`HADO_DEV_INFO.json`も基準版・日付の整合のため変更。
- `hado_core.js`の版参照、`index.html`の読込順・cache key、関連テスト。
- Preview設定、App Validation、正本branch規約、merge-readiness。
- HTML 149 bytes減。新しい監査処理はtools配下、画面への大きなinline JS追加なし。
- 生成JSON、保存スキーマ、Export/Import形式、検索・編成の機能ロジックは変更していない。

## 5. Validation

- `node tools/audit_data_coverage.js --baseline 9d8642b77665a94b7b8e166814e15c4dc6b87091 --source-commit e9153a954a998ad346c6ad7beb876056c11c52fb`: 36ファイル、一次2,278件の監査出力生成。
- `node tools/test_3_2_0_0_update01_audit.js`: gold・欠落/参照破損注入検証合格。
- `python -X utf8 tools/run_app_validation.py`: 最終172項目すべて合格。
- `node tools/test_preview_token_preflight.js`: 合格。
- `python -X utf8 tools/validate_preview_workflow.py`: 合格。
- `node tools/test_notify_preview_workflow_no_preview_workflow_edit.js`: 合格。
- クローラー `node tools/regenerate_derived_json.js --source <worktree> --output <temp> --check`: 合格、21生成ファイル、戦法478。保存JSONは変更しない。既存生成物との全byte同一性を証明するモードではなく、正本生成器の出力契約検証である。
- 総合検証にJSON契約、bundle hash、検索、詳細、編成、保存roundtrip、Export/Import、PC/mobile契約、禁止queue不在を含む。
- ローカルHTTP実ブラウザ: Update01 r210起動、LR李典検索と詳細、兵科「工兵」→操器1件・効果本文、部隊編成画面表示を確認。warn/error 0。
- スマートフォン表示: 実測clientWidth=scrollWidth=375、検索・操器詳細の横はみ出しなし。PC幅の実測と全保存操作のブラウザ回帰は未完了。
- file://実ブラウザ: ブラウザツールのURL policyがhttp/https以外を拒否。回避せず未確認。ローカル読込の既存単体検証とHTTP検証は実施。

## 6. GitHub・Preview confirmation

- 正本: feature/app-3.2.0.0、起点e9153a954a998ad346c6ad7beb876056c11c52fb。
- 作業: codex/3200-update01-audit。最終commitとPRは提出結果を参照。
- PR #382: 計画資料のみ、OPEN・未マージを確認。
- App Validation: 実行可能なworkflowへ変更。PR作成後のchecksを確認する。ローカル合格とCI合格を混同しない。
- 3.2同期workflow: Notify Hado Library Preview。正本へのマージ後のpushで自動実行予定、手動dispatchは追加しない。
- 公開URL: https://mytemark2.github.io/hado_library-preview/
- 現在の公開表示: 3.1.2.1 r209（実ブラウザで確認）。LR李典検索・詳細も表示確認。
- 現在のpreview repository main: c2c00d59ee60ead8bdfdfca29125008de4ebe339。
- PREVIEW_SOURCE_BRANCH.txt: feature/app-3.1.2.0。
- PREVIEW_SOURCE_COMMIT.txt: dbad5ed909f4a0acb2c5d4e8fcd40db5091e43f1。
- 3.2公開marker／DOM／JS・CSS／操作／debug-log: **BLOCKED・未確認**（マージ承認前）。Actionsだけで完了とはしない。
- 切替時は旧3.1.2ブランチからのPreview再上書きを防ぐ運用・同期停止を先に確定し、3.2初回同期後にmarkerと全bundle hashを照合する。
- 正式公開・PRマージは行っていない。

## 7. 最小受入操作

マージ承認後の公開Previewで版が`3.2.0.0 Update01 r210`、取得日が2026-10-17であることを確認する。LR李典を検索して詳細を開き、兵科カテゴリで工兵→操器、盾兵→列盾を確認する。部隊編成、Export→Importを複製データで確認し、PC/mobileとfile://で検証する。現在は利用者受入未実施。

## 8. 確認事項

- 監査PRのレビューとマージ・Preview切替の承認。正式公開の承認ではない。
- 保留一覧の解決または根拠付き取り扱い確定。元クローラーcommit不明・file実ブラウザ未確認を隠さない。

## 9. Update02の確定対象・受入条件

推奨: GPT-6 Astra / reasoning high。理由: 兵科・技能・主将候補・派生タグ・既存状態変化検索を跨ぐため。

- 既存の兵科技能単独検索を維持し、兵科→兵科技能→主将候補への横断導線を追加する。
- 工兵5人・盾兵7人だけでなく全499人をgoldの安定ID集合で照合する。
- 通常技能の所有と「主将時に付与」を別に扱う。兵科技能を通常技能所有者索引へ無条件混入しない。
- 兵科タグ151件の不足を生成元・ランタイム双方で検証し、派生変更は21ファイル一式とmanifestを生成する。
- 通常検索、状態変化検索、保存対象、技能レベル、詳細関連リンクの意味を維持する。
- Update01の公開Previewと保留ゲートを閉じるまではUpdate02実装へ進まない。

## 10. Remaining issues

なしではない。第3節の保留、第5節のブラウザ未確認、第6節の公開Previewゲートが残る。

## 11. 公式情報再確認（2026-10-17）

[盾兵公式案内](https://www.gamecity.ne.jp/sangokushi_hadou/2606CP.html)と[6周年・工兵公式案内](https://www.gamecity.ne.jp/sangokushi_hadou/2609CP.html)で新兵科と主将出陣条件を再確認した。[10月公式生放送告知](https://www.gamecity.ne.jp/event/30245.html)から具体的効果・数値を確定しない。兵科技能の本文は取得済みJSONの原文と出典で検証する。

## 12. 再開時確認（2026-10-18）

GitHubを再fetchし、mainと3.2正本のHEADはともにe9153a954a998ad346c6ad7beb876056c11c52fb、PR #382はOPENを再確認。既存ユーザー変更5件も保持。旧3.1.2系統の同期停止は異なるbase branchへの変更が必要なため、本体とは別の小さな移行PRとして準備する。これはUpdate分割やファイル転送のためではなく、古いworkflowが新Previewを上書きしないための移行処置である。
