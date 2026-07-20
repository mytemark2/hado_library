# Update10 Report

## 状態

Update10.1〜Update10.3 完了。Update10.4は実装・ローカル全体検証まで完了し、Actionsと公開Preview同期を確認中。Update10全体の正式配布物監査と`main`反映判断は継続項目とする。

## Update10.1 — タブ視認性改善

- 表示版: `3.0.0.0 Update10.1 r156`。
- 対象: 共通タブ基盤、上位画面、検索モード、内容詳細、部隊編成内表示、候補ワークスペース、型編成ナビ。
- 最小受入操作: 各タブをクリックし、選択中の面・指標と詳細内容が連動すること、「〇〇を表示中」という独立行が表示されないこと、キーボード操作でフォーカスと選択が仕様どおり動くことをPC/スマホで確認する。
- HTML肥大化対策: 動作は `hado_tabs.js` へ外部化し、インラインJavaScriptを追加しない。HTMLサイズ差は最終検証時に記録する。
- ローカル検証: `python -X utf8 tools/run_app_validation.py` は121/121成功。専用回帰は横/縦・自動/手動タブのキーボード挙動と全適用先を確認した。
- ローカルPC実操作（1440x900）: 上位タブ、通常/状態変化/型検索、内容詳細、部隊編成内4表示、候補ワークスペース5役割、型編成ナビ3入口の選択状態・tabpanel連動を確認。候補一覧はダイアログ内でスクロールし、ブラウザwarning/errorは0件。
- ローカルスマホ実操作（390x844指定、実効幅375px）: 上位/検索/部隊編成内タブ、候補ワークスペースの横スクロールと縦スクロールを確認。body横はみ出しなし、ブラウザwarning/errorは0件。
- 表示密度: タブの選択強調は維持し、検索、内容詳細、候補ワークスペース、型編成ナビの「〇〇を表示中」補助行と上位タブの「表示中」バッジを撤去した。
- HTMLサイズ: 28,214 bytesから29,228 bytesへ1,014 bytes増加。増加はARIA関係と外部asset参照であり、動作本体とCSSは外部化した。
- 既存回帰の恒久化: Update09だけを許可していた版数検証と旧形式cache key検証を、`hado_version.js` の正本値から将来Updateも検証できる形へ更新した。
- 公開前セルフチェック: 初回公開確認で旧構成を前提とした検証器の誤検知と、`related.mechanics` の表示経路欠落を検出した。可視版・外部CSS・遅延描画・6項目サマリー・軍馬3枠UIの検証契約を現行実装へ合わせ、LR張飛の対策リンク2件を専用回帰へ固定した。修正版のローカル内蔵検証、Actions、公開Preview再確認まで完了した。

## Update10.2 — 操作ガイド最新化

