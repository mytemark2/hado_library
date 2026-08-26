# 3.1.0.0 Update09 Implementation

## 実装方針

- `tools/test_3_1_0_0_update09_full_regression.js`を全件回帰の単一入口としてApp Validationへ追加する。
- Update01センサスと現在の`hadou_effect_clauses.json`を照合し、母数、意味単位、Clause ID、effect identity、modifier参照、evidence SHAを検証する。
- 既存品質監査の重複候補107群と、実害のあるeffect identity重複を分離する。レベル・段階差を数値正規化した候補群は監査対象として残し、実害判定はClause IDとeffect identityで行う。
- Update08の44 reviewed Clause画面統一回帰、既存の保存往復・検索・候補・レスポンシブ回帰を同じApp Validationで継続実行する。

## 検出した基盤不備

WindowsのCRLF checkoutでは`hadou_bundle_manifest.json`の内容が同じでも、検証ツールが改行コードを生比較して不一致と誤判定した。マニフェスト生成時と同じLF正規化を検証側にも適用し、Windows/Linuxで同じ結果になるよう恒久修正する。

## 版表示

全Updateの最終段階であるため、runtime `updateNo`を空にし、Previewを`3.1.0.0 r190`と表示する。正式公開ではないため`formalRelease`は`false`のままとする。キャッシュキーは`3.1.0.0-r190`へ統一する。

## 互換性・外部化

- アプリの実行機能、JSON内容、crawler、保存schema、現行スコア値は変更しない。
- 新しい実行時JavaScript/CSSやHTMLインライン実装は追加しない。
- 変更は検証ツール、版情報、キャッシュキー、Update09記録に限定する。
