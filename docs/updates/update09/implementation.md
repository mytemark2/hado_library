# Update09 Implementation

## Phase 1: UI/UX監査

### 調査対象
- 対象ブランチ: `work`
- 調査開始HEAD: `779c15c5193949a2122004f2cbbf297f969a8ca9`
- 対象Update: Update09（UI/UX調整と実用性改善）
- 主な確認ファイル:
  - `docs/updates/roadmap.md`
  - `docs/updates/update08/implementation.md`
  - `hado_formation.js`
  - `hado_type_entry.js`
  - `hado_type_candidates.js`
  - `hado_candidate_tray.js`
  - `hado_candidate_tray_core.js`
  - `hado_styles.css`
  - `hado_library_3.0.0.0.html`

### 現行実装から見える前提
- Update09は全体ロードマップ上で「UI/UX調整と実用性改善」として予定されており、主将候補の新武将順、武将変更ダイアログ、候補トレイの確認/再選択/解除、表示モード差分、PC/スマホ調整が明記されている。
- 部隊編成の描画は `renderFormationScreenCore()` で、データ計算、診断、スロット、サマリー、タブ、ダイアログHTML生成、linkify、イベント再設定を1回の描画に集約している。
- 型候補一覧はUpdate08.23でロール別キャッシュと診断遅延化が入っているが、ロール行生成では候補のスコア計算・所有判定・表示フィルタ・ソートを同一経路で行う。
- 型編成ナビは `render()` ごとにモーダルHTML全体を再生成し、イベントを再バインドする。主将検索中はIME配慮としてDOM再生成を避ける処理が入っている。
- 候補トレイはフローティングボタンと簡易モーダルで実装され、配置先選択は `hado_candidate_tray_core.js` 内でインラインstyleの一時オーバーレイを直接生成している。
- PC部隊編成レイアウトは固定高さ、左部隊一覧、右作業領域、2カラム編集領域を強制するCSSがある。狭いPC幅やズーム時は、情報量が多いまま固定表示になるリスクがある。
- 型検索の補足説明はコンパクト化済みだが、説明・プリセット詳細・ヘルプが同じ行付近に残っており、常時表示領域を圧迫しやすい。
- スタートガイドのバッジが `2.9.6 操作ガイド` のままで、Update08/Update09の型候補・候補トレイ・保存評価導線と表示上の世代が一致していない。

## UI/UX問題点と改善案

### 1. 部隊編成画面および型編成ナビ/型候補一覧の動作が重い

#### 問題点
- 部隊編成画面はスロット変更、タブ切替、ダイアログ開閉など軽い操作でも `renderFormationScreen()` 経由で画面全体を作り直す箇所が多い。
- `renderFormationScreenCore()` 内で、編成データ計算、診断データ作成、全タブHTML生成、アクティブパネルlinkify、イベント再設定が一括実行され、PC版ではDOM量と再計算量が体感に出やすい。
- 型候補一覧はキャッシュ済みだが、保存データ表示では保存データ署名・所有判定・スコア・診断が候補数に比例する。検索語やロール切替時の再計算をさらに減らす余地がある。
- 型編成ナビはモーダル全体の `innerHTML` 再生成とイベント再バインドが基本で、主将一覧が多い状態では選択・戻る・タブ変更のたびにDOM差し替えが発生する。

#### 改善案
1. **描画範囲の分割と差分更新**
   - 部隊編成を「部隊一覧」「編成盤面」「選択中スロット編集」「結果サマリー」「詳細/変化率」に分け、操作ごとに更新対象を限定する。
   - ダイアログ開閉やタブ切替では編成計算を再実行せず、表示状態のみ更新する。
   - 受け入れ基準: PCでスロット選択・タブ切替・サマリー開閉を連続操作しても明確な固まりがない。

2. **重い計算のキャッシュキーを明示化**
   - `buildFormationParameterData()` の結果を、部隊ID、スロット、装備、陣形、兵器、武装、軍馬、保存データ更新番号の署名でキャッシュする。
   - 型候補一覧は「スコア済み候補」と「検索語フィルタ」を分離し、検索語変更ではスコア再計算を避ける。
   - 受け入れ基準: 検索欄入力、ロール切替、候補トレイ追加後の再表示で候補件数が維持され、Debug Log上でも不要な全件診断が増えない。

3. **表示リストの仮想化/遅延描画**
   - 型候補一覧と主将一覧は初期表示件数を制限し、「さらに表示」またはIntersectionObserverで段階的に描画する。
   - PC版の部隊一覧/候補一覧はスクロールコンテナ内だけを更新し、画面外DOMを減らす。
   - 受け入れ基準: 保存データ表示で候補が多い型を開いても初回表示が短時間で返り、スクロール時のみ追加描画される。

### 2. 部隊編成画面のレイアウトが見にくい、武将編成ポップアップ化が未完成

#### 問題点
- PC版は左に部隊一覧、右に作業領域を固定し、編集タブでは編成盤面と選択中スロット編集を横並びにするため、表示幅が足りないと読み取りづらい。
- スマホ向けの「選択中武将編集」ダイアログはあるが、PCでは右側固定編集パネルの比重が大きく、ユーザーが期待する「武将編成のポップアップ表示」と体験が一致していない。
- スロット、侍従、装備、軍馬、結果サマリー、合算技能、詳細が同一画面内に多く存在し、主作業が「配置すること」なのか「結果を見ること」なのか判断しづらい。

#### 改善案
1. **PCでもスロット編集をモーダル/サイドシート化**
   - 編成盤面を主画面に固定し、武将・侍従・装備・参軍・軍馬の変更はモーダルまたは右サイドシートで開く。
   - 現在のスマホ用 `renderFormationSlotDialogHtml()` の責務をPCにも拡張し、同じ選択ゲートを使う。
   - 受け入れ基準: PCで武将枠クリック → ポップアップ内で変更 → 閉じると盤面に反映、という操作が成立する。

2. **作業モードを「編成」「確認」「詳細」に再整理**
   - 編成タブは盤面と最低限の選択状態だけにし、結果サマリーは固定ミニバー＋拡大表示へ寄せる。
   - 合算技能、状態変化率、陣形/兵器詳細は確認タブ/詳細タブへ分離し、編成中の視覚ノイズを減らす。
   - 受け入れ基準: 初見で「まず枠を押して編成する」ことが分かり、結果確認は別操作として認識できる。

3. **PC幅別のレイアウトブレークポイントを追加**
   - 広幅PCは2ペイン、標準幅PCは部隊一覧を折りたたみ可能、狭幅/ズーム時はスマホに近い1ペインへ切り替える。
   - 固定幅 `minmax(520px,1fr)` などを見直し、横スクロールや圧縮表示を避ける。
   - 受け入れ基準: 1366px幅、125%ズーム、タブレット横幅で操作ボタンと盤面がはみ出さない。

### 3. ガイドの見やすさ改善と最新化

