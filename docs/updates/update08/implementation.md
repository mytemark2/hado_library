# Update08 Implementation

## 変更概要
- `hado_type_candidates.js` を Update08 へ更新し、保存データ表示時の所有情報フィルターと型からの新規部隊作成ボタンを追加した。
- `hado_formation.js` の部隊データ構造へグループ、評価情報、メモ、履歴を追加した。
- `hado_core.js` のExport/Import経路でグループ情報を保持するようにした。
- 部隊作成・複製時にグループあたり12部隊制限を適用し、グループは最大5件に制限した。
- 既存の将星解決、装備段階、保存データ索引を再利用し、HTMLへ大型ロジックを追加しない方針を維持した。

## HTMLサイズ
- `index.html`: 変更なし（0 bytes）
- `hado_library_3.0.0.0.html`: 変更なし（0 bytes）

## 外部化判断
Update08の実装は既存責務の外部JSである `hado_type_candidates.js` と `hado_formation.js` に統合した。新規の Update 番号付きJSは作成していない。

## 検証
- `node --check hado_formation.js`
- `node --check hado_type_candidates.js`
- `python3 -m json.tool HADO_DEV_INFO.json`
- `python3 -m json.tool hadou_type_search_role_index.json`
- `python3 tools/validate_app_js.py`
