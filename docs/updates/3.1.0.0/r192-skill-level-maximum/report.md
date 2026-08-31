# 3.1.0.0 r192 技能別最大レベル表示修正 Report

## 1. Summary

技能データで`-`となっている未存在レベルを共通抽出・共通UIの両方で除外し、技能ごとに効果説明が実在するレベルだけを表示するよう修正した。正式公開は行わない。

## 2. Bug classification and root cause

- 分類: データ意味解釈と表示契約の不備。
- 原因: r191が`-`を未存在プレースホルダーではなく説明本文として扱い、共通UIが「説明なし」へ置換して表示した。
- 恒久対策: 抽出層と表示層の二段階で未存在行を拒否する。
- 再発防止: 正本技能661件・レベル行3,305件を全件照合するテストをApp Validationへ常設する。

## 3. Impact scope checked

正本技能661件、レベル行3,305件、実在レベル1,661件、未存在プレースホルダー1,644件、該当技能528件。武将、検索、参照付与技能、技能詳細、部隊編成の共通表示経路。

## 4. Files changed

`hado_skill_level_toggle.js`、`hado_core.js`、`hado_version.js`、`index.html`、専用回帰、現在版を確認する既存回帰、README、Roadmap、r192記録。JSON、crawler、`HADO_DEV_INFO.json`は変更しない。

## 5. HTML size change and externalization decision

`index.html`: 28,855 bytes → 28,855 bytes、±0 bytes。既存外部JavaScriptを修正し、HTMLには`r192`キャッシュキーだけを反映した。

## 6. Validation commands executed

- `node --check hado_skill_level_toggle.js`
- `node --check hado_core.js`
- `node tools/test_3_1_0_0_skill_level_toggle.js`
- `node tools/test_3_1_0_0_update06_referenced_skill_cards.js`
- `node tools/test_3_1_0_0_update06_user_facing_cards.js`
- `python -X utf8 tools/validate_update_version_consistency.py`
- `node tools/test_json_index_contract.js`
- `python -X utf8 tools/run_app_validation.py`

## 7. Validation results

- 全件監査: 661技能・3,305レベル行を走査し、実在1,661件だけを表示対象とし、未存在1,644件を除外した。
- 影響技能: 未存在プレースホルダーを含む528技能をすべて検査した。
- 代表例: 白眉Ⅰ・Ⅱ、克遂Ⅰ・Ⅱ、貞良Ⅰ、令徳Ⅰ、轟天Ⅰ〜Ⅴと一致した。
- 共通UI単体: 半角・全角・各種ダッシュの未存在行を拒否し、現在レベル初期表示と独立トグルを維持した。
- version整合: `3.1.0.0 r192`、単一正本`hado_version.js`をPASS。
- JSON契約: 生成対象21ファイル、関連参照13,523件をPASS。JSON内容は変更していない。
- App Validation: 156/156件PASS。JS/JSON/HTML、起動、JSON cache、検索、詳細、部隊編成、保存Import/Export、レスポンシブ契約を含む。

## 8. Git commit and pull request

- 実装Commit: `5c72e9a45a6e922a51cda9931f18ed2434329b5e`
- Pull Request: `#331`（base: `feature/app-3.1.0.0`）
- Merge Commit: `1bcda0ff8699f769ac40cd3dc8b54ac98e805b8b`
- merge-readiness: base `1f2dc8e8bd041f2def1c22bb8428654ee419a8d8`、head `5c72e9a45a6e922a51cda9931f18ed2434329b5e`、競合なし。

## 9. GitHub Actions result

- `App Validation / app-validation`: run `33171311932`、job `98848903140`、success。
- `Notify Preview Repository`: run `33171348832`、success（1分22秒）。`feature/app-3.1.0.0`へのmergeを契機に自動実行され、手動同期は使用していない。

## 10. Preview synchronization result

- 公開URL: `https://mytemark2.github.io/hado_library-preview/`
- 表示版: `3.1.0.0 r192`
- 初回runtime同期後Preview repository `main`: `df3a2d3a390a6404762a1128584df5bf42dcbb96`
- marker: source commit `1bcda0ff8699f769ac40cd3dc8b54ac98e805b8b`、source branch `feature/app-3.1.0.0`、display version `3.1.0.0 r192`。
- 必須ファイル: `index.html`、`hado_formation.js`、`hado_styles.css`、`hadou_*.json`、`.nojekyll`、3 markerを確認した。
- 公開Pages PC: 武将488件の起動、LR馬良の貞良Ⅰ、白眉Ⅰ・Ⅱ、克遂Ⅰ・Ⅱ、令徳Ⅰ、現在レベル初期表示、白眉Ⅰ・Ⅱの独立開閉、「説明なし」0件を確認した。
- 公開Pages 部隊編成: LR袁紹の轟天Ⅰ〜Ⅴ、轟名Ⅰ、盟主Ⅰ〜Ⅳ、破撃Ⅰ〜Ⅴ、盟傑Ⅰ・Ⅱ、奮檄Ⅰと現在レベル初期表示を確認した。
- 公開Pages 390x844: 同じレベル集合、横はみ出し0px、レベルボタン最小44x38pxを確認した。
- debug log: error 0件。
- 判定: PASS。

## 11. Minimum user acceptance operation

必須の利用者確認はなし。任意確認として、公開PreviewでLR馬良の技能を開き、白眉・克遂がⅠ・Ⅱだけ、貞良・令徳がⅠだけであることを確認できる。部隊編成では、選択枠の技能タグ数が技能ごとの実在最大レベルと一致する。

## 12. Remaining issues

なし。

## 確認事項

なし。正式公開は利用者の明示承認まで行わない。

推奨エンジン: GPT-5.6 Sol / reasoning High。
