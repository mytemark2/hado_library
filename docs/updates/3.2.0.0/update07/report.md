# Update07 報告

## 状態

完了（2026-11-08）。公開Preview `3.2.0.0 Update07 r227`。

## Summary

保存編成の絞り込みと、2編成の変更箇所を先に確認できる比較画面を追加した。比較は元の編成を上書きしない。軍馬は全編成共通の設定として表示する。

## 検証・Preview confirmation

ローカル全App Validation 183/183合格。`node tools/test_3_2_0_0_update07_formation_compare.js`、JS構文、版整合、保存Export/Import roundtrip、JSON契約と現行データ監査、既存検索・詳細・編成回帰に合格。

通常Import、別グループ作成、工兵の一覧絞り込み・解除、全グループからA/B選択、6項目の差分、現在評価53/36、0件時の選択保持、共通軍馬の3技能Lvと固有技能をローカル画面で確認。Exportの実ファイル1件の構造を確認。非変更の保証は凍結回帰（正常/計算例外/複製例外）と既存保存roundtrip回帰による。ブラウザーで別々のExportを採取した前後一致までは主張しない。

## Preview confirmation

**合格。** 公開URL: `https://mytemark2.github.io/hado_library-preview/?v=07-r227&source=11aff86a`。

- 表示・版marker: `3.2.0.0 Update07 r227`
- source commit marker: `11aff86a65fb35010dea76a4eb1adc1e9529563a`
- source branch marker: `feature/app-3.2.0.0`
- Preview repository main HEAD: `752199c3762d513786f03a3a95dfd4df8586c642`
- 必須ファイル: `index.html`、`hado_formation.js`、`hado_styles.css`、新しい比較JS/CSS、`.nojekyll`、3 marker、`hadou_*.json`36件を確認。
- 公開JS/CSSとsourceのSHA-256一致を確認。ハッシュはimplementation参照。
- DOM/PC操作: 工兵1/7件、解除7件、差分6項目、評価49/36・差-13、記録値49/15の別表示、根拠の効果/対象/出典/原文、共通軍馬の3技能Lvと固有技能を確認。同じ部隊選択の案内、異なる型では単純差を表示しないこと、0件時のA/B保持、Escapeで閉じることを確認。元の5部隊を保持し、比較後も編集対象と記録済み評価が不変。
- 390×844操作: 同じ6項目と評価差、共通軍馬3技能と固有技能、条件外になった編集中部隊の選択保持を確認。文書/比較カード横はみ出し0、閉じると選択欄は44px。
- 内蔵検証: OK / manual-button / 18:21:59.272 / 重大0・警告0・情報0。
- debug log / console: ブラウザー警告・エラー0件、比較例外なし。

## 不具合分類・根本原因・恒久対策

兵科判定の対象漏れ。既存の編成用 `getGeneralTroopType()` が歩兵・騎兵・弓兵しか扱わず、工兵が空欄になっていた。Update02の一次セル抽出関数を共用し、全武将の一次兵科と編成判定が一致する回帰を追加。同じ入口を使う編成文脈・兵科表示・戦法連鎖側も共通判定を使用する。未確認の装備可否やゲーム仕様を推測する変更は行わない。

## ファイル・HTML

比較用外部JS/CSS、編成描画接続・兵科判定、版・キャッシュ、検証・fixture、Roadmap/implementation/report、AGENTSを変更。HTMLは28,954→29,087 bytes（+133）、処理は外部化。表示識別のため `hado_version.js` をUpdate07 r227へ更新。`HADO_DEV_INFO.json`、一次・派生JSON、保存schemaは変更なし。

## 残件

Update07の必須残件はなし。Update08未開始、正式版/Production/mainは未変更。2026-11-14の利用者指定により、Update08の実機確認は[全体ロードマップ](../roadmap.md)に定める公開HTTPS Previewで行う。

## 確認事項

なし。

## Git・Actions

- 開始正本/base: `feature/app-3.2.0.0` / `59e393a4b0efd3cc1c05b7df6a48de0736c76c27`
- head: `codex/3200-update07-formation-compare` / `8d64378dad91964f65990b79590b027add26fdb1`
- `python tools/check_pr_merge_readiness.py --base feature/app-3.2.0.0`: 上記base/headで合格、競合なし、関連する26ファイルのみ。
- PR #418: 開発正本へmerge `11aff86a65fb35010dea76a4eb1adc1e9529563a`
- App Validation run `42466250899`: 成功、1分14秒。
- Notify Hado Library Preview run `42466433283`: push起点で自動実行、成功、1分28秒。
- Deploy Hado Library Preview run `42466471211`: 成功。

## 最小受入操作

部隊一覧で工兵を検索し解除、比較A/Bを選択、差分・評価根拠・共通軍馬を確認して閉じる操作をPCとスマートフォンで実施済み。利用者側の必須追加確認はなし。操作の案内はUpdate07 roadmap参照。
