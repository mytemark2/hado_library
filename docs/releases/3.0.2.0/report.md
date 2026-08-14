# 3.0.2.0 r170 完了報告

## 実装

- 個別状態変化タグを追加し、技能タグの直前へ配置した。
- 状態変化マスターと正規所有者関係をクローラー生成契約へ追加した。
- 自動データ更新との互換経路、表示名入力、PC/スマホ共通タグ処理を追加した。

## 生成結果

- 状態変化タグ: 206件。
- 所有者タグ関係: アプリ契約検証で5,458件。
- 派生JSON: 20ファイルを同一入力から一括生成し、JSONインデックス契約10件に合格した。

## 検証・Preview

- `python tools/run_app_validation.py`: 131/131合格。
- PC実操作: 状態変化グループが技能グループの直前。`状態変化:攻撃上昇` の表示名入力・自動追加・検索を確認。
- スマホ実操作: 375pxで文書・タグパネル・状態変化行の横overflow 0px、タグ入力16px、`状態変化:畏怖` で武将5件。
- console error / warning: 0件。
- HTML: 29,172 bytesから29,198 bytesへ26 bytes増。ロジックは外部JavaScriptのためHTMLへ追加していない。
- クローラーPR: `mytemark2/hado_library-crawler#16`、統合コミット `f97bb5f9ff0a2cf31fb77f1cabec56dcc7552e08`。
- アプリPR: `mytemark2/hado_library#283`、統合コミット `2bd349129d9abe86f273784e2d1da6de2e94b09e`。
- `App Validation / app-validation`: success（run `31688034011`）。
- `Notify Hado Library Preview`: success（run `31688065271`）。
- `Deploy Hado Library Preview`: success（run `31688116205`）、Preview repository `main` は `b0fe17a66ecef2e5d145de25831c728de467a82e`。
- 機能実装配信時のPreview marker: source commit `2bd349129d9abe86f273784e2d1da6de2e94b09e`、source branch `feature/app-3.0.0.0`、display version `3.0.2.0 r167`。
- 公開URL `https://mytemark2.github.io/hado_library-preview/` で、表示版、状態変化タグの配置、`状態変化:畏怖` の5件検索、ログ表示、console error / warning 0件を確認した。

## r168 スマホChrome候補選択修正

- ブラウザ標準 `datalist` を独自listboxへ置き換え、候補を最大16件に制限した。
- `掃討` を一意な表示名として `技能:掃討` に解決し、入力確定または候補タップで自動追加する。
- IME変換中は候補を構築せず、候補選択後はタグ表示を先に確定してから検索する。
- スマホ入力16px、候補幅100%、表示高上限38dvh、44pxのタップ領域を設定した。
- `python -X utf8 tools/run_app_validation.py`: 132/132合格。
- ローカルChrome・375px: 通常検索と状態変化検索の双方で `掃` から候補 `掃討｜技能` を表示し、候補タップ後に入力欄が空、選択済みタグが `技能：掃討`、検索完了後21件となることを確認した。
- ローカルChrome・375px: 文書幅375px、横overflow 0px、visual viewport scale 1、タグ入力16px。状態変化2選択と解除は同一行、タグ入力は崩れのない次行表示。
- ローカルChrome・1280px: 同じ候補タップ操作で `技能：掃討` を追加し、横overflow 0px、visual viewport scale 1を確認した。
- console error / warning: 0件。
- HTML: 29,198 bytesから29,327 bytesへ129 bytes増。候補listboxの最小DOMのみ追加し、処理は外部JavaScript、表示は外部CSSへ実装した。

## r169 候補表示性能の追加修正

- r168公開Previewのデバッグログで候補描画約570msを検出したため、完了判定前に候補検索索引を事前計算方式へ変更した。
- r168は選択不成立を解消した発行済みPreview、r169は候補表示性能まで含めた最終確認版とする。
- r169ローカルChromeログでは `掃` の候補描画0.4ms、候補1件。375pxで候補タップ後に入力欄が空、`技能：掃討` が表示され、横overflow 0px、scale 1、入力16pxを確認した。
- 再フォーカス後に古いblurタイマーが候補を閉じる競合を世代番号で無効化し、pointerdownからclickまで候補を保持する回帰検証を追加した。

