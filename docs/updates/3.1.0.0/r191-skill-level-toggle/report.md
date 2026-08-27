# 3.1.0.0 r191 技能レベル表示改善 Report

## 1. Summary

技能レベルタグを各レベル説明の開閉ボタンへ変更し、現在有効なレベルだけを初期表示する共通UIを武将・検索・技能詳細・参照技能・部隊編成へ適用した。正式公開は行わない。

## 2. Bug classification and root cause

- 分類: 情報設計・表示密度の問題。
- 原因: レベルタグが単なる表示で、同一カード内の全レベル説明が常時展開されていたため、現在有効な説明と比較用説明の優先度を区別できなかった。
- 恒久対策: レベルタグと対応説明を共通部品で一対一に関連付け、現在有効なレベルだけを初期展開する。
- 再発防止: 共通部品の状態と各表示経路への接続をApp Validationの専用回帰で固定する。

## 3. Impact scope checked

武将の技能表示、技能検索、参照付与技能、技能詳細、部隊編成の選択枠技能、キーボード操作、PC・スマートフォン、保存Import/Export、起動・JSON読込・検索・編成の既存主要経路。

## 4. Files changed

`hado_skill_level_toggle.js`、`hado_core.js`、`hado_formation.js`、`hado_styles.css`、`hado_version.js`、`index.html`、App Validation、専用回帰、現在版を確認する既存回帰、README、Roadmap、r191記録。JSON、crawler、`HADO_DEV_INFO.json`は変更しない。

## 5. HTML size change and externalization decision

`index.html`: 28,754 bytes → 28,855 bytes、+101 bytes。開閉ロジックは新規外部JavaScriptへ実装し、HTMLには読み込み宣言だけを追加した。

## 6. Validation commands executed

- `node --check hado_skill_level_toggle.js`
- `node --check hado_core.js`
- `node --check hado_formation.js`
- `node tools/test_3_1_0_0_skill_level_toggle.js`
- `python -X utf8 tools/validate_update_version_consistency.py`
- `node tools/test_json_index_contract.js`
- `python -X utf8 tools/run_app_validation.py`

## 7. Validation results

- 共通部品単体回帰: 現在レベルだけ初期表示、他レベル非表示、各タグの独立開閉をPASS。
- 接続回帰: 武将・参照技能・技能詳細・部隊編成が共通部品を使用することをPASS。
- version整合: `3.1.0.0 r191`、単一正本`hado_version.js`をPASS。
- JSON契約: 生成対象21ファイル、関連参照13,523件をPASS。JSON内容は変更していない。
- App Validation: 156/156件PASS。JS/JSON/HTML、起動、JSON cache、検索、詳細、部隊編成、保存Import/Export、レスポンシブ契約を含む。

## 8. Git commit and pull request

- 修正前の開発正本: `e4c7a3b87a0deee637c32ce8738c0fd82f36d775`
- 作業commit: `9a8b29486460195f84ecca672b2efbb60fbc4718`
- Pull Request: [#329](https://github.com/mytemark2/hado_library/pull/329)
- `feature/app-3.1.0.0`へのmerge commit: `8d3787012f611c967e3671f646e92ee58911e5d3`
- merge-readiness: base `e4c7a3b87a0deee637c32ce8738c0fd82f36d775`、head `9a8b29486460195f84ecca672b2efbb60fbc4718`、競合なし。

## 9. GitHub Actions result

- `App Validation / app-validation`: run `33087209905`、PASS。
- `Notify Hado Library Preview`: run `33087256021`、success（1分34秒）。
- 正本pushを契機とするイベント駆動同期であり、schedule・手動workflowは使用していない。

## 10. Preview synchronization result

`feature/app-3.1.0.0`のmerge commitをPreview repositoryへ同期し、公開Pagesで実操作を確認した。

### Preview confirmation

- 公開URL: <https://mytemark2.github.io/hado_library-preview/>
- 表示版: `覇道ライブラリ 3.1.0.0 r191`
- Preview repository commit: `30d6eb4f4aa4b95a828e1815919348c6d76818b5`
- marker: source commit `8d3787012f611c967e3671f646e92ee58911e5d3`、source branch `feature/app-3.1.0.0`、display version `3.1.0.0 r191`
- 必須配置: `index.html`、`hado_formation.js`、`hado_styles.css`、`hado_skill_level_toggle.js`、`hadou_*.json`、`.nojekyll`、3 markerを確認。
- DOM・asset: `hado_skill_level_toggle.js`、`hado_core.js`、`hado_formation.js`、`hado_styles.css`が`3.1.0.0-r191`で読み込まれ、技能レベルbuttonと対応panelが一対一で生成されることを確認。
- 武将操作: LR馬良の技能タブで、白眉Ⅰ・克遂Ⅱ・警戒Ⅱなど現在レベルだけが初期表示されること、白眉Ⅱの追加表示と白眉Ⅰの非表示が独立して動作することを確認。
- 部隊編成操作: LR袁紹の主将枠で、轟天Ⅲ・轟名Ⅰ・盟主Ⅱ・破撃Ⅰ・盟傑Ⅱ・奮檄Ⅰだけが初期表示されること、轟天Ⅱの追加表示とⅢの非表示が独立して動作することを確認。
- PC 1280x720・スマートフォン390x844: 横方向overflow 0、スマートフォンのレベルbuttonは44x38px、表示崩れなし。
- debug log: browser error 0件。
- 判定: PASS。

## 11. Minimum user acceptance operation

Codex側で公開Previewの武将・部隊編成を実操作済み。利用者が確認する場合は、各技能の別レベルタグを1回押して説明を追加表示し、現在レベルタグを1回押して非表示にする。

## 12. Remaining issues

none。正式公開は利用者の明示承認まで行わない。

## 確認事項

なし。改修・Preview反映・実操作確認まで完了した。正式公開は利用者の明示承認まで行わない。

推奨エンジン: GPT-5.6 Sol / reasoning High。
