# Update09 検証報告

候補表示は `3.2.0.0 Update09 r230`。初版の開発元は `feature/app-3.2.0.0` の `82bcb6f9fa7339a54265b4c42e1a76130bb7fa66`。r230の起点は `28341dcfb954aa04e854490b0203ecb1a7511ac3`。

## データ鮮度

- クローラーの完了済みrun `2026-11-14T02-58-33-598Z` の `run-report.json` と公開データを確認。武将499・装備268・陣形22は11月8日の取得、技能701は取得元を表示できなかったため10月17日の取得を維持。生成元は `786e924c1e0e25afbe2e0932813fc704119a6999`。[データ反映 PR #425](https://github.com/mytemark2/hado_library/pull/425)
- 11月12日登場のLR龐統・工兵とLR徐盛は上記公開武将データに未収録。更新後の最適候補という評価は保留する。[11月アップデート情報](https://ascii.jp/elem/000/004/451/4451345/)
- 新規取得run `2026-11-14T12-51-16-780Z` は取得原本を保全し、技能の削除候補20件が上限8件を超えたため公開前に停止した。装備2件、技能6件の追加を検出した。武将の取得原本501件には新武将2件がある。武将ページにHTTP 500が1件あり、差分判定では既存499件が維持された。新しい取得は未反映。
- LR李典の「兼才」は指定武将と組むと、対象となる通常攻撃・戦法の被ダメージ上限が5000。連鎖攻撃は攻撃ごとに適用する。[公式10月アップデート](https://www.gamecity.ne.jp/news/30350.html)・[取得元の技能情報](https://gamewith.jp/sangokushihadou/article/show/582917)

## 検証

- `node tools/test_3_2_0_0_update09_formation_advice.js` は合格。専用入口、許可・失効、保存条件の判定、一撃上限、兵器速度、書き込みが発生しないことを確認した。
- `python -X utf8 tools/run_app_validation.py` は186項目が合格。版整合、外部CSS、Preview同期、旧保存形式・Export/Import、検索・詳細・編成の既存検証を含む。
- r229は[PR #427](https://github.com/mytemark2/hado_library/pull/427)と[App Validation](https://github.com/mytemark2/hado_library/actions/runs/43597424366)、[自動同期](https://github.com/mytemark2/hado_library/actions/runs/43597564858)、[Pages](https://github.com/mytemark2/hado_library-preview/actions/runs/43597615251)を確認。PCと390×844で木獣候補と兼才の上限5000を取得し、再評価と接続解除も確認した。通常ページに連携操作はなく、選択セーブの所有と照合されない編成まで連携の一覧に含まれていたためr230で修正した。
- r230のコミット・Actions、自動同期と公開Previewの再確認結果は反映後に追記する。

## 確認事項

利用者が編成相談を依頼する際は、対象セーブを選び、専用入口でそのタブの読み取りを許可する。正式公開は別途承認。

## 残件

最新ゲームデータの収録確認。公開Previewの実操作と配信元の照合。
