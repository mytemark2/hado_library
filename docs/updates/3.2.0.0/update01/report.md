# 3.2.0.0 Update01 Report

## 1. Summary

**未完了。** 全件監査・回帰fixture・Update01 r210を2026-10-18に開発正本へマージし、公開Previewの基本操作を確認した。明示的保留と残存回帰がある。最新結果は第14節を参照。正式版と既存ユーザー変更は無変更。

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

- Preview反映に再承認は不要（2026-10-18のユーザー指示を再確認）。正式公開のみ別承認。
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

## 13. PR提出・CI確認（2026-10-18）

- 本体PR: https://github.com/mytemark2/hado_library/pull/387 （draft、未マージ）。実装commit: d14237cedb6defdd77c303964074367da3b5e7c8。
- 旧同期停止PR: https://github.com/mytemark2/hado_library/pull/386 （draft、未マージ）。実装commit: 2717435a53efccdeb6cfbef3155beb5bb1c3831c。
- 本体App Validation: https://github.com/mytemark2/hado_library/actions/runs/39082607645 、実装commitで成功。総合回帰を実行するworkflowを確認。
- 旧同期停止App Validation: https://github.com/mytemark2/hado_library/actions/runs/39082582238 、成功。ただし旧baseのCIは総合回帰を実行しないため、ローカル172項目合格と区別する。
- 両作業branchのnotify-previewはskip。正本へ未マージのため公開Previewは更新していない。
- merge-readiness: python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.2.0.0 を実行。fetchしたbase e9153a954a998ad346c6ad7beb876056c11c52fb、head d14237cedb6defdd77c303964074367da3b5e7c8、競合なし。
- 旧同期停止も --base feature/app-3.1.2.0 で実行。fetchしたbase dbad5ed909f4a0acb2c5d4e8fcd40db5091e43f1、head 2717435a53efccdeb6cfbef3155beb5bb1c3831c、競合なし。
- 既存ユーザー変更5件は保持。再取得、正式公開、PRマージは行っていない。
- この節は提出後の検証証跡の追記。記録commit後の最終CIはPR checksで確認する。Update01とPreviewは引き続き未完了。


## 14. 公開Preview反映・実動作確認（2026-10-18）

Preview反映は許可済みで再確認不要とするユーザー指示を再確認し、AGENTS.mdに記録した。正式公開は別承認のまま。

- PR #386を先にマージ: 08d1dbeac24e34528dedf7823d77a5daece052cd。旧通知run 39086107921はskip。
- PR #387をマージ: feature/app-3.2.0.0 / b2de5d0bd9be640c6040e8dc7245428466d80235。
- Notify Hado Library Preview: https://github.com/mytemark2/hado_library/actions/runs/39086122804 成功。
- Deploy Hado Library Preview: https://github.com/mytemark2/hado_library-preview/actions/runs/39086156471 成功。
- Preview main: ad2b8ebf22fe20b3e83f1f4ca80b0ec8d90163b4。index.html、hado_formation.js、hado_styles.css、hadou_*.json、.nojekyll、marker3件の存在を確認。実行ファイル70件のGit blob一致、差分0。
- 公開URL: https://mytemark2.github.io/hado_library-preview/
- 公開marker: PREVIEW_SOURCE_COMMIT=b2de5d0bd9be640c6040e8dc7245428466d80235、PREVIEW_SOURCE_BRANCH=feature/app-3.2.0.0、PREVIEW_DISPLAY_VERSION=3.2.0.0 Update01 r210。公開URLからも同値を取得。
- 実画面: h1/title/Preview表示がr210。全JSON読込、LR李典検索・詳細、工兵→操器、盾兵→列盾の1件表示・効果本文を確認。既存保存編成3件と主将・スコアの表示を確認し、保存データは編集しない。
- PC実測1101px、スマートフォン実測360px（375px指定に対する実測値）、clientWidth=scrollWidthで横はみ出しなし。viewport指定は解除。
- 通常操作時console warn/error 0。Debug LogのONと要約表示が動作。
- **アプリ内診断はFAIL**: r210にversionConsistency/baseSha256欠落と、兵科技能詳細のregression失敗。再現では武将詳細のregressionは合格、兵科技能詳細で必須語「部隊編成に追加」「追加」が不在。隠さずr211修正の対象とする。
- Export/Importは既存自動回帰合格、公開ブラウザでのroundtripは未実施。file://実ブラウザは既報のツール制限で未確認。
- 配信確認はPASS、Update01全体とPreview総合検証は未完了。第6・13節の承認待ち記述は当時の記録であり、現在の停止理由ではない。

## 15. r211診断修正

実装記録の「公開診断修正」を参照。確認済みの基準正式版commitを中央定義に保持し、条件付きボタンを全文必須語にする誤判定を修正。実機能を削除して検証を通す変更ではない。実build定義と兵科技能詳細の再発防止テストを追加し、総合検証・PR・再配信を実施する。基準HEADはb2de5d0bd9be640c6040e8dc7245428466d80235。

確認事項: Preview修正の再承認は不要。正式公開は未実施。監査保留一覧とfile://・公開Export/Import回帰は残る。

検証結果: node tools/test_3_1_0_0_manual_validation_button_state.js 合格。python -X utf8 tools/run_app_validation.py の最終172項目すべて合格。初回の版固定テスト残存210は211へ整合し、全体を再実行して合格を確認。テスト生成の無関係なsample JSONは復元。
