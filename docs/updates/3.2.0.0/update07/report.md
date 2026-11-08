# Update07 報告

## 状態

開発・検証中。Preview未完了。

## Summary

保存編成の絞り込みと、2編成の変更箇所を先に確認できる比較画面を追加する。比較は元の編成を上書きしない。

## 検証・Preview confirmation

ローカル全App Validation 183/183合格。`node tools/test_3_2_0_0_update07_formation_compare.js`、JS構文、版整合、保存Export/Import roundtrip、JSON契約と現行データ監査、既存検索・詳細・編成回帰に合格。

通常Import、別グループ作成、工兵の一覧絞り込み・解除、全グループからA/B選択、6項目の差分、現在評価53/36、0件時の選択保持、共通軍馬の3技能Lvと固有技能をローカル画面で確認。Exportの実ファイル1件の構造を確認。非変更の保証は凍結回帰（正常/計算例外/複製例外）と既存保存roundtrip回帰による。ブラウザーで別々のExportを採取した前後一致までは主張しない。

Previewは未完了。PR、Actions、自動Preview同期・marker、公開PC/スマートフォン実操作、ログ確認を実施後に更新する。

## 不具合分類・根本原因・恒久対策

兵科判定の対象漏れ。既存の編成用 `getGeneralTroopType()` が歩兵・騎兵・弓兵しか扱わず、工兵が空欄になっていた。Update02の一次セル抽出関数を共用し、全武将の一次兵科と編成判定が一致する回帰を追加。同じ入口を使う編成文脈・兵科表示・戦法連鎖側も共通判定を使用する。未確認の装備可否やゲーム仕様を推測する変更は行わない。

## ファイル・HTML

比較用外部JS/CSS、編成描画接続・兵科判定、版・キャッシュ、検証・fixture、Roadmap/implementation/report、AGENTSを変更。HTMLは28,954→29,087 bytes（+133）、処理は外部化。表示識別のため `hado_version.js` をUpdate07 r227へ更新。`HADO_DEV_INFO.json`、一次・派生JSON、保存schemaは変更なし。

## 残件

上記の検証と公開確認、開発記録の確定。

## 確認事項

なし。