## r170 候補の明示選択へ統一

- PC・スマホChromeとも、`掃討` の入力・IME確定では候補を表示するだけに変更した。
- 候補未選択のEnterではタグを追加せず、候補タップ／クリック、またはArrowDownで候補を選択してからEnterした場合だけ `技能：掃討` を追加する。
- 通常検索と状態変化検索は同じ入力・候補選択処理を使用し、端末別の自動追加経路を持たない。
- 表示版は `3.0.2.0 r170`。正式版 `3.0.1.1` は変更しない。
- `python -X utf8 tools/run_app_validation.py`: 133/133合格。状態変化タグ206件・所有者関係5,458件、20派生JSON契約を含む。
- ローカルChrome・390×844: `掃討` 入力後に候補1件を表示し、未選択Enter後も入力値 `掃討`・`タグ未指定` を維持した。候補クリック後は入力欄が空、`技能：掃討`、21件となることを確認した。
- ローカルChrome・390×844: `掃` → ArrowDown → Enterでも `技能：掃討` を追加し、通常検索・状態変化検索の双方で同じ未選択／明示選択動作を確認した。
- ローカルChrome・390×844: 文書client幅375px・scroll幅375px、visual viewport scale 1、タグ入力16px。横方向のレイアウト崩れと自動拡大はない。
- ローカルChrome・1280×900: `掃討` → 未選択Enterでは未登録、候補クリック後に21件。文書幅1280px・横overflow 0px・scale 1を確認した。
- console error / warning: 0件。
- HTML: 29,327 bytesから29,327 bytesで増減なし。DOM構造は変更せず、処理は外部JavaScriptへ実装した。
- アプリPR: `mytemark2/hado_library#287`、統合コミット `e79aca94ba6a2b11369acebae41fd39bd26dc023`。
- `App Validation / app-validation`: success（run `31765878690`）。
- `Notify Hado Library Preview`: success（run `31765915304`）。
- `Deploy Hado Library Preview`: success（run `31765940055`）、Preview repository `main` は `ade1bb9369620e487adce9e79f5ee0eba41edd67`。
- Preview marker: source commit `e79aca94ba6a2b11369acebae41fd39bd26dc023`、source branch `feature/app-3.0.0.0`、display version `3.0.2.0 r170`。
- 公開URL `https://mytemark2.github.io/hado_library-preview/` の390×844で、入力・未選択Enter後は `掃討` と候補1件を維持し、タグ未指定のままであることを確認した。通常検索・状態変化検索とも候補タップ後は `技能：掃討`、21件、入力空、横overflow 0px、scale 1、入力16pxとなった。
- 公開URLの1280×900でも未選択Enterでは未登録、候補クリック後は `技能：掃討`、21件、横overflow 0px、scale 1となった。
- 公開Debug Logで `candidate-tap` → タグ先行描画 → 遅延検索 → 21件フィルターを確認し、console error / warningは0件だった。

## 正式版3.0.2.0への昇格

- 利用者がPreview `3.0.2.0 r170` の動作を確認し、正式版への反映を明示承認した。
- 昇格元をPreview source commit `1a5ce523053661c3b8d6a8fc5a295ef620196fe6` に固定し、再クロール・再生成を行わない。
- 正式版mainの基点は `8c4866ee4d68df00eca67daba947dfcda25c24a1`。正式版専用Pages workflowと公開履歴を保持して内容統合する。
- `revision: 170` を内部追跡用に保持し、`formalRelease: true` により正式版画面では `3.0.2.0` だけを表示する。
- 検証、Pull Request、Pages配信、公開URLの結果は正式版配信確認後に追記する。
