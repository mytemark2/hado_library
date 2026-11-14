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
- r230は[PR #428](https://github.com/mytemark2/hado_library/pull/428)で開発正本へ反映した。`python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.2.0.0` は base `28341dcfb954aa04e854490b0203ecb1a7511ac3`、head `04b0ada5a439282188f5477f973f0ee43231f647` で競合なし。r230の全186検証と[App Validation](https://github.com/mytemark2/hado_library/actions/runs/43602834357)が合格した。

## Preview確認

- r230のアプリ機能は公開Previewで合格した。11月取得データは品質ゲートで停止しており、最新データを含むUpdate09全体の確認は保留。
- 開発元 `feature/app-3.2.0.0` / `4bf52317f4ddafc6705d3c8a5b1cc80738ab201a`、Preview `main` / `4550059579ce7316e74c7db01ef70729e79e9cb8`、表示 `3.2.0.0 Update09 r230`。3識別ファイルを公開サイトから照合し、連携JS2本・CSS・データマニフェストは開発元とSHA-256が一致した。PreviewリポジトリでHTML、`.nojekyll`、実行ファイル、ゲームJSON36ファイルを確認した。[公開Preview](https://mytemark2.github.io/hado_library-preview/?chatgpt=formation&v=09-r230&source=4bf52317)・[自動同期](https://github.com/mytemark2/hado_library/actions/runs/43602962704)・[Pages](https://github.com/mytemark2/hado_library-preview/actions/runs/43603014488)
- PC幅では未許可時と解除後の操作が非登録、許可時は3操作が登録された。検証セーブの所持武将9人に対し、共有ストレージの編成8件のうち該当編成1件だけを返した。攻城167候補の探索で木獣、耐久141候補の探索で兼才の上限5000を確認し、再評価前後の照会結果は一致した。390×844でも両方の候補が一致し、横はみ出し・ブラウザー警告・エラーは0件。先行版のDebug Logで `formationAdvice:read` の読み取り専用ログを確認した。
- 最小受入操作は、検証用セーブを選んで専用入口で参照を許可し、攻城と耐久の両方を照会してから接続を終了する操作。正式データの相談は、利用者が対象セーブを選んだ状態で行う。
- r230の内蔵診断はOK。重大・警告・情報はすべて0件。

## 確認事項

利用者が編成相談を依頼する際は、対象セーブを選び、専用入口でそのタブの読み取りを許可する。正式公開は別途承認。

## 残件

最新ゲームデータは未反映。技能の削除候補20件中19件は取得原本の技能一覧に既存リンクが残っている。削除を確定せず、武将のHTTP 500と技能の保持条件を調査する。戦闘式未確認の兵器実ダメージ、攻撃間隔、連鎖被害合計は算出対象外。