#### 問題点
- スタートガイドの表示バッジが古い世代のままで、Update08で追加された保存データ対応型候補、候補トレイ、新規部隊作成、評価履歴、グループ管理を体系的に説明していない。
- 型編成ナビ、型候補一覧、候補トレイ、部隊編成の関係が画面横断のため、初見では「どこで型を選び、どこで候補を入れ、どこで配置するか」が分断される。
- ガイド文が長文カード形式で常時表示される箇所と、ヘルプアイコンに隠れている箇所が混在し、必要な時に必要な説明へ到達しづらい。

#### 改善案
1. **Update09版スタートガイドへ再構成**
   - 「データ準備」「型を選ぶ」「候補を見る」「候補トレイへ入れる」「部隊編成で配置」「評価/保存」の6ステップへ更新する。
   - バッジと文言を現在の `window.HADO_APP_DISPLAY_VERSION` から表示し、世代ズレを防ぐ。
   - 受け入れ基準: ガイドだけを読めば、保存データ表示で型候補から新規部隊を作る最短導線が分かる。

2. **画面別ミニガイドを導入**
   - 型編成ナビ、型候補一覧、候補トレイ、部隊編成の各画面先頭に「この画面でやること」「次に押すボタン」を1行で表示する。
   - 詳細説明は `?` または `details` に格納し、常時表示は行動指示に限定する。
   - 受け入れ基準: 各画面で迷った時に1クリック以内で操作説明を開ける。

3. **ガイド内に現在状態を反映する**
   - 全データ表示/保存データ表示、保存データ名、型選択済み/未選択、候補トレイ件数、現在部隊をガイドに反映する。
   - 状態に応じて「先に型編成ナビで型を保存してください」「候補トレイから配置先を選んでください」などの次アクションを出す。
   - 受け入れ基準: 未設定状態でもユーザーが次に必要な準備を判断できる。

### 4. 補足説明が多く、画面が見にくい

#### 問題点
- 部隊編成の見出し、型検索、型編成ナビ、型候補一覧に注意書き・スコア説明・理由表示・補足が重なり、主要操作より説明文が目立つ場面がある。
- 「必要なユーザーには重要だが、毎回は読まない」説明が常時表示されるため、PC版の縦方向/横方向の作業領域を圧迫する。
- 説明表示のルールが統一されておらず、ある箇所は常時note、ある箇所はdetails、ある箇所はヘルプアイコンで、視線移動が増える。

#### 改善案
1. **説明文を3階層へ分類する**
   - 常時表示: 5〜20文字程度の行動ラベルのみ。
   - 折りたたみ: 仕様説明、スコア説明、保存データ差分。
   - モーダル/ヘルプ: 詳細ルール、例、注意事項、既知制約。
   - 受け入れ基準: 編成画面初期表示で長文noteが主操作領域を押し下げない。

2. **補足説明の再表示条件を状態連動にする**
   - 初回だけ表示、未設定時だけ表示、エラー/0件時だけ表示など、必要な時だけ補足を出す。
   - 正常に設定済みの画面では「詳しく」ボタンに収納する。
   - 受け入れ基準: 候補あり・部隊ありの通常操作時は説明が短く、0件/未選択時は原因説明が表示される。

3. **共通ヘルプ部品へ統一する**
   - `details`、ヘルプアイコン、ダイアログの見た目とキーボード操作を統一するCSS/JSヘルパーを作る。
   - 型検索・型候補・部隊編成・保存データ差分で同じパターンを使う。
   - 受け入れ基準: PC/スマホともヘルプ表示位置が安定し、閉じ方が統一される。

### 5. 操作導線が分かりにくく、直感的ではない

#### 問題点
- 型編成ナビ、型候補一覧、候補トレイがフローティングボタンとして画面右下に並ぶため、どの順番で使うべきか分かりにくい。
- 候補トレイから配置する際、一時オーバーレイで配置先を選び、その後既存選択処理へ委譲するが、ユーザーには「候補を入れた」「どこへ入れる」「成立条件を満たした/満たさない」の段階が見えづらい。
- 全データ表示と保存データ表示の違いはデータバーにあるが、型候補一覧/部隊編成のその場で候補数や制約の違いとして明示されにくい。

#### 改善案
1. **導線をステップバー化する**
   - 部隊編成タブ内に「1 型を選ぶ → 2 候補を見る → 3 トレイ確認 → 4 配置 → 5 評価保存」のステップバーを置く。
   - 現在状態に応じて完了/未完了/次アクションを表示し、フローティングボタン依存を下げる。
   - 受け入れ基準: 初見で操作順序が画面内に表示され、右下ボタンを探さなくても開始できる。

2. **候補トレイを部隊編成画面へ統合表示する**
   - フローティングの候補トレイに加え、編成画面のサイド/下部に現在部隊のトレイ要約を表示する。
   - 各候補に「配置」「再選択」「解除」を明確なボタンとして並べる。
   - 受け入れ基準: 候補を追加した直後に、どの部隊のトレイへ入ったか、次に配置できることが分かる。

3. **表示モード差分を候補画面内に明示する**
   - 型候補一覧の上部に「全データ: 全候補」「保存データ: 所有済み候補のみ」などのモードバッジと件数理由を表示する。
   - 0件時は「保存データに所有登録がない」「技能Lv条件で除外」など診断結果をユーザー向けに翻訳する。
   - 受け入れ基準: 保存データ表示で候補が少ない理由をDebug Logなしで理解できる。

## 推奨実装順
1. **性能の土台改善**: 部隊編成の差分描画、型候補のフィルタ/スコア分離、不要な全体再描画の削減。
2. **部隊編成のポップアップ化**: PCでもスロット編集をモーダル/サイドシート化し、編成盤面を主役にする。
3. **導線統合**: ステップバーと部隊編成内候補トレイ要約を追加し、右下フローティング依存を減らす。
4. **説明/ガイド整理**: Update09版ガイド、状態連動ヘルプ、補足説明の折りたたみ化を適用する。
5. **PC/スマホ回帰**: ブレークポイント、はみ出し、キーボード/タッチ操作、Import/Export互換を確認する。

## HTMLサイズ
- Phase 1はドキュメントのみのため、`index.html` と `hado_library_3.0.0.0.html` のサイズ変更なし。

## 外部化判断
- Phase 1は実装方針の整理のみ。今後の実装では、部隊編成は `hado_formation.js`、型編成ナビは `hado_type_entry.js`、型候補一覧は `hado_type_candidates.js`、候補トレイは `hado_candidate_tray.js` / `hado_candidate_tray_core.js`、表示調整は `hado_styles.css` へ統合し、Update番号付きJSは作成しない。

## 検証
- `python3 -m json.tool HADO_DEV_INFO.json`
- `python3 tools/validate_app_js.py`
- `python3 tools/validate_external_css.py`
- `python3 tools/validate_type_candidate_render_performance.py`
- `python3 tools/validate_update_version_consistency.py`
- `python3 tools/validate_update09_phase3_formation_ui.py`


## Phase 2: 性能・再描画改善

