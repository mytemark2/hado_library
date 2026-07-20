# Update10 Implementation

## 状態

Update10.1〜Update10.4 実装完了。全体回帰、Actions、公開Preview、marker一致、正式版`main`反映まで確認済み。

## Update10.1 — タブ視認性改善 第1〜3段階

- 分類: UI視認性、操作フィードバック、アクセシビリティの横断改善。
- 原因: タブ種別ごとに選択表現が薄い下線・クラス指定へ分散し、表示内容側に現在位置を示す見出しがなく、キーボード状態同期も個別実装だった。
- 影響範囲: 上位3画面、通常/状態変化/型検索、内容詳細、部隊編成内4表示、候補ワークスペースの役割、型編成ナビの入口モード。
- 恒久対策: `hado_tabs.js` を共有責務とし、`role=tab/tablist/tabpanel`、`aria-selected`、`tabindex`、矢印/Home/End/Enter/Space操作を同期する。見た目は `hado_styles.css` の共通トークンと選択状態セレクタへ集約する。
- 実装: 選択中を色だけに依存させず、面の塗り、輪郭、太字、チェック/ドットを組み合わせる。PCとスマホで同じ選択状態の表現を使う。
- 表示密度の再調整: タブ自体の面・輪郭・太字・選択記号で状態を判別できるため、追加行となっていた「〇〇を表示中」と上位タブ内の「表示中」バッジは撤去した。ARIA選択状態とキーボード操作は維持する。
- 回帰防止: `tools/test_update10_1_tab_clarity.js` で全適用先、読込順、CSS状態、横/縦・自動/手動キーボード挙動を検証し、全App Validationへ常設する。
- 外部化判断: 新規動作は外部 `hado_tabs.js`、視覚変更は `hado_styles.css` に配置し、HTMLにはARIA構造とscript参照だけを追加する。

### 公開前セルフチェックで検出した同種不整合

- 公開Previewの内蔵検証で、外部化済みJavaScript/CSS、遅延描画タブ、6項目結果サマリー、現行軍馬3枠UIを旧DOM・旧関数名で判定する誤検知を確認した。
- 可視版は `hado_version.js` の `visibleVersion` を正本として検証し、外部CSSは `document.styleSheets`、検証器ソースは実関数、遅延描画画面は関数・要素・操作smokeで確認するよう恒久化した。
- 型プリセットの別名条件は、同じ `canonicalFeatureId` を持つ生成済みfeatureが解決できる場合に正規概念として解決済みと判定する。exact IDだけを必須にしない。
- クローラーが `related.mechanics` に出力する非マスタ対策リンクを、`related.statusEffects` と同じ6分類の表示入力へ統合した。LR張飛の `畏怖回避[鋼胆]` / `恐怖回避[鋼胆]` を固定回帰fixtureとして追加した。
- これらはタブUIを隠す対症療法ではなく、生成済みJSON契約と現在の外部化構成を検証器・表示器が正しく読むための修正である。

## Update10.2 — 操作ガイド最新化

- 分類: 実装済み機能と操作説明の世代差解消。
- 原因: Update09後半からUpdate10.1までに検索モード独立、IME確定検索、数値境界、型編成ナビ3入口、候補ワークスペース復元、6項目結果サマリーが追加されたが、ガイドの主要説明は旧導線のままだった。
- 実装: スタートガイドの6段階、検索ガイド、部隊編成ガイドを現行機能へ同期する。静的HTMLを肥大化させず、表示文言同期は既存の外部 `hado_core.js` に置く。
- 回帰防止: `tools/test_update10_2_guide_refresh.js` を追加し、現行用語、対象DOM、タブ切替、版数、余分な「〇〇を表示中」行の非復帰を全App Validationで検証する。
- 完了確認: App Validation 122/122、PC/390x844実操作、PR #252、Preview marker、公開Previewでの検索ガイド開始と検索モード独立説明を確認した。

## Update10.3 — ガイド視認性と画面同期

