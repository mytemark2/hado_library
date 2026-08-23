# 3.1.0.0 Update06 Report

## 1. Summary

Update06 r180の検索統合とr181の利用者向け表示を維持し、r182で「白眉」など参照付与技能の表示を通常技能と同じ条件・効果カードへ統合する。参照先の全Lv原文をそのまま表示せず、実際に付与されたLvだけを表示する。正式公開は行わない。

## 2. Bug classification and root cause

- 分類: 共通表示経路から外れた並行実装、およびLv表示範囲の誤り。
- 原因: 通常技能は`buildDetailConditionPresentation`を通る一方、参照付与技能は`renderGeneralSkills`内で参照先の全Lv原文を`fmtContent`へ直接渡していた。このため条件と効果のグループ化が行われず、付与されていないLvも混在した。
- 同系統の原因: 通常技能側も、原文明示記号からグループ化済みでも`reviewed`でない場合は旧原文を併記していたため、generatedデータで二重表示し得た。
- 恒久対策: 通常技能・参照付与技能の双方を共通Presenterへ通し、参照付与技能は指定されたRoman Lvブロックだけを抽出する。Presenterがグループを生成できたかを共通判定にし、グループ化不能時だけ旧表示へフォールバックする。
- 再発防止: 全データの重複除外200参照関係を走査し、参照先存在、指定Lv抽出、条件・効果グループ、原文開閉1個を検証する専用回帰をApp Validationへ追加する。

## 3. Impact scope checked

技能付与参照215出現、重複除外200関係、親技能122件、参照先112技能を全件監査した。対象参照先は全件存在した。表示の直接影響は武将詳細内の参照付与技能カードで、同じ欠陥クラスとして通常技能のgenerated原文二重表示経路も修正対象に含めた。計算側の付与技能反映、保存データ、部隊編成、検索索引、派生JSONは変更しない。

## 4. Files changed

`hado_core.js`、`hado_update04.css`、`index.html`、`hado_version.js`、`tools/test_3_1_0_0_update06_referenced_skill_cards.js`、既存版表示回帰、`tools/run_app_validation.py`、README、全体Roadmap、Update06記録。

`hado_version.js`はPreviewで修正版を識別できるようr182へ更新した。`HADO_DEV_INFO.json`は表示版の重複を避ける現行方針に従い変更していない。

## 5. HTML size change and externalization decision

`index.html`: 29,857 bytes → 29,857 bytes、±0 bytes。キャッシュキーだけを`06-r182`へ更新した。JavaScriptは`hado_core.js`、表示調整は`hado_update04.css`へ外部化し、HTML内JavaScript/CSSは追加していない。

## 6. Validation commands executed

- `node --check hado_core.js`
- `node tools/test_3_1_0_0_update06_referenced_skill_cards.js`
- `node tools/test_3_1_0_0_update06_user_facing_cards.js`
- `node tools/test_3_1_0_0_update06_search_clause_integration.js`
- `node tools/test_3_1_0_0_update04_detail_condition_presenter.js`
- `node tools/test_3_1_0_0_update07_score_shadow.js`
- `node tools/test_json_index_contract.js`
- `python -X utf8 tools/validate_update_version_consistency.py`
- `python -X utf8 tools/run_app_validation.py`
- `git diff --check`
- ローカルHTTP版のPC・スマートフォン実操作

## 7. Validation results

専用回帰、派生JSON契約、版表示整合、全App Validation 144/144、`git diff --check`はPASS。全データ監査で参照関係200件、親技能122件、参照先112技能、参照先欠損0件を確認した。

ローカルHTTP版では次を確認した。

- 「白眉」付与LvⅠは「主将か、主将と自身が好相性の際」2効果と「出陣時」1効果の2グループ。LvⅡの「防御+15%」「主将戦法発動時」は混在しない。
- 原文開閉は1個、旧原文直表示は0個。「敏活」も共通カードで1グループになる。
- 通常技能「克遂」に旧原文の二重表示はない。検索結果の「正規ID一致」「効果あり」も0件。
- PC 1280×720、スマートフォン390×844ともページ・白眉カードの横方向超過なし。ブラウザ警告・エラー0件。

## 8. Git commit and pull request

検証完了後に記録する。

## 9. GitHub Actions result

Pull Request作成後に記録する。

## 10. Preview synchronization result

正本ブランチへの反映後に実Previewとmarkerを確認して記録する。

### Preview confirmation

- 公開URL: `https://mytemark2.github.io/hado_library-preview/`
- 判定: 未確認。正本ブランチ反映後に確認する。

## 11. Minimum user acceptance operation

公開Previewの「検索」で`LR馬良`を検索し、技能内の参照カード「白眉」を確認する。「主将か、主将と自身が好相性の際」の直下に「防御+10%」と「政治を部隊能力に加算する技能の効果量+5%」がまとまり、続く「出陣時」の直下に戦法ゲージ上昇が表示されることを確認する。「防御+15%」など白眉LvⅡの効果が混在しないことも確認する。

## 12. Remaining issues

Pull Request、GitHub Actions、自動Preview同期、公開Preview実操作が未完了。

## 確認事項

現時点でなし。Update06完了後は、Update07が完了済みのためUpdate08「結果サマリー・全画面統一」へ進む。推奨エンジンはGPT-5.6 Sol / reasoning High。