### 変更概要
- `3.0.0.0 Update09.0` として、部隊編成の状態変化率/合算技能計算結果を、編成内容・保存データ・関連マスタ件数から作る署名でキャッシュするようにした。
- 部隊編成のタブ切替、ダイアログ開閉、選択スロット変更など、編成内容が変わらない再描画では `buildFormationParameterData()` の重い再計算を避け、既存の計算結果を再利用する。
- 型候補一覧では、ロールごとのスコア計算・所有判定結果を検索語なしのベースキャッシュへ分離し、検索欄入力時はベース結果に対する文字列フィルタだけを行うようにした。
- 型候補一覧のロール別件数表示も同じベースキャッシュを使うため、一覧を開いた直後に各ロールの件数を出しても同じロールを検索語ごとに再スコアリングしない。
- キャッシュミス時は Debug Log に `formationParameterData:cache-miss` と `typeCandidate:role-base-cache-miss` を残し、再発時にどの操作で重い計算が走ったか追跡できるようにした。

### 実装詳細
- `hado_formation.js`
  - 既存の計算本体を `buildFormationParameterDataUncached()` に移し、公開関数 `buildFormationParameterData()` はキャッシュ経由に変更した。
  - キャッシュ署名には、表示モード、保存データID、保存データの所有/設定、編成スロット、陣形、出陣種別、兵器/武装、参軍、軍馬、関連マスタ件数を含めた。
  - キャッシュサイズは小さく保ち、異なる編成・保存データを跨いで古い計算結果を持ち続けない。
- `hado_type_candidates.js`
  - `roleBaseCache` を追加し、ロール別のスコア済み候補を検索語と独立して保持する。
  - `roleRows()` は検索語変更時に `roleRowsBase()` の結果を絞り込むだけにし、検索入力のたびに `scoreCandidate()` を再実行しない。
  - 型変更・保存データ変更・表示モード変更時は既存の `clearRoleRowsCache()` でベースキャッシュと検索結果キャッシュの両方を破棄する。
- `hado_version.js`
  - 可視バージョンを `3.0.0.0 Update09.0` / revision 32 へ更新した。
- `HADO_DEV_INFO.json`
  - 実行時バージョン正本は `hado_version.js` のまま、開発概要をUpdate09性能改善へ更新した。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- 性能改善は既存責務の `hado_formation.js` と `hado_type_candidates.js` に統合した。
- HTMLへ大型ロジックやインラインスクリプトは追加していない。
- 新規のUpdate番号付きJSは作成していない。

### 検証
- `node --check hado_formation.js`
- `node --check hado_type_candidates.js`
- `python3 -m json.tool HADO_DEV_INFO.json`
- `python3 tools/validate_app_js.py`
- `python3 tools/validate_external_css.py`
- `python3 tools/validate_type_candidate_render_performance.py`
- `python3 tools/validate_update_version_consistency.py`
- `python3 tools/validate_update09_phase3_formation_ui.py`
- `python3 tools/validate_formation_link_helpers.py`
- `python3 tools/validate_update09_phase3_formation_ui.py`
- `python3 tools/validate_preview_workflow.py`
- `python3 tools/validate_merge_queue_workflow.py`


## Phase 3: 部隊編成レイアウト改修メモ

### 変更方針
- Phaseが分かるように、Update09の可視表示は `Update09.x.y` 形式へ切り替える。`x` はフェーズ番号、`y` は当該フェーズ内の改修回数とし、Phase 3の初回改修は `Update09.3.0` とする。
- 部隊編成のグループ表示は、グループ名と主要ボタンを含めて1行に収める。名前変更は別ダイアログへ分離し、通常表示ではグループ行の高さを増やさない。
- 型選択は重複表示を再考し、選択済み型・型説明・導線が複数箇所で競合しないように整理する。表示型IDは通常利用者には不要な情報として表示しない。
- トータルスコアと評価スコアは自動計算結果であり、入力ダイアログとして表示しない。各表示スコアはトータルスコア配下にぶら下がる構成で再設計する。
- 履歴へ保存は不要とし、保存ボタン押下時に保存する。マイメモは1行表示にして、編集する場合のみ別ダイアログを開く。

### Phase 3実装時の受け入れ観点
- PC幅でグループ行が1行表示になり、グループ名変更操作だけが別ダイアログで完結すること。
- 型選択状態が重複せず、表示型IDが通常UIから消えていること。
- スコア入力欄が表示されず、トータルスコア配下に各評価スコアが読み取り専用でまとまっていること。
- 保存操作は保存ボタンに集約され、マイメモは通常時1行、編集時のみ別ダイアログになること。

### HTMLサイズ
- Phase 3改修メモ追加時点では `index.html` と `hado_library_3.0.0.0.html` は変更なし。

### 外部化判断
- 今回は改修メモと可視バージョン整理のみ。実装時は部隊編成の既存責務である `hado_formation.js` と表示調整の `hado_styles.css` へ統合し、HTMLへ大型ロジックを追加しない。


## Phase 3.1: 部隊編成レイアウトと変更ダイアログ実装

### 変更概要
- 可視バージョンを `3.0.0.0 Update09.3.1` / revision 34 へ更新した。
- 部隊編成のグループ行を、グループ選択・現在名・名前変更・グループ追加・上限表示まで含めて1行表示へ整理した。
- グループ名変更はインライン入力を廃止し、別ダイアログで編集するようにした。
- 編成盤面のスロット選択はPC/スマホともポップアップ編集を開くようにし、右側の常時編集カードは案内表示へ変更した。
- 型表示は型名のみを通常表示し、表示型IDの常時表示入力欄を廃止した。
- トータルスコア/評価スコアは入力欄を廃止し、武将・装備・侍従・参軍・兵器/武装・合算技能・状態変化・型から自動計算した読み取り専用サマリーとして表示するようにした。
- 履歴へ保存ボタンと履歴一覧の常時表示を廃止し、保存ボタン押下時に現在の自動計算スコアを保存するようにした。
- マイメモは1行表示にし、編集時だけ別ダイアログを開くようにした。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- Phase 3の画面挙動は既存責務の `hado_formation.js` へ統合した。
- 表示調整は既存外部CSSの `hado_styles.css` へ統合した。
- HTMLへ大型ロジックやインラインスクリプトは追加していない。

### 検証
- `node --check hado_formation.js`
- `python3 -m json.tool HADO_DEV_INFO.json`
- `python3 tools/validate_app_js.py`
- `python3 tools/validate_external_css.py`
- `python3 tools/validate_update_version_consistency.py`
- `python3 tools/validate_update09_phase3_formation_ui.py`


## Phase 3.2: 部隊編成描画エラー修正

### 変更概要
- 可視バージョンを `3.0.0.0 Update09.3.2` / revision 35 へ更新した。
- Phase 3のポップアップ編集化で参照していた `renderFormationWarhorseSlotsHtml()` が未定義だったため、部隊編成描画時にエラーになる問題を修正した。
- 軍馬3枠の表示、選択、解除、編集導線を `hado_formation.js` に復元し、既存の保存データ軍馬情報 `getCurrentWarhorseData()` と連携するようにした。
- 再発防止として、Phase 3 UI契約検証に軍馬スロット表示/更新/編集ヘルパーの存在確認を追加した。