- 分類: ガイドUIの視認性不足と、説明対象画面・DOMの選択不整合。
- 根本原因: スマホ向け上書きが本文の行間を`1.55`へ狭めていた。初回ガイドと検索ガイド8番目は説明対象モードを明示していなかった。また、ガイド対象解決が`querySelector`の先頭1件しか評価せず、PC/スマホ用の重複DOMで先頭が非表示の場合に表示中の結果サマリーを選べなかった。
- 恒久対策: ガイド定義へ対象タブ・検索モードを明示し、対象解決を同一セレクターの全候補から最初の表示要素を選ぶ方式へ変更する。本文と見出しの行間・文字間隔は共通CSSへ固定する。
- 影響範囲: 初回ガイド、検索ガイド、部隊編成ガイド、および同一セレクターに複数DOMが存在する全ガイド対象。
- 回帰防止: `tools/test_update10_3_guide_navigation.js` で版数、3つの画面同期契約、文字間隔・行間、非表示の先頭候補を飛ばして表示中要素を選択する実行テストを行い、全App Validationへ常設する。
- 外部化判断: 動作は既存の外部`hado_core.js`、表示は既存の外部`hado_styles.css`へ実装し、HTMLへインラインJavaScript/CSSを追加しない。

## Update10.4 — 最新データと状態変化マスター

- 分類: クローラー最新データ反映と、クローラーで自動収集できない状態変化説明の手動保守。
- 実装: クローラー`1.1.0.2`の`data/`・`inherited/`に含まれる33 JSONを同名ファイル単位で置換し、有利変化3件（豪撃・虎守・秀俊）と不利変化3件（退勢・封縛・封心）をゲーム内説明画像から追加した。
- 派生データ: クローラーの正規生成処理で派生JSON 20件を一式再生成し、個別の生成JSONは手編集していない。
- 回帰防止: データ件数を固定値ではなく入力JSONと照合し、追加6件の名称・分類・説明断片・状態変化メタ索引を契約テストで確認する。
- 完了確認: App Validation 123/123、PR #256、Preview同期、公開版`3.0.0.0 Update10.4 r159`、武将485件・状態変化206件、追加6件の選択肢表示を確認した。

## 開発完了判断

- Update10.1〜Update10.4の既知残課題はない。
- 配布用ZIPは当面公開しないため、ZIP生成・展開・SHA-256監査は今回の正式版反映条件から除外する。
- 正式版`main`では開発識別子の`Update10.4`と`r159`を表示せず、`3.0.0.0`のみ表示する。

## 正式版実装

- `hado_version.js`の`formalRelease`を正式版表示の単一切替とし、内部の`updateNo`と`revision`はキャッシュキー・履歴識別との互換性のため保持した。
- `hado_update_meta.js`は正式版の`displayVersion`と`visibleVersion`を`releaseVersion`だけから導出する。開発版は従来どおりUpdate番号とrevisionを表示する。
- `HADO_DEV_INFO.json`は`releaseStatus: released`へ変更し、版数値の重複は追加していない。
- 正式版/開発版の両契約を`tools/test_update09_5_40_revision_display.js`、`tools/validate_update_version_consistency.py`、`tools/validate_update09_phase4_guides.py`で検証する。
- `index.html`と実機能JavaScript/CSSは変更していない。HTMLサイズは29,254 bytesから増減なしで、インラインJavaScriptを追加していない。

## 実装方針

- Update09完了commitを唯一の起点とし、古いPreview成果物や過去PRから実装を戻さない。
- 個別要求ごとに影響範囲を調査し、既存責務のJavaScript/CSSへ実装する。
- 表示版を変更する修正では `hado_version.js` を正本として、関連するmetadata、cache key、開発記録を同一変更で同期する。
- JSON索引・クローラー契約が変わる場合は、アプリ側の部分補完ではなくクローラーで派生JSON一式を再生成する。
- Update09で追加した回帰を維持し、変更箇所の専用回帰を `tools/run_app_validation.py` の実行対象へ追加する。

## 最初の実装前チェック

1. 正本ブランチとHEADを取得する。
2. 対象機能のソース、JSON、CSS、workflow、既存の回帰、Update10記録を読む。
3. バグの場合は再現条件と同種経路を先に特定する。
4. `python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.0.0.0` をPR前に実行する。
