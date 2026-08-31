# 3.1.0.0 Update01 Implementation

## 状態

全件条件センサス実装完了。ローカル完了ゲートを満たし、GitHub Actions・公開Preview確認へ進む。

## 実装条件

- 正本ブランチ: `feature/app-3.1.0.0`
- 実装起点Commit: `161cabaf8f043b23946ed08898bf534617583b8f`
- 完了表示版: `3.1.0.0 Update01 r172`
- 推奨・使用エンジン: GPT-5.6 Sol / reasoning high
- 最終schema、UI、Evaluator、scoreEvidence切替はUpdate02以降へ残す。

## 監査処理

`tools/build_update01_condition_census.js`を追加し、次の4正本を独立して全件走査する。

| source | 件数 | SHA-256 |
|---|---:|---|
| `hadou_generals.json` | 486 | `a762a09b3b12c7b8f36a198363668347f028ca5f6b87090ee528148a1daf4398` |
| `hadou_tactics.json` | 465 | `05283147229de864fee9e0ba4bc7ca0937658ca17838502dbba9f53b6edcc745` |
| `hadou_skills.json` | 653 | `ebf25fc41b155cb15e2e32b04bda727cdd427511cce095e34d3f91cd9c91ad01` |
| `hadou_status_effects.json` | 206 | `15f1eb1640de3678680b59210dae0568a3bfeb38159e77bbec17947a4cc09e76` |

走査結果は`condition-census.json`へ保存する。各レコードに走査件数、分類、source locatorから計算したdigest、明示的なdispositionを持たせる。既存派生JSONは変更・手修正しない。

## 監査結果

- 対象レコード: 1,810件
- 実走査レコード: 1,810件
- 意味単位: 45,929件
- 未走査: 0件
- 未分類残差: 0件
- taxonomy候補: 44種類
- gold set: 44件

分類は`condition`、`trigger`、`context`、`modifier`、`limit`、`reset`、`suppression`、`targeting`を分離し、各分類へ実データの代表例を残した。これはUpdate01の監査分類であり、Condition Registryの正式typeではない。

## 現行condition blocks監査

`hadou_effect_condition_blocks.json`のSHA-256は`0198bc8e619132904cbaa2186abf1646a42d10e123a6c1dbc8d8e8210cb80435`。

- 現行index未収載: 228件
  - 武将: 5件
  - 戦法: 5件
  - 技能: 12件
  - 状態変化: 206件すべて
- 条件・triggerの分類見直し候補: 2,196ブロック
- 文字列マーカーだけでは親条件を特定できない曖昧候補: 1,385ブロック
- effectとの親子リンクを持たないcondition block: 4,787ブロック

現行indexは探索と比較の診断入力として再利用する。3.1の意味モデル正本にはせず、Update02で親子関係、boolean grouping、base+override、limit/reset、suppression、target priorityを表現できるschemaを決定する。

## gold set

`condition-gold-set.json`へ44件を固定した。LR袁紹、LR馬良、LR関平、LR孫堅・盾兵、LR司馬昭、LR黄月英の必須事例に加え、技能Lv、将星、出陣、交戦開始、回数制限、累積、確率、抑止、状態変化説明の横断事例を含む。

## 再発防止・品質ゲート

`tools/test_update01_condition_census.js`を追加し、次を自動検証する。

1. 成果物が決定的に再生成される。
2. source件数と実走査件数が一致する。
3. 未走査・未分類残差が0件である。
4. 全8分類群に実データの代表例がある。
5. gold setが40件以上あり、必須事例を含む。
6. 現行condition blocksの未収載数と不足点が記録される。

本テストを`tools/run_app_validation.py`へ追加した。

## Update02への引き渡し

- condition、trigger、context、modifier/base+override、limit/reset、suppression/exception、target priorityを別フィールドにする。
- 条件と効果の親子関係、AND/OR grouping、source locator、原文、source hashを保持する。
- 条件なしレコードも監査済みdisposition付きで出力する。
- 状態変化説明、武将ページの戦法本文・技能本文を正規生成経路へ含める。
- 未分類の意味単位が発生した場合は生成を失敗させる。
- scoreEvidenceはUpdate07のshadow比較まで変更しない。

## HTML・外部化判断

新規監査ロジックは外部Node.jsツールへ実装し、HTMLへJavaScriptやDOMを追加していない。`index.html`はasset cache keyの`r171`から`r172`への同長置換のみで、Git blobサイズの増減は0 bytes。

## Preview

正本マージ後、`Notify Hado Library Preview`、Preview repository marker、公開Pagesの`3.1.0.0 Update01 r172`表示、検索・部隊編成・軍馬編成・debug logを実環境で確認する。
