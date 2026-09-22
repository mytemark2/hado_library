# 3.1.2.0 実装記録

## 実装内容

- `hado_troop_skills.js`を追加し、`hadou_generals.json.troop_effects`の5兵科を独立した検索データに正規化した。
- 検索カテゴリ`兵科`を追加し、名称、兵科、付与文、効果文の部分一致検索に対応した。
- 検索結果は「兵科 / 付与文」を副見出しにし、内容詳細は兵科、付与、効果の順で表示する。
- 保存データ表示中でも兵科技能は共通マスターとして検索対象にする。
- Clause Shadowは評価切替え判定に必要な計算・ログを維持し、利用者向けの比較カードを生成しない実装に変更した。

## データ契約

- 入力: `hadou_generals.json`の`troop_effects`
- `schema_version`: `1`
- `scope`: `commanders-troop-type`
- 検索項目: `騎兵/走撃`、`弓兵/射襲`、`工兵/操器`、`盾兵/列盾`、`歩兵/反槍`
- JSON自体はクローラー生成物を使用し、アプリ側で手修正していない。

## 変更ファイルと責務

- `hado_troop_skills.js`: 契約読取り、正規化、起動統合、詳細・コピー用データ
- `hado_core.js` / `hado_search.js` / `hado_status_effects.js`: カテゴリ、検索、参照、タグ表示の統合
- `hado_bootstrap.js`: 起動時の兵科技能組み込みと索引対象追加
- `hado_formation.js`: Clause Shadow比較カードの非表示
- `index.html`: 新規外部JavaScriptの読込みとPreviewキャッシュキー更新
- `hado_version.js` / `HADO_DEV_INFO.json`: `3.1.2.0 r206`の開発Preview識別
- Preview workflow、検証スクリプト、回帰テスト: 新ブランチと契約の検証

## HTML肥大化と外部化判定

- 変更前Git blob: 28,976 bytes
- 変更後: 29,077 bytes
- 差分: +101 bytes
- 判断: 追加振る舞いは`hado_troop_skills.js`へ外部化し、HTMLは読込み宣言とキャッシュキーのみ変更した。

## ソース基準

- 3.1.1.0開発ソース: `a8da10e`
- 最新公開データを含む`origin/main`: `996bfbe`
- 両者の統合基準: `be9d13f9c3180c1de1917383c59adcb5e526214e`、競合なし
