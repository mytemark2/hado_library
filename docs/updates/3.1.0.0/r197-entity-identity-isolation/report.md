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

ローカル全件監査は、2,920状態変化対象エンティティ、5,342正規関連、版違い衝突の可能性がある362レコード、1,822 Clauseエンティティを確認し、会心耐性の武将所有者を3名へ限定した。`python -X utf8 tools/run_app_validation.py`は160コマンドすべて合格した。マージ準備検査、公開Preview実操作結果は完了後に追記する。

## 8. Git commit and pull request

完了後に追記する。

## 9. GitHub Actions result

完了後に追記する。

## 10. Preview synchronization result

### Preview confirmation

完了後にURL、表示版、3 marker、Preview repository commit、必須資産、PC・390x844操作、console、debug log、判定を追記する。

## 11. Minimum user acceptance operation

公開Previewの状態変化検索で「自部隊不利対策 → 会心耐性 → 武将」を指定し、UR張角・UR曹洪・UR兀突骨の3件だけが表示され、LR張角が表示されないことを確認する。追加で通常検索「会心耐性」でもLR張角が状態変化由来で選定されないことを確認する。

## 12. Remaining issues

実装・Preview確認完了後に確定する。正式公開は利用者の明示承認まで行わない。

## 確認事項

公開Preview確認後に確定する。正式公開は利用者の明示承認まで行わない。