### 検証
- `node --check hado_formation.js`
- `python3 tools/validate_update09_phase3_formation_ui.py`
- `python3 tools/validate_update_version_consistency.py`


## Phase 3.3: スコアパネル・グループ管理・型候補説明・軍馬表示の追加整理

### 変更概要
- 可視バージョンを `3.0.0.0 Update09.3.11` / revision 44 へ更新した。
- `編集はポップアップで行います` パネルを廃止し、その位置へ `トータルスコア` パネルを移動した。
- 部隊編成スコアは各武将枠ごとのスコア合算として再計算し、トータルスコア/評価スコアの下に主将・副将・補佐別の内訳を表示するようにした。
- グループ行は `グループ`、`グループリスト`、`変更` の3表示に整理し、変更ダイアログから新規作成・名前変更・削除を行う構成へ変更した。
- 型候補一覧の説明から可視バージョン、補足説明、候補クリック説明を削除し、選択中の型・目的・全データ表示/保存データ表示を1行で表示するようにした。
- 軍馬選択の `編集` ボタンを廃止し、軍馬3枠を横並びグリッドで表示するようにした。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- 挙動変更は既存責務の `hado_formation.js` と `hado_type_candidates.js` へ統合した。
- 表示調整は既存外部CSSの `hado_styles.css` へ統合した。
- HTMLへ大型ロジックやインラインスクリプトは追加していない。

### 検証
- `node --check hado_formation.js`
- `node --check hado_type_candidates.js`
- `python3 -m json.tool HADO_DEV_INFO.json`
- `python3 tools/validate_app_js.py`
- `python3 tools/validate_external_css.py`
- `python3 tools/validate_update_version_consistency.py`
- `python3 tools/validate_update09_phase3_formation_ui.py`

## Phase 3.3 preview通知診断強化

### 変更概要
- `Notify Hado Library Preview` のsource preview asset検証で必須ファイルが欠落した場合、欠落名だけでなく、存在している必須アセットとworkflowから見えているルートファイル一覧を出力するようにした。
- preview repo同期後検証でも、欠落時に同期後rootファイル一覧を出力するようにした。
- `tools/validate_preview_workflow.py` に、preview asset欠落時の診断文言がworkflowに残っていることを検証する項目を追加した。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- アプリ本体のHTML/JS/CSSは変更していない。preview通知workflowと検証スクリプトのみの診断強化である。

## Phase 3.3 preview workflow簡素化

### 変更概要
- `Notify Hado Library Preview` から、アプリ検証と重複するsource preview asset事前検証を削除した。
- preview repo同期後のHTML/CSSサイズ/断片検証を削除した。
- preview Pages workflow定義をGitHub APIで事前確認するステップを削除した。
- 公開preview検証は、source commit、source branch、`hado_version.js` の表示バージョン一致へ絞った。
- `tools/validate_preview_workflow.py` を簡素化後のpreview workflow契約に合わせた。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- アプリ本体のHTML/JS/CSSは変更していない。preview通知workflowと検証スクリプトのみの責務整理である。

## Phase 3.3 workflow action version rollback

### 変更概要
- `actions/checkout@v5` を `actions/checkout@v4` へ戻した。
- `actions/github-script@v8` を `actions/github-script@v7` へ戻した。
- preview、merge queue、auto-merge workflow validatorの期待値も安定版へ戻した。
- Node.js 20 deprecationは現時点では警告として扱い、runner互換性未確認のmajor upgradeをpreview/UI改修PRに混ぜないよう整理した。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- アプリ本体のHTML/JS/CSSは変更していない。GitHub Actions workflowと検証スクリプトのみの互換性修正である。

## Phase 3.3 preview push競合対策

### 変更概要
- `Notify Hado Library Preview` に `concurrency: group: hado-library-preview-sync` を追加し、preview同期runを直列化した。
- preview repoへのpushがremote更新競合で拒否された場合に備え、fresh cloneから最大3回retryする処理を追加した。
- `tools/validate_preview_workflow.py` にconcurrency/retry契約の検証を追加した。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- アプリ本体のHTML/JS/CSSは変更していない。preview通知workflowと検証スクリプトのみの競合対策である。

## Phase 3.3 dispatch権限/配布HTML必須チェック削除

### 変更概要
- `Notify Hado Library Preview` から `workflow_dispatch` API呼び出しステップを削除し、preview repo pushによるデプロイ起動に一本化した。
- `PREVIEW_REPO_TOKEN` の案内を Contents: Read and write のみに整理し、Actions: write を不要にした。
- `tools/validate_app_js.py`、`tools/validate_external_css.py`、`tools/validate_update_version_consistency.py` から通常開発時の `hado_library_3.0.0.0.html` 必須チェックを削除した。
- `tools/validate_preview_workflow.py` からdispatch API前提の検証を削除した。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- アプリ本体のHTML/JS/CSSは変更していない。workflowと検証スクリプトの責務整理である。

## Phase 3.3 saved候補validator文言依存修正

### 変更概要
- `tools/validate_saved_type_candidates_zero_score_visible.py` から、削除済みUI文言 `適合する候補だけを選択可能として表示` の必須チェックを削除した。
- saved-mode候補の0点除外は、表示文言ではなく `candidateVisibleByScore()` と `owned.filter(candidateVisibleByScore)` の挙動で検証するようにした。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- アプリ本体のHTML/JS/CSSは変更していない。validatorの旧UI文言依存を削除したのみである。

## Phase 3.3 preview sync最小化

### 変更概要
- `Notify Hado Library Preview` の同期対象を `index.html`、`hado_*.js`、`hado_styles.css`、`hadou_*.json` に限定した。
- `rsync -a --delete ./` を廃止し、preview root全体同期をやめた。
- preview rootの `.git` / `.github` 以外を削除してから、現在runtimeに必要な最小ファイルと `PREVIEW_SOURCE_*` だけを配置するようにした。
- `tools/validate_preview_workflow.py` に、広範囲rsync・dispatch・post-sync verifyが戻らないことを検証する禁止条件を追加した。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- アプリ本体のHTML/JS/CSSは変更していない。preview同期workflowと検証スクリプトのみの最小化である。


## Phase 3.4 型候補一覧スコア計算変更

### 変更概要
- 型候補一覧の適合スコアを、対象武将が対象型の5条件に一致する状態変化率項目数の合計値へ変更した。
- 評価スコアを、条件ごとの状態変化率項目数を合計した値として扱うようにした。
- トータルスコアを、部隊メンバー配列が渡された場合は対象部隊内メンバーの適合スコア合計、通常の単体候補では対象武将の適合スコアとして扱うようにした。
- 型候補カードには、適合スコア、評価スコア、トータルスコアを「件」単位で表示するようにした。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- スコア計算は既存責務の `hado_type_score.js`、表示は `hado_type_candidates.js` へ統合した。HTMLへのロジック追加は行っていない。

## Phase 3.5 部隊編成スコア計算反映

