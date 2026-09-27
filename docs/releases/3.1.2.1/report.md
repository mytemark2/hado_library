# 3.1.2.1 修正版報告

## 不具合分類と原因

- 分類: 状態変化検索の検索対象漏れ。
- 根本原因: 個別状態変化検索の最大レベル判定が、技能から参照付与された効果の所有者を公開索引から補完していなかった。
- 影響範囲: 全データ表示・最大レベルでの個別状態変化検索。特に、参照技能経由の効果を持つ武将が候補から漏れる。
- 恒久対策: 公開索引の所有者と効果を対象条件下で統合し、重複排除・効果一致を行う。
- 再発防止: LR張角「感電回避」を実データで検証する回帰テストを追加し、開始段階・保存検索への誤適用も検査する。
- 最低限の利用者確認: Previewと正式版で状態変化検索を選び「自部隊不利対策」→「感電回避」、対象「武将」、全データ・最大レベルで検索し、LR張角が表示されること。

## 変更内容

- `hado_search.js`: 最大レベル検索へ公開所有者索引を統合し、重複・段階条件を制御。
- `hado_core.js`: 段階切替時の状態変化検索を再実行。
- `hado_version.js`: Previewでは `3.1.2.1 r209`、正式版では `formalRelease: true` として `3.1.2.1` を表示する。revision 209は内部識別子として保持。
- `index.html`: アセットキャッシュキーを `3.1.2.1-r209` に更新。
- 回帰テスト: 最大レベル参照効果、版固定値、データ生成テストの非破壊化を更新。

## 検証

- `python -X utf8 tools/run_app_validation.py`: 170/170 合格。
- `node tools/test_individual_status_effect_max_level_owner_index.js`: 合格。
- `git diff --check`: 合格。
- HTML自体への大きなコード追加なし。修正は分割済みJavaScriptへ実装。
- Preview同期: `Notify Hado Library Preview` run `36290067888` 成功、`Deploy Hado Library Preview` run `36290105491` 成功。Preview source commit `f3435c0bbfe3ef511c7195d78d2a3d86df3e55e9`、branch `feature/app-3.1.2.0`、表示版 `3.1.2.1 r209`。
- Preview公開確認: `https://mytemark2.github.io/hado_library-preview/` で対象版とLR張角を含む感電回避検索6件を確認済み。
- 正式版承認: 対象commit `f3435c0bbfe3ef511c7195d78d2a3d86df3e55e9` の正式版反映承認を受領。
- 正式版PR: [#380](https://github.com/mytemark2/hado_library/pull/380)、base `main` SHA `f2a85d7d4cd25fb349cacbc60e5ab0f3bedc78b5`、head `ae1231e55897327d616c4b1de97bd6077161acac`。`python -X utf8 tools/check_pr_merge_readiness.py --base main` は競合なし。
- GitHub App Validation run `36295020077`: 成功。Preview通知は正式版PRのためskip。
- 正式版merge commit `ca0d5149840bb9f09d80d3cf99a79f0883f945bf`。`Deploy Hado Library Production Pages` run `36295052415`: 成功。
- 正式公開確認: `https://mytemark2.github.io/hado_library/` で `3.1.2.1`、全データ・武将最大、感電回避6件、LR張角と効果本文を確認。データJSONの再取得・変更なし。

## 未解決事項

- 残件なし。
