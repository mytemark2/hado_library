# 3.1.0.0 r197 武将版違いの状態変化・Clause混入修正 Report

## 1. Summary

LR張角へUR張角の会心耐性が混入する検索不具合を、個別除外ではなく武将レコード索引の完全名分離で修正する。同じ欠陥クラスである確認済みClause・生成Clauseの版違い混入も同時に修正する。正式公開は行わない。

## 2. Bug classification and root cause

- 分類: 検索・共通Clause投影のデータ同一性不具合。
- 原因: 個別レコードの索引に、レアリティ・括弧表記を除去する人物比較名を使用していた。
- 直接事象: 会心耐性の正しい武将所有者3名に対して、公開PreviewはLR張角・張角・曹洪・兀突骨を加えた7名を返した。
- 恒久対策: 個別レコード完全名キーと人物比較名を分離し、全件一致監査をCIへ追加する。

## 3. Impact scope checked

修正前監査では、状態変化で126同名衝突グループ、286武将、146状態変化ID、1,602件の誤関連候補を確認した。Clauseでは150同名衝突グループ、362エンティティ、生成条件件数が別版から上書きされ得る314エンティティ、確認済みClauseが別版へ投影される11エンティティを確認した。通常検索、状態変化検索、詳細、部隊編成、型検索、タグ検索、保存互換を回帰対象とする。

## 4. Files changed

共通索引JavaScript 3ファイル、全件同一性監査、App Validation、`hado_version.js`、`index.html`、README、Roadmap、r197実装・報告記録。JSON、crawler、CSS、`HADO_DEV_INFO.json`は変更しない。

## 5. HTML size change and externalization decision

`index.html`: Git blob 28,919 bytes → 28,919 bytes、±0 bytes。実装は既存外部JavaScriptへ収め、HTMLは`r197`キャッシュキーだけを変更した。

## 6. Validation commands executed

- `node tools/test_3_1_0_0_entity_identity_isolation.js`
- Update05・Update06・Update08・タグ検索関連回帰
- JavaScript構文、JSON contract、保存Import/Export、Preview Workflow、version整合
- `python -X utf8 tools/run_app_validation.py`
- `python tools/check_pr_merge_readiness.py --base feature/app-3.1.0.0`

## 7. Validation results

ローカル全件監査は、2,920状態変化対象エンティティ、5,342正規関連、版違い衝突の可能性がある362レコード、1,822 Clauseエンティティを確認し、会心耐性の武将所有者を3名へ限定した。`python -X utf8 tools/run_app_validation.py`は160コマンドすべて合格し、JSON contractは生成対象21ファイルを確認した。マージ準備検査はbase `ad1ee7d23508701207069f0e4ff177c9ae67f198`、head `9a912bc442558f4b0e41a4f5ee17bd148296e92d`で競合なしだった。

## 8. Git commit and pull request

- 実装commit: `9a912bc442558f4b0e41a4f5ee17bd148296e92d`
- Pull request: #340（base: `feature/app-3.1.0.0`）
- 実装merge commit: `9a429e35ebbbd1a7b042785cc0cc741e3bf77a1a`
- 競合: なし

## 9. GitHub Actions result

- PR必須check `App Validation / app-validation`: success（run `33260495210`）
- push起点 `Notify Hado Library Preview`: success（run `33260519771`、1分18秒）
- 通常同期は`feature/app-3.1.0.0`へのpushによるイベント駆動で、schedule・手動dispatchは使用しない。

## 10. Preview synchronization result

### Preview confirmation

- URL: `https://mytemark2.github.io/hado_library-preview/`
- 表示版: `3.1.0.0 r197`
- 実装確認時Preview repository commit: `2a308cbf41c7c43a0181ae92900898015fac7d92`
- marker: source commit `9a429e35ebbbd1a7b042785cc0cc741e3bf77a1a`、source branch `feature/app-3.1.0.0`、display version `3.1.0.0 r197`
- 必須資産: `index.html`、`hado_formation.js`、`hado_styles.css`、`hado_search_clause_integration.js`、`hado_clause_surface_bridge.js`、`hado_formation_condition_evaluator.js`、21個の`hadou_*.json`、`.nojekyll`、3 markerを確認した。
- PC: 状態変化検索「自部隊不利対策 → 会心耐性 → 武将」は3件で、UR曹洪・UR張角・UR兀突骨だけを表示し、LR張角を含まなかった。通常検索「会心耐性」でもLR張角を含まず、横方向overflowは0だった。
- 390x844: 同じ状態変化検索が3件で同じ3武将だけを表示し、横方向overflowは0だった。
- DOM: `Preview: 3.1.0.0 r197`、488武将の初期読み込み、会心耐性3件の選択肢と結果要約を確認した。
- console: warning 0、error 0。Debug Log用DOMを確認し、起動時の`hado-debug` warning・errorは0だった。
- 判定: PASS。後続の本記録のみの統合ではmarkerだけが新しい文書merge commitへ進むため、runtime資産が実装確認時と同一であることを再確認する。

## 11. Minimum user acceptance operation

公開Previewの状態変化検索で「自部隊不利対策 → 会心耐性 → 武将」を指定し、UR張角・UR曹洪・UR兀突骨の3件だけが表示され、LR張角が表示されないことを確認する。追加で通常検索「会心耐性」でもLR張角が状態変化由来で選定されないことを確認する。

## 12. Remaining issues

なし。正式公開は未実施であり、利用者の明示承認まで行わない。

## 確認事項

確認事項なし。最低確認操作は、公開Previewの状態変化検索で「自部隊不利対策 → 会心耐性 → 武将」を指定し、UR曹洪・UR張角・UR兀突骨の3件だけが表示されることの確認。正式公開は利用者の明示承認まで行わない。
