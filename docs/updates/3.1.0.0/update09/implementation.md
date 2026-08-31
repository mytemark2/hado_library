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

## 実装結果

- 全1,822件・意味単位46,362件・生成Clause 24,554件を走査し、未分類、未確認残差、無効Clause、孤立condition/trigger/effect、実害のあるeffect identity重複、modifier基礎effect欠落、evidence SHA不一致をすべて0件にした。
- 正規化後の重複候補107群はレベル・段階差を含む監査候補であり、Clause IDとeffect identityによる実害重複は0件であることを分離して検証した。
- WindowsのCRLF checkoutでbundle manifest検証が誤失敗する問題をLF正規化によって恒久修正し、LF/CRLF同値性をUpdate09全件回帰へ追加した。
- `python -X utf8 tools/run_app_validation.py`は154/154件PASS。PR検証、イベント駆動Preview同期、公開PagesのPC・390x844実操作もPASSした。
- JSON、保存schema、現行スコア値、crawler、`HADO_DEV_INFO.json`は変更していない。
