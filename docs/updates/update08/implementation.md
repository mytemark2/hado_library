# Update08 Implementation

## 変更概要
- `hado_type_candidates.js` を Update08 へ更新し、保存データ表示時の所有情報フィルターと型からの新規部隊作成ボタンを追加した。
- `hado_formation.js` の部隊データ構造へグループ、評価情報、メモ、履歴を追加した。
- `hado_core.js` のExport/Import経路でグループ情報を保持するようにした。
- `3.0.0.0 Update08.1` として、`hado_status_effects.js` に編成画面用リンクヘルパーを配置し、分割後HTMLで読み込まれない `hado_app.js` への依存を解消した。
- 修正ごとの視認性を担保するため、Update完了後のユーザー可視修正では `Update08.1` のように表示サフィックスを増分するルールを `AGENTS.md` に明文化した。
- `3.0.0.0 Update08.2` として、保存所有名と型候補名を同じ照合キーへ正規化し、保存データ表示の型候補一覧で所有武将・装備が過少表示される問題を修正した。
- `3.0.0.0 Update08.3` として、実行時の表示バージョン定義を `hado_version.js` の `HADO_VERSION` に集約し、型候補一覧は `window.HADO_APP_DISPLAY_VERSION` / `window.HADO_APP_VERSION_META` を参照するようにした。
- `3.0.0.0 Update08.4` として、保存データ表示の所有判定に明示所有リストだけでなく、将星・能力設定・継承技能・装備星/段階の保存設定キーも含めるようにした。
- `3.0.0.0 Update08.5` として、保存データ表示では所有対象を適合0点でも表示し、スコア一致だけで候補から落とさないようにした。
- `3.0.0.0 Update08.6` として、HTML内の大型CSSブロックを `hado_styles.css` へ分離し、HTMLはCSS参照のみを持つ構造にした。
- `3.0.0.0 Update08.7` として、起動直後のChromeフリーズ対策のため、表示バージョン同期の全DOM `MutationObserver` を廃止し、初期化・メタ読込後・明示イベントのみで同期するようにした。
- `3.0.0.0 Update08.8` として、実行時の可視バージョン定義を `hado_version.js` の `HADO_VERSION` だけに集約し、`HADO_DEV_INFO.json` と `hado_update_meta.js` から重複する `updateNo` / `displayVersion` 定義を廃止した。
- `3.0.0.0 Update08.9` として、アプリ側preview通知の `repository_dispatch` event_type をpreview側workflowの `sync_app_preview` と一致させ、`PREVIEW_SOURCE_COMMIT.txt` と `hado_version.js` で反映commit/versionを検証するようにした。
- 部隊作成・複製時にグループあたり12部隊制限を適用し、グループは最大5件に制限した。
- 既存の将星解決、装備段階、保存データ索引を再利用し、HTMLへ大型ロジックを追加しない方針を維持した。

## HTMLサイズ
- `index.html`: 202484 bytes → 28444 bytes（-174040 bytes）
- `hado_library_3.0.0.0.html`: 202484 bytes → 28444 bytes（-174040 bytes）
- `hado_styles.css`: 174397 bytes（HTMLから分離）

## 外部化判断
Update08の実装は既存責務の外部JSである `hado_type_candidates.js` と `hado_formation.js` に統合した。新規の Update 番号付きJSは作成していない。Update08.6で大型CSSは `hado_styles.css` に分離し、HTMLは外部CSS参照のみを持つ。

## 検証
- `node --check hado_formation.js`
- `node --check hado_type_candidates.js`
- `node --check hado_version.js`
- `python3 -m json.tool HADO_DEV_INFO.json`
- `python3 -m json.tool hadou_type_search_role_index.json`
- `python3 tools/validate_app_js.py`
- `python3 tools/validate_formation_link_helpers.py`
- `python3 tools/validate_type_candidate_saved_name_matching.py`
- `python3 tools/validate_update_version_consistency.py`
- `python3 tools/validate_saved_mode_index_ownership_sources.py`
- `python3 tools/validate_saved_type_candidates_zero_score_visible.py`
- `python3 tools/validate_external_css.py`
- `python3 tools/validate_preview_workflow.py`
- `python3 tools/validate_update_meta_no_broad_observer.py`