### 変更概要
- 部隊編成のトータルスコア/評価スコアも、選択中の型の5条件に一致する状態変化率項目数の合計値へ変更した。
- `hadou_type_score_rules.json` を部隊編成側でも参照し、型候補一覧と同じ `HadoTypeScore` の件数ベース採点を使うようにした。
- 型ルール未読込時は非同期で読み込み、読み込み完了後に部隊編成画面を再描画する。
- 型編成ナビ/型候補一覧で読み込んだ型ルールは `window.HADO_TYPE_SCORE_RULES` に共有し、部隊編成スコアでも再利用する。
- 部隊編成スコアパネルの表示単位を `点` から `件` に変更し、条件別の状態変化率項目数を表示するようにした。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- 部隊編成スコア反映は既存責務の `hado_formation.js`、型ルール共有は `hado_type_entry.js` / `hado_type_candidates.js` へ統合した。HTMLへのロジック追加は行っていない。

## Phase 3.6 型候補表示とスマホ部隊スコア表示修正

### 変更概要
- 型候補一覧の武将候補カードからトータルスコア表示を削除した。
- 型候補一覧では、適合スコアと5つの評価項目ごとの評価スコア内訳を表示する構成にした。
- 型候補一覧の描画中エラーを診断しやすくするため、描画エラー時に `typeCandidate:render-error` 診断を残してから例外を再送出するようにした。
- スマホ部隊編成で既存CSSの `.formation-selected-card:not(.is-dialog){display:none}` にスコアカードが巻き込まれていたため、`.formation-score-card` はスマホでも表示する上書きCSSを追加した。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- 型候補一覧表示は `hado_type_candidates.js`、スマホ部隊編成表示は `hado_styles.css`、再発防止は `tools/validate_update09_phase3_formation_ui.py` に統合した。HTMLへのロジック追加は行っていない。

## Phase 3.7 部隊編成スコア表示位置・軍馬操作・単位表記修正

### 変更概要
- スマホ部隊編成でスコアカードと結果サマリーが重ならないよう、スコアカードと結果サマリーを通常フロー上の別ブロックとして表示するCSSを追加した。
- 軍馬はプルダウンで `未設定` を選べるため、軍馬枠の削除ボタンを削除した。
- トータルスコア、評価スコア、適合スコアの表示から `点` / `件` の単位を外し、数値のみ表示するようにした。
- 型候補一覧では武将候補カードにトータルスコアを表示せず、適合スコアと評価項目別スコア内訳を表示する。
- 型候補一覧のロール別件数計算で一部ロールの描画に失敗しても、診断ログを残して該当ロールを空表示にする `safeRoleRows()` を追加した。

### HTMLサイズ
- `index.html`: 変更なし。
- `hado_library_3.0.0.0.html`: 変更なし。

### 外部化判断
- 表示ロジックは `hado_type_score.js` / `hado_type_candidates.js` / `hado_formation.js`、スマホ表示位置は `hado_styles.css`、再発防止は `tools/validate_update09_phase3_formation_ui.py` に統合した。HTMLへのロジック追加は行っていない。

## Phase 3.8 official JSON load fix

- Fixed a regression where the formation/type score rules were loaded by a later standalone fetch instead of the official JSON bundle.
- Added `hadou_type_score_rules.json` to the optional official JSON bundle in `hado_bootstrap.js` and publish it to `window.HADO_TYPE_SCORE_RULES` during `applyLoadedData()`.
- Kept the existing standalone fetch fallback for old caches or unusual local states, but normal HTTP preview startup now has the score rules available as part of the same official JSON loading path.
- Mirrored the same bundle definition in `hado_app.js` to keep the monolithic runtime artifact consistent with the split runtime files.
- HTML size change: none. The fix is external JavaScript only.

## Phase 3.9 mobile score/result layout fix

- Moved the result summary strip into the same right-side/mobile stack immediately after the total score panel, so mobile formation edit order is now warhorse panel -> score panel -> result summary.
- Changed the score panel markup to a `details` panel: desktop opens by default, while smartphone display starts collapsed and expands score breakdown rows when tapped.
- Added CSS for the expandable score panel summary/body and tap hint without changing HTML size.

## Phase 3.10 mobile panel order correction

- Corrected the smartphone formation edit stack order to match the requested flow: warhorse panel -> total score panel -> result summary panel.
- Kept the score panel expandable behavior from Phase 3.9.
- HTML size change: none. The change is external JavaScript/CSS contract and documentation only.

## Phase 3.11 mobile visible panel and advisor compactness fix

- Moved the smartphone-visible score/result pair into the board card immediately after the smartphone warhorse placement, so the visible order is warhorse -> total score -> result summary without relying on the hidden selected-stack card area.
- Kept the PC selected stack unchanged and hides the duplicate selected-stack result summary on smartphone.
- Compacted smartphone warhorse controls and advisor cells by reducing header, select, cell, and label heights.
- HTML size change: none. The change is external JavaScript and CSS only.


## Phase 3.12 formation evaluation-score regression fix

- Restored the 部隊編成 score panel evaluation score to aggregate the selected formation members' type-search feature rows instead of relying only on already-summarized formation parameter effects.
- The score panel now resolves each assigned武将/侍従/装備 against `hadou_type_search_feature_index.json`, applies the member role (`main_general`, `vice_general`, `support_general`, `attendant`), and sums the five selected type metrics' matched item counts.
- The type-candidate 適合スコア calculation in `hado_type_score.js` was not changed, because the reported regression was limited to the formation score panel.
- 可視バージョンを `3.0.0.0 Update09.3.12` / revision 45 へ更新した。
- HTML size change: none. The fix is external JavaScript plus validator/documentation updates only.


## Phase 3.13 score terminology alignment

- Corrected the 部隊編成 score terminology to match the requested definitions: each of the five metric rows is an 評価スコア, and トータルスコア is the sum of those five formation-level evaluation scores.
- Kept 型候補一覧の適合スコア semantics unchanged: 適合スコア is the target武将's sum of the five evaluation-score item counts.
- Removed the misleading top-level aggregate `評価スコア` display from the score-card header; the expandable rows are now the evaluation scores.
- 可視バージョンを `3.0.0.0 Update09.3.13` / revision 46 へ更新した。
- HTML size change: none. The fix is external JavaScript plus documentation/validator updates only.


## Phase 3.14 formation layout cleanup

- Removed the outer visual frame from the 部隊編成 panel and moved the `部隊編成` label into the internal tab row before `編成` / `戦法` / `変化率` / `詳細`.
- Removed the old explanatory note `※部隊編成の合算技能は配置・好相性・兵科などの条件を判定して反映します。` from the visible formation screen via the formation tab panel cleanup.
- Simplified the 軍馬 panel by removing the `軍馬` heading and `保存データの軍馬を最大3枠まで部隊へ反映` note.
- Changed the total score header to show `トータルスコア` and its value on the same line, removed the header-level `評価項目`, and made the evaluation-score rows compact no-scroll chips.
- Disabled horizontal scrolling in the score breakdown and result summary lists.
- 可視バージョンを `3.0.0.0 Update09.3.14` / revision 47 へ更新した。
- HTML size change: none. The fix is external JavaScript/CSS plus documentation/validator updates only.