- 表示版: `3.0.0.0 Update10.2 r157`。
- 対象: スタートガイド6段階、検索ガイド10手順、部隊編成ガイド9手順。
- 現行仕様への同期: 検索モードごとの状態保持、IME変換確定後検索、末尾`+/-`の数値境界、型編成ナビ3入口、候補ワークスペースの複数選択・下書き復元、侍従UR以下、結果サマリー6項目を説明へ反映した。
- 回帰防止: `tools/test_update10_2_guide_refresh.js` をApp Validationへ常設し、版数、対象DOM、現行用語、過去に撤去した「〇〇を表示中」の非復帰を検証する。
- ローカル検証: `python -X utf8 tools/run_app_validation.py` は122/122成功。`node tools/test_json_index_contract.js` を含む派生JSON20ファイルの契約も成功した。
- ローカルPC実操作: 検索ガイド10手順と部隊編成ガイド9手順を最後まで操作し、説明文、対象画面・内側タブの切替、進捗表示を確認した。
- ローカルスマホ実操作（390x844指定、実効幅375px）: ガイド吹き出しは左右10px、下端836px以内に収まり、body横はみ出しなし、browser warning/error 0件を確認した。
- HTMLサイズ: 29,228 bytesでUpdate10.1から増減なし。ガイド文言同期と動作は既存の外部`hado_core.js`へ実装し、HTMLへインラインJavaScriptを追加していない。
- 最小受入操作: 公開Previewで「ガイド開始」から検索ガイドを進め、検索モード独立・IME・末尾符号・候補ワークスペースの説明を確認する。部隊編成へ切り替えて再度「ガイド開始」を押し、結果サマリー6項目と変化率タブの説明を確認する。
- Git・Actions・Preview: PR [#252](https://github.com/mytemark2/hado_library/pull/252) を正本へマージした。App Validation run `29710202740` は成功。アプリ側Preview通知 run `29710220880` は、同期成功後のPages待機でGitHub API 503となったが、Preview repositoryのDeploy run `29710234872` を再実行して成功した。
- Preview confirmation: Preview repository `main` は `456a9903fd228d66d60466b9e26d6326fb9eed65`。markerは `PREVIEW_SOURCE_COMMIT.txt=686f09f75a4f92f76f23810c04ce68c0af4ec3e9`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.0.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.0.0.0 Update10.2`。公開URLで `3.0.0.0 Update10.2 r157`、検索ガイドの開始・検索モード独立説明、browser warning/error 0件を確認した。

## Update10.3 — ガイド視認性と画面同期

- 表示版: `3.0.0.0 Update10.3 r158`。
- 改修: 本文行間をPC/スマホとも`1.8`、本文文字間隔を`0.02em`へ統一。初回ガイド開始時と検索ガイド8番目を通常検索へ同期し、部隊編成ガイド8番目は表示中の結果サマリーを選択する。
- 同種確認: ガイド対象解決を全候補の可視判定へ変更したため、結果サマリー以外のPC/スマホ重複DOMも先頭非表示による誤選択を防止する。
- ローカル検証: `python -X utf8 tools/run_app_validation.py` は123/123成功。専用回帰、JavaScript/JSON/HTML、検索、保存Import/Export、部隊編成、派生JSON20ファイルの契約、禁止queue不在、差分検査を確認した。
- ローカル実操作: PCで部隊編成から初回ガイドを開始して検索/通常検索へ移ること、検索ガイド8/10で通常検索を選択すること、部隊編成ガイド8/9で2個の結果サマリーのうち表示中の1個へ黄色枠が付くことを確認した。390x844では本文14px・行間25.2px・文字間隔0.28px、本文内スクロールなし、横はみ出しなし、browser warning/error 0件を確認した。
- HTMLサイズ: Git管理上の`index.html`は29,228 bytesから増減なし。変更は外部JavaScript/CSSへ実装し、HTMLは同じ長さのasset cache key更新だけである。
- Git・Actions: 実装commit `070445e83df807e604390a5eb3906d1ff1e844cc`、PR [#254](https://github.com/mytemark2/hado_library/pull/254)、正規ブランチmerge commit `2ab9df17a921d4f1175be559abaa8f9733ea69b8`。PR App Validation run `29711883575`、push起点Preview同期run `29711899860`はいずれも成功した。
- Preview confirmation: 公開URL `https://mytemark2.github.io/hado_library-preview/`、Preview repository `main` commit `f373f962ff9ecc3660fa4c08e9f15b67fbe8a5b3`。markerは`PREVIEW_SOURCE_COMMIT.txt=2ab9df17a921d4f1175be559abaa8f9733ea69b8`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.0.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.0.0.0 Update10.3`。`index.html`、`hado_formation.js`、`hado_styles.css`、20個の`hadou_*.json`、`.nojekyll`を確認した。
- 公開実操作: `3.0.0.0 Update10.3 r158`、`hado_core.js?v=10.3-r158`、`hado_styles.css?v=10.3-r158`を確認。部隊編成から初回ガイドを開始して検索/通常検索へ移動、検索ガイド8/10で通常検索を選択、部隊編成ガイド8/9で表示中の結果サマリーを選択した。390x844は行間25.2px・文字間隔0.28px、本文内スクロールなし、横はみ出しなし、吹き出しviewport内、browser warning/error 0件で合格した。
- 最小受入操作: 初回ガイドを通常検索以外から開始して通常検索へ移ること、検索ガイド8/10で通常検索が選択されること、部隊編成ガイド8/9で結果サマリーが黄色枠の対象になること、PC/スマホで本文が重ならないことを確認する。

## Update10.4 — 最新クローラーJSONと状態変化マスター更新

- 表示版: `3.0.0.0 Update10.4 r159`。
- クローラー出力: 添付された `gamewith_hadou_selected_data_1.1.0.2.zip` の `data/` と `inherited/` に含まれる33 JSONを、同名ファイル単位で置換した。`previous/`、`report/`、`debug/` はアプリ実行データではないため反映していない。
- 最新データ件数: 武将485、戦法464、装備247、一般技能651、アプリ表示技能索引1,365、陣形21、状態変化206、兵器6、武装18、異文化調査技能32、五行10、軍馬5、軍馬技能27。
- 状態変化追加: 有利変化は豪撃（戦法攻撃威力の後乗せ）、虎守（負傷兵回復と弱化回避）、秀俊（知力累積と条件付き被ダメージ軽減）。不利変化は退勢（通常攻撃時の有利変化不発揮）、封縛（戦法速度低下と弱化解除無効）、封心（会心・撃心不発生）。ゲーム内説明画像を手動正本として `hadou_status_effects.json` に記録した。
- 派生データ: クローラー `tools/regenerate_derived_json.js` により、状態変化を含む派生JSON 20件を一式再生成した。派生JSONは個別編集していない。
- 回帰防止: JSON契約テストの技能・装備件数を旧固定値ではなく今回の入力JSONの件数と段階索引へ照合する方式へ更新し、6件の手動状態変化について名称、分類、説明断片、状態変化メタ索引を検証する。
- HTMLサイズ: データ・外部キャッシュキー・版数のみの更新で、HTML本体の構造拡張はしていない。
- 検証・Actions・Preview: 実施結果はマージと公開Preview同期の確認後に追記する。

## 引継ぎ済みの基準

- 起点commit: `fba2f1999f8f821002931ff2413f4f43cae0983f`
- 起点表示版: `3.0.0.0 Update09.5.65 r155`
- Update09の最終公開Preview: `PREVIEW_SOURCE_COMMIT.txt` が上記正本commit、`PREVIEW_SOURCE_BRANCH.txt` が `feature/app-3.0.0.0`、`PREVIEW_DISPLAY_VERSION.txt` が `3.0.0.0 Update09.5.65` であることを確認済み。
- Update09の最終ローカル検証: `python -X utf8 tools/run_app_validation.py` は119項目成功。

## Git・Actions・公開Preview

- 第1〜3段階PR: `#249`。実装commit `1898527f129ea06779187b610229cbc64366f336`、正本へのmerge commit `2618d164d246ae0e1e9cc2cbbaa6487d78eaaee9`。
- 第1〜3段階App Validation: run `29694697426` 成功。Preview同期: run `29694728280` 成功。
- 公開セルフチェック修正PR: `#250`。修正commit `8cc990134c9c9bb89ac7f5d69fc52ccb46306531`、正本へのmerge commit `197e62d2a778671dc46d2dbc0384e53cae9da6db`。
- 修正App Validation: run `29708498218`、job `88249196734` 成功。Preview同期: run `29708517596`、job `88249241872` 成功。
- 公開Preview repository `main`: `7f21007e865d3144780548f49e5aff36fc1cccd5`。
- marker: `PREVIEW_SOURCE_COMMIT.txt=197e62d2a778671dc46d2dbc0384e53cae9da6db`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.0.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.0.0.0 Update10.1`。
- 公開URL: `https://mytemark2.github.io/hado_library-preview/`。表示版、外部JavaScript/CSS、対象tabpanel、PC/390x844表示、タブ切替、LR張飛の対策リンク、内蔵検証 `criticalFailures=0 / warnings=0 / info=0`、browser warning/error 0件を確認した。

## 残課題

- Update10.4のActionsと公開Preview・marker一致の確認が残る。Update10全体の正式配布物監査と`main`反映判断は継続項目とする。
