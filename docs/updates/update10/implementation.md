# Update10 Implementation

## 状態

Update10.1 実装中。

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
