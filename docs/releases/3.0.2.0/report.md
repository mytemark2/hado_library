# 3.0.2.0 r168 完了報告

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
