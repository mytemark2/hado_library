# Update08 Implementation

## 変更概要
- `hado_type_candidates.js` を Update08 へ更新し、保存データ表示時の所有情報フィルターと型からの新規部隊作成ボタンを追加した。
- `hado_formation.js` の部隊データ構造へグループ、評価情報、メモ、履歴を追加した。
- `hado_core.js` のExport/Import経路でグループ情報を保持するようにした。
- `3.0.0.0 Update08.1` として、`hado_status_effects.js` に編成画面用リンクヘルパーを配置し、分割後HTMLで読み込まれない `hado_app.js` への依存を解消した。
- 修正ごとの視認性を担保するため、Update完了後のユーザー可視修正では `Update08.1` のように表示サフィックスを増分するルールを `AGENTS.md` に明文化した。
- `3.0.0.0 Update08.2` として、保存所有名と型候補名を同じ照合キーへ正規化し、保存データ表示の型候補一覧で所有武将・装備が過少表示される問題を修正した。
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
- `python3 tools/validate_formation_link_helpers.py`
- `python3 tools/validate_type_candidate_saved_name_matching.py`
