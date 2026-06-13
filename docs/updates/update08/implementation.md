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
- `3.0.0.0 Update08.10` として、preview検証に `hado_styles.css` の公開有無・HTML参照・主要CSS内容確認を追加し、CSS未配信をworkflow失敗として検知するようにした。
- `3.0.0.0 Update08.11` として、preview repo側の Pages 公開workflow `jekyll-gh-pages.yml` が存在し、`actions/jekyll-build-pages` と `actions/deploy-pages` を含むことをapp側通知前に検証するようにした。
- `3.0.0.0 Update08.12` として、preview repoへの同期commit反映を `PREVIEW_SOURCE_COMMIT.txt` で待機した後、app側workflowから preview repo の `jekyll-gh-pages.yml` を自動dispatchしてPages公開を明示起動するようにした。
- `3.0.0.0 Update08.13` として、dispatch前にローカル `hado_styles.css` のサイズ/必須CSS断片を検証し、公開previewの `hado_styles.css` も10万byte以上かつ必須CSSを含むことを検証するようにした。
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

- Update08.14: preview同期をrepository_dispatch依存から、app workflowが現在のsource branch checkoutをpreview repoへrsyncする直接同期へ変更。`hado_styles.css` を同期先repo上でも検証し、公開後もCSSサイズ・必須断片・source branch/commitを照合する。

- `3.0.0.0 Update08.15` として、保存データ型候補一覧の所有判定を `state.savedModeIndex` だけに依存しないようにし、現在の保存データ本体（所有リスト・将星・能力設定・継承技能・装備星/段階）からも候補照合Setを再構築するようにした。あわせて旧名/基礎名・レアリティ付き名・ORIGINS表記を別名キーとして照合する。

- `3.0.0.0 Update08.16` として、保存データ型候補一覧の判定軸を修正し、候補表示の所有判定はお気に入り（`generals` / `equipments`）だけを使用し、`generalStars` / `generalSettings` / `inheritedSkills` は所有扱いにしないようにした。武将の型スコアは、保存将星から解放済み技能を解決し、未解放技能由来の候補特徴を除外して評価する。

- `3.0.0.0 Update08.17` として、型スコアの役割限定判定を修正した。`この武将が主将の場合` と `対象部隊の主将と...` が同じ戦法本文に混在する場合でも、主将限定句を副将/補佐/侍従へ誤適用しないようにし、回帰テストを追加した。

- `3.0.0.0 Update08.18` として、保存データ表示時の型候補スコアで、保存将星により解放済みの技能が付与する技能名も所有技能として扱うようにした。さらに `■主将の際` / `■副将の際` の見出し配下にある `●` / `▼` 箇条書きへ役割限定スコープを引き継ぎ、保存データ＋役割限定の組み合わせで未所有技能句が別役割へ混入しないようにした。

- `3.0.0.0 Update08.19` として、保存データ＋限定パターンで技能名だけでなく技能Lvも評価するよう修正した。保存将星で解放された技能が Lv1 の場合に、同一技能名の Lv2 限定効果や Lv2 で付与される技能を所有扱いにしないよう、型候補側で所有技能Lvを保持して `matchedText` の `技能名2` / `技能名Lv2` 要求と照合する。

- `3.0.0.0 Update08.20` として、保存データ＋限定パターンの原因調査をやり直し、`盟主がLv3以上` / `技能「備急」をLv2` / `●歓喜Lv2` のように技能名とLv指定の間に助詞・引用符・説明語が入る実データ表現を要求Lvとして解析するようにした。`技能Lv×20%` のような倍率表現はLv20要求と誤判定しない回帰確認も追加した。

- `3.0.0.0 Update08.21` として、保存データ型候補一覧のタブ件数が所有済み0点候補まで選択可能として数えてしまい、主将/副将/補佐/侍従の件数差が消える問題を修正した。候補一覧は所有対象に限定したうえで `matchedCount > 0` の選択可能候補だけを表示し、`tools/test_type_candidate_counts.js` で全データと保存データ（全所有相当）の件数一致、保存サンプルでの大幅崩壊なし、役割別件数差を確認する。
