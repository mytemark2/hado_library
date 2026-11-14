# Update09 検証報告

候補表示は `3.2.0.0 Update09 r229`。開発元は `feature/app-3.2.0.0` の `82bcb6f9fa7339a54265b4c42e1a76130bb7fa66`。

## データ鮮度

- クローラーの完了済みrun `2026-11-14T02-58-33-598Z` の `run-report.json` と公開データを確認。武将499・装備268・陣形22は11月8日の取得、技能701は取得元を表示できなかったため10月17日の取得を維持。生成元は `786e924c1e0e25afbe2e0932813fc704119a6999`。[データ反映 PR #425](https://github.com/mytemark2/hado_library/pull/425)
- 11月12日登場のLR龐統・工兵とLR徐盛は上記公開武将データに未収録。更新後の最適候補という評価は保留する。[11月アップデート情報](https://ascii.jp/elem/000/004/451/4451345/)
- LR李典の「兼才」は指定武将と組むと、対象となる通常攻撃・戦法の被ダメージ上限が5000。連鎖攻撃は攻撃ごとに適用する。[公式10月アップデート](https://www.gamecity.ne.jp/news/30350.html)・[取得元の技能情報](https://gamewith.jp/sangokushihadou/article/show/582917)

## 検証

- `node tools/test_3_2_0_0_update09_formation_advice.js` は合格。専用入口、許可・失効、保存条件の判定、一撃上限、兵器速度、書き込みが発生しないことを確認した。
- `python -X utf8 tools/run_app_validation.py` は186項目が合格。版整合、外部CSS、Preview同期、旧保存形式・Export/Import、検索・詳細・編成の既存検証を含む。
- PR、Actions、自動同期と公開PreviewのPC・390px幅の操作結果は検証後に追記する。

## 確認事項

利用者が編成相談を依頼する際は、対象セーブを選び、専用入口でそのタブの読み取りを許可する。正式公開は別途承認。

## 残件

最新ゲームデータの収録確認。公開Previewの実操作と配信元の照合。