## Phase 3.15 PC/mobile formation layout and score-row fallback fix

- Changed group controls to a two-row layout: row 1 shows `グループ` and `変更`, row 2 shows the group list select.
- On PC, moved `マイメモ` + memo text + `編集` to its own next row and kept them on one line.
- Tightened smartphone spacing between the 軍馬 list and the トータルスコア card.
- Kept score metadata (`型`, `合算技能`, `状態変化`) on one row on smartphone.
- Removed the fallback that displayed 主将/副将/補佐 slot labels as score rows when type score rules or member feature rows were unavailable; the score panel now only shows actual type evaluation metric rows.
- 可視バージョンを `3.0.0.0 Update09.3.15` / revision 48 へ更新した。
- HTML size change: none. The fix is external JavaScript/CSS plus documentation/validator updates only.


## Phase 3.17 smartphone formation member-score resolution fix

- Removed the `formationTypeScoreEntity()` scoring fallback from `calculateFormationAutoScores()` so the score card no longer records `roleId: formation` as the final type-score trace when member scoring is unavailable.
- Relaxed `getFormationTypeSearchFeatureItems()` to use `typeSearchFeatureIndex.items` whenever the items array exists, instead of requiring an `available` flag. This prevents official/preview derived JSON bundles with loaded items from being treated as empty.
- Added diagnostics for member feature resolution counts and misses, including collected formation item count, resolved member count, type-search feature item count, and sample misses.
- When member scoring is unavailable, the score card now shows the selected type's five metric rows as zero instead of falling back to pseudo-formation scoring.
- 可視バージョンを `3.0.0.0 Update09.3.17` / revision 50 へ更新した。
- HTML size change: none. The fix is external JavaScript plus documentation/validator updates only.

## 2026-06-17 Update09.3.17 type-search feature index validation

- Added `tools/validate_type_search_feature_index_data.py` as a focused recurrence guard for the formation score issue caused by an empty `hadou_type_search_feature_index.json`.
- Wired the guard into App Validation and the merge-queue workflow contract validator so an empty or unusable type-search feature index cannot pass CI.
- The validator checks only the directly relevant data contract: file existence, non-empty JSON, non-empty `items`, required source categories, and presence of `typeFeatures` / `statusEffectRefs` rows used by formation member score resolution.

## 2026-06-17 Update09.3.18 formation type-score render path

- Added a formation-specific type-score calculation path that is invoked while rendering the score card.
- The calculation prioritizes `formation.parameterCalculation` rows and `formation.effectSources`, uses `typeSearchPresets` / score rules for the 5 metrics, and uses `typeSearchFeatureIndex` only as auxiliary context/diagnostic input.
- If no type is selected, the renderer calculates all presets/rules and shows top candidate scores; if a type is selected, it shows that type's five evaluation rows and total score.
- The diagnostic `state.diagnostics.typeScore` now records `calculationInvoked`, source counts, candidate scores, rendered status, and `emptyReason` instead of staying `{}`.
- 可視バージョンを `3.0.0.0 Update09.3.18` / revision 51 へ更新した。

## 2026-06-17 Update09.3.19 PC formation score visibility

- Added a PC-width CSS override so the formation score card is visible in the right pane even when the device/browser matches `pointer: coarse`.
- The override keeps mobile-only score placement hidden on PC-width layouts, preserving the mobile `軍馬 → トータルスコア → 結果サマリー` flow only for mobile width.
- 可視バージョンを `3.0.0.0 Update09.3.19` / revision 52 へ更新した。

## Update09.3.20 formation score execution validation

- Added `tools/test_formation_type_score_render.js` as an executable post-fix proof for the formation render path.
- The test invokes `renderFormationScoreSummaryHtml()` rather than only unit-testing `HadoTypeScore.score()`, so it covers the same path that renders the 部隊編成 score panel and writes copy-debug-log diagnostics.
- Required evidence asserted by the test: `typeScore.calculationInvoked === true`, `presetCount === 16`, loaded `typeSearchFeatureIndex` item count is non-zero, parameter/effect counts are non-zero, at least one candidate has `totalScore > 0`, and at least one evaluation row has matched effect or parameter details.
- Wired the test into `.github/workflows/app-validation.yml` and `tools/validate_merge_queue_workflow.py`.

## Update09.3.21 vaccine metric alias correction

- Audited the current code against the reported final fix pattern and confirmed the old failure mode was still present: `METRIC_ALIASES` only had generic vaccine labels, so real parameter/effect labels such as `弱化効果無効`, `自身を含む味方`, `攻撃速度`, and `負傷兵を最大兵力` could miss all five vaccine metrics.
- Updated `hado_type_score.js` aliases for vaccine-related metrics instead of changing JSON loading, score-card CSS, or the formation render path.
- Updated `tools/test_formation_type_score_render.js` to score `selectedTypeId=vaccine` with real-style parameter/effect rows and assert non-zero matched evidence.
- Added direct `tools/test_type_score.js` coverage for vaccine alias matching so future work distinguishes “calculation not invoked” from “calculation invoked but aliases did not match.”

## Update09.3.22 expandable score row details

- Passed score-row `matchedEffects` / `matchedParameters` through `calculateFormationAutoScores()` into score summary rendering.
- Added clickable details markup for evaluation score chips so users can expand a row and see matched source labels/values.
- Added CSS for compact evidence rows and extended the formation render proof test to require the expandable detail markup.

## 2026-06-23 Update09.3.40 Phase 3 completion

- Phase 3 status: completed and accepted. The user confirmed the preview display is acceptable on 2026-06-23.
- Final Phase 3 visible version: `3.0.0.0 Update09.3.40` / revision `73`.
- Completed scope: formation layout cleanup, change dialog flow, group/name/memo display cleanup, type candidate/tag presentation, candidate tray flow, and formation evaluation-score tag detail behavior.
- Final score UI contract: the total score is the sum of the five visible evaluation scores, each evaluation score reflects the rendered tag count, and the detail area remains tag-only.
- Validation recorded for the final Phase 3 state: `python3 tools/run_app_validation.py` completed with `app validation self-check passed: 64 commands`; focused validators for Phase 3 UI, formation score tags, and version consistency also passed.
- Preview/user acceptance: public preview was checked by the user and accepted; no remaining Phase 3 defects are recorded.
- HTML size / externalization: this completion record is documentation-only; no HTML or runtime source was changed in this record.


## 2026-06-25 Update09.4.1 Phase 4 guide and flow wording start

- Phase 4 status: started after Phase 3 acceptance. The visible runtime version is `3.0.0.0 Update09.4.1` / revision `74`.
- Updated the active guided-tour definitions in `hado_core.js` instead of the legacy `hado_app.js` bundle, so the runtime copy follows the split-script architecture.
- Start guide wording now describes the main Phase 4 operation flow: 型検索/型編成ナビ → 型候補一覧 → 候補トレイ → 部隊編成.
- Search guide wording now distinguishes 全データ表示 and 保存データ表示 before users move candidates into the candidate tray.
- Formation guide wording now explains 部隊グループ, the グループリスト, and the 「変更」 button so users understand where group add/rename/delete operations are located.
- Added `tools/validate_update09_phase4_guides.py` and wired it into `tools/run_app_validation.py` to prevent future guide/version wording regressions.
- HTML size / externalization: only compact static guide text in `index.html` was changed; runtime guide behavior remains externalized in `hado_core.js`.


## 2026-06-26 Update09.4.2 type-candidate and tray next-step help

- Phase 4 status: in progress. The visible runtime version is `3.0.0.0 Update09.4.2` / revision `75`.
- Added a compact collapsible `次の操作` help block to the active 型候補一覧 modal in `hado_type_candidates.js`.
- The 型候補一覧 help now states whether the user is in 全データ表示 or 保存データ表示, explains the mode difference in one line, and lists the next steps: select a candidate, add it to 候補トレイ, then open 部隊編成.
- Updated the 候補トレイ modal in `hado_candidate_tray.js` so its always-visible guidance is a short action label instead of a longer explanatory paragraph.
- Updated active guided-tour wording in `hado_core.js` to point users to the 型候補一覧 `次の操作` help instead of expanding the tour text further.
- HTML size / externalization: no large inline JavaScript was added. The runtime behavior remains in external JavaScript; the HTML change is limited to the visible guide badge version.


## 2026-06-26 Update09.4.3 formation score visible-total scope hardening

- Phase 4 regression response: investigated the reported formation render error `displayTotalScore is not defined`.
- Root cause class: formation score rendering used a locally scoped total variable name directly in several UI/diagnostic template positions, while validation only checked for text snippets and did not forbid stale identifier drift.
- Implementation change: replaced the fragile `displayTotalScore` identifier with a dedicated `calculateFormationDisplayedTotalScore(rows)` helper and a local `visibleTotalScore` variable in `renderFormationScoreSummaryHtml()`.
- Similar regression countermeasure: added `tools/validate_formation_score_total_scope.py`, which forbids `displayTotalScore` in `hado_formation.js`, requires the helper and all visible-total uses, and confirms `hado_update_meta.js` does not override the score renderer.
- Validation integration: wired the new guard into `tools/run_app_validation.py` and updated existing formation score tests/validators to assert the new helper contract.
- HTML size / externalization: only the compact start-guide badge version changed in HTML. The runtime fix is externalized in `hado_formation.js`; no large inline JavaScript was added.


## 2026-06-26 Update09.4.4 formation next-step help

- Phase 4 status: in progress. The visible runtime version is `3.0.0.0 Update09.4.4` / revision `77`.
- Added `renderFormationNextStepHelpHtml()` to the active formation runtime so the formation screen has a compact collapsible `次の操作` guide.
- The guide explains the order: switch the グループリスト, use `変更` for group management, choose a formation and slot, place from 候補トレイ/search results, then check トータルスコア and save.
- Added compact styles for `.formation-next-step-help`, `.formation-next-step-body`, and `.formation-group-count` in the external CSS.
- Recurrence prevention: extended `tools/validate_update09_phase4_guides.py` to require the formation next-step guide and its CSS hooks in active split runtime files.
- HTML size / externalization: only the start-guide badge version changed in HTML. Runtime behavior remains externalized in `hado_formation.js` and styling in `hado_styles.css`.


## 2026-06-26 Update09.4.5 formation group control fix

- Phase 4 regression response: investigated the reported 部隊編成 group control issue where `変更` did not open the group dialog and the current group name was not visible enough.
- Root cause class: group controls can be rendered in more than one formation container, but event binding used single `document.getElementById()` lookups, so only one duplicate-ID instance received the click/change handlers.
- Implementation change: added `data-formation-group-manage` and `data-formation-group-select` hooks and bound all matching controls under `els.formationRoot`.
- UI change: removed the visible `グループリスト` label from the formation controls, added an explicit current group name chip, changed the selector label to `切替`, and kept the dialog label as `対象グループ`.
- Diagnostics: added `formationGroup:manage-click`, `formationGroup:dialog-open`, `formationGroup:dialog-close`, and `formationGroup:select-change` debug events.
- Recurrence prevention: extended Update09 Phase 3/4 validators to require the data-hook bindings, debug logs, and visible group-name CSS hook.
- HTML size / externalization: only the start-guide badge version changed in HTML. Runtime behavior remains in `hado_formation.js` and styling in `hado_styles.css`.


## 2026-06-26 Update09.4.6 formation group selector compact row

- Phase 4 UI cleanup: removed the visible `グループ` / `グループリスト` / `切替` labels from the normal formation group controls.
- Implementation change: `renderFormationGroupControlsHtml()` now renders only a wide group listbox and the `変更` button on the first row, with the existing collapsible `次の操作` help below it.
- Layout change: `.formation-group-controls` now uses `minmax(0,1fr) auto` so the listbox gets maximum width and the button keeps its compact fixed width.
- Recurrence prevention: updated Phase 3/4 validators to require `.formation-group-select` and forbid the removed label/current-name/count layout snippets in active formation controls.
- HTML size / externalization: only the start-guide badge version changed in HTML. Runtime behavior remains in `hado_formation.js` and styling in `hado_styles.css`.


## 2026-06-26 Update09.4.7 stale update-meta group override removal

- Root cause: `hado_update_meta.js` still had an Update09.3 compatibility override for `renderFormationGroupControlsHtml()`, so it replaced the corrected active `hado_formation.js` markup after load.
- Implementation change: removed the stale group-controls override and its `.formation-group-list-row` injected CSS from `hado_update_meta.js`; the active `hado_formation.js` one-line listbox + `変更` button now owns the runtime DOM.
- Recurrence prevention: extended Phase 3/4 validators to fail if `hado_update_meta.js` reintroduces `renderFormationGroupControlsHtml=function`, `formation-group-list-row`, `formation-group-title`, or `formation-group-select-label`.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.7` / revision `80`.
- HTML size / externalization: only the start-guide badge version changed in HTML. Runtime behavior remains in external JavaScript.


## 2026-06-26 Update09.4.8 remove unrequested formation group help

- Root cause: Phase 4 guidance work added a collapsible `次の操作` block directly below the formation group selector, but this was not requested for the simple group-selection control and made the left panel noisier than necessary.
- Implementation change: removed `renderFormationNextStepHelpHtml()` and removed the call from `renderFormationGroupControlsHtml()`, so the group area renders only the wide listbox and `変更` button.
- Styling change: removed `.formation-next-step-help` and `.formation-next-step-body` CSS from the formation layout block.
- Recurrence prevention: updated Phase 3/4 validators to forbid formation next-step helper markup/styles in the group-control area while keeping next-step guidance in type candidates / candidate tray.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.8` / revision `81`.
- HTML size / externalization: only the start-guide badge version changed in HTML. Runtime behavior remains in external JavaScript and CSS.


## 2026-06-26 Update09.4.9 PC formation list panel scrollbar

- Root cause: earlier PC fixed-panel rules used `overflow:hidden!important` on `.formation-list-panel`, so the group/formation selection panel itself did not expose a vertical scrollbar even when the fixed panel content exceeded the viewport.
- Implementation change: added a later PC-only CSS override for `.formation-list-panel` and its `.formation-list` child with `overflow-y:auto!important`, `overflow-x:hidden!important`, and `scrollbar-gutter:stable`.
- Recurrence prevention: Phase 3/4 validators now require the `Update09.4.9-PC-FORMATION-LIST-SCROLL` CSS marker and `scrollbar-gutter:stable`.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.9` / revision `82`.
- HTML size / externalization: only the start-guide badge version changed in HTML. Runtime behavior remains in external CSS.


## 2026-06-26 Update09.4.10 PC formation list scroll area constraint

- Root cause: Update09.4.9 made the entire fixed `.formation-list-panel` scrollable, which could leave the panel scrolled mid-way and hide the group selector/header at the top.
- Implementation change: changed the PC override so `.formation-list-panel` keeps `overflow:hidden!important` while only the `.formation-list` child scrolls vertically with `overflow-y:auto!important` and `scrollbar-gutter:stable`.
- Recurrence prevention: Phase 3/4 validators now require the `Update09.4.11-PC-FORMATION-LIST-SCROLL` marker, fixed panel overflow, and scrollable list-area snippets.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.10` / revision `83`.
- HTML size / externalization: only the start-guide badge version changed in HTML. Runtime behavior remains in external CSS.


## 2026-06-26 Update09.4.11 PC formation panel scroll reset

- Root cause: after the panel had once been scrollable, the fixed `.formation-list-panel` could retain a non-zero `scrollTop`, leaving the header/group selector area clipped even after moving scrolling to the list child.
- Implementation change: after rendering the formation screen, reset `.formation-list-panel.scrollTop` to `0` so the panel always opens at the header/group selector/actions area while the `.formation-list` child owns list scrolling.
- Recurrence prevention: Phase 3/4 validators now require the `formationListPanel.scrollTop=0` render guard in active formation runtime.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.11` / revision `84`.
- HTML size / externalization: only the start-guide badge version changed in HTML. Runtime behavior remains in external JavaScript/CSS.


## 2026-06-27 Update09.4.12 delayed PC formation panel scroll reset

- Root cause: a single immediate `scrollTop=0` reset could run before browser/layout scroll restoration or later rendering work, allowing the fixed PC left panel to remain offset and hide the header/group controls.
- Implementation change: added `resetFormationListPanelScroll()` and call it immediately, on `requestAnimationFrame`, and after a short timeout so the panel body is forced back to the top after layout settles.
- Recurrence prevention: Phase 3/4 validators now require the reset helper plus immediate, RAF, and timeout reset calls.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.12` / revision `85`.
- HTML size / externalization: only the start-guide badge version changed in HTML. Runtime behavior remains in external JavaScript/CSS.


## 2026-06-27 Update09.4.13 PC formation panel shell non-scrollable fix

- Root cause: the fixed PC left panel itself was still a scrollable ancestor, so browser focus/scroll restoration could reapply a non-zero panel scroll after the earlier reset and clip the header/group/actions area.
- Implementation change: changed the PC `.formation-list-panel` shell to `overflow:clip` with contained overscroll, kept only `.formation-list` scrollable, and strengthened the reset helper with `scrollTo()` plus 80/250/600ms delayed resets.
- Recurrence prevention: Phase 3/4 validators now require the non-scrollable panel shell, `scrollTo`, and the expanded reset sequence.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.13` / revision `86`.
- HTML size / externalization: only the start-guide badge version changed in HTML. Runtime behavior remains in external JavaScript/CSS.


## 2026-06-27 Update09.4.14 PC formation asset cache-bust

- Root cause: the preview could show the new visible version while the browser or Pages cache still served older `hado_styles.css` / `hado_formation.js`, so the PC left panel fix was not guaranteed to execute even after version metadata changed.
- Implementation change: added `?v=09.4.14` cache-bust query strings to the active `hado_styles.css` and `hado_formation.js` references in `index.html`.
- Recurrence prevention: Phase 4 validation now requires the cache-busted CSS/formation-runtime references for this fix.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.14` / revision `87`.
- HTML size / externalization: only asset URLs and the guide badge changed in HTML. Runtime behavior remains in external JavaScript/CSS.


## 2026-06-27 Update09.4.15 PC formation fixed-header offset clamp

- Root cause: `updateMobileStickyHeaderOffsets()` runs for PC as well as mobile, and if header/tab height is measured as 0 during early layout it can set `--mobile-fixed-stack-space` to about 10px. That overrides the CSS fallback 118px and lets the fixed PC formation panel start behind the top header, clipping 部隊一覧/group/actions.
- Implementation change: clamp the computed stack space to at least 118px, keep raw measured values in `mobileStickyHeader:offset` debug logs, and keep cache-busted CSS/formation JS references at `?v=09.4.15`.
- Recurrence prevention: Phase 4 validation now requires the stack-space clamp and raw offset diagnostics.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.15` / revision `88`.
- HTML size / externalization: only asset query strings and guide badge changed in HTML. Runtime behavior remains in external JavaScript/CSS.


## 2026-06-27 Update09.4.16 PC formation list fixed head

- Root cause: repeated offset/scroll resets still left the header/group/actions dependent on the same panel scroll state as the card list. If the shell retained any offset, those controls could be clipped.
- Implementation change: separated the left-panel header, group selector, and action buttons into `.formation-list-fixed-head` and made it sticky at the top; only `.formation-list` remains the scrollable card list.
- Recurrence prevention: Phase 3/4 validators now require the fixed-head wrapper and sticky CSS marker.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.16` / revision `89`.
- HTML size / externalization: only asset query strings and guide badge changed in HTML. Runtime behavior remains in external JavaScript/CSS.

## 2026-06-27 Update09.4.17 PC formation panel measured tab offset

- Root cause correction: the previous fix still depended on a fixed fallback offset and did not use the actual bottom position of the fixed top tab bar (`検索 / 部隊編成 / 軍馬`). When the tab bar occupied more vertical space than the fallback, the left formation panel could start underneath it and hide the group/header controls.
- Implementation change: `hado_formation.js` now measures `#appTitlePanel` and `#mainTabPanel` with `getBoundingClientRect().bottom`, writes `--formation-left-panel-top`, and applies the measured top/height directly to `.formation-list-panel`. The list child is forced to `overflow-y: scroll` so the scrollbar remains visible when the card list overflows.
- Recurrence prevention: Phase 4 validators now require the measured-offset helper, viewport sync debug log, and CSS marker.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.17` / revision `90`.
- HTML size / externalization: only asset query strings and guide badge changed in HTML. Runtime behavior remains in external JavaScript/CSS.

## 2026-06-27 Update09.4.18 PC formation action buttons compact row

- Implementation change: changed the PC left-panel formation action label from `新規作成` to `新規` and forced `新規 / 複製 / 削除 / 保存` into a single four-column row.
- Recurrence prevention: Phase 4 validation now requires the compact one-row action CSS marker.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.18` / revision `91`.
- HTML size / externalization: only asset query strings and guide badge changed in HTML. Runtime behavior remains in external JavaScript/CSS.
