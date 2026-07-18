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

## 2026-06-27 Update09.4.19 mobile total score placement

- Root cause: mobile board rendering received only the result summary HTML, so the score card remained in the desktop selected stack path and did not appear between the mobile warhorse block and result summary.
- Implementation change: pass `${scoreCardHtml}${quickSummaryHtml}` to the mobile board placement, and hide the duplicate selected-stack score card only on mobile.
- Recurrence prevention: Phase 3/4 validators and the formation render test now require the mobile board to receive the score card before the result summary.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.19` / revision `92`.
- HTML size / externalization: only asset query strings and guide badge changed in HTML. Runtime behavior remains in external JavaScript/CSS.

## 2026-06-27 Update09.4.20 formation responsive layout regression guard

- Root cause / process weakness: PC left-panel clipping and smartphone score placement regressed repeatedly because the acceptance contract was split across several narrow checks; a future edit could satisfy one validator while breaking the combined PC/mobile layout requirement.
- Implementation change: added `tools/validate_formation_responsive_layout_contract.py` to validate the consolidated responsive contract: measured PC left-panel offset, fixed group/action header, one-row action buttons, scrollable formation list, and smartphone score-card placement between the warhorse block and result summary.
- Recurrence prevention: wired the new validator into `tools/run_app_validation.py` so the full validation run fails if any of the converged PC/mobile formation contracts drift.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.20` / revision `93`.
- HTML size / externalization: only asset query strings and guide badge changed in HTML. The new countermeasure is an external Python validator; runtime behavior remains in external JavaScript/CSS.


## 2026-06-27 Update09.4.21 Phase 4 guide frame finalization

- Root cause: formation guide step 2/8 targeted the whole fixed left panel, so the spotlight covered the scrollable list instead of the group/action header. Step 5/8 targeted `.formation-selected-editor-main`, which is not present in the current PC formation layout unless a mobile dialog path is open, causing fallback/incorrect spotlight placement.
- Implementation change: retargeted step 2/8 to `.formation-list-fixed-head` and step 5/8 to the visible formation board, without changing formation runtime behavior or layout.
- Recurrence prevention: Phase 4 validation now requires the corrected 2/8 and 5/8 selectors and forbids the obsolete whole-panel/missing-editor selectors.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.21` / revision `94`.
- Phase status: Phase 4 is complete after this guide-frame correction.
- HTML size / externalization: only asset query strings and guide badge changed in HTML. Runtime behavior remains in external JavaScript/CSS.

## 2026-06-27 Update09.5.1 Phase 5 type search/candidate/tray flow

- Phase 5 status: started after Phase 4 completion (`Update09.4.21` / revision `94`). The visible runtime version is now `3.0.0.0 Update09.5.1` / revision `95`.
- Speed instrumentation: `hado_search.js` now logs type-search candidate row construction, importance aggregation, condition chip rendering, result select rendering, results DOM rendering, diagnostic snapshot, responsive snapshot, renderDetail execution flag/time, cache lookup/store/invalidation reason, `measuredKnownMs`, `unmeasuredMs`, and `unmeasuredMsWarning`. Warning policy is `totalMs > 200` or `unmeasuredMs > 50`.
- Speed implementation: `hado_type_candidates.js` no longer calls `safeRoleRows(id).length` for every role during tab rendering. The active role is calculated first; unopened role counts display `…` until that role is opened or an idle callback fills the count.
- Flow implementation: the type entry primary confirmation action changed from `選択を保存` to `型候補一覧へ`; after saving localStorage and dispatching `hado:type-search-entry-selected`, the dialog closes and opens the type candidate list through `window.HadoTypeCandidates.open({source:'type-entry-save'})` or `hado:type-candidates-open-request` fallback.
- Candidate tray implementation: type candidates now include the ordered actions `候補トレイへ` / `この型で新規部隊` / `閉じる`, require an explicit selected card, dispatch `hado:formation-candidate-tray-add`, close the candidate list, and open the candidate tray.
- Formation persistence: `hado_formation.js` listens for candidate tray add/snapshot/remove/clear/place events, writes to the current formation `candidateTray`, deduplicates by `roleId + normalized name + typeId`, saves with `candidate-tray-add`, and refreshes tray snapshots. Placement uses the existing formation add popover for supported 武将/装備 candidates and does not bypass formation validity checks; unsupported roles remain saved-only.
- Recurrence prevention: added `tools/validate_update09_phase5_type_candidate_flow.py` and wired it into `tools/run_app_validation.py` to guard the button wording, dialog handoff, lazy role counts, tray add dispatch/open APIs, formation persistence, and candidateTray compatibility.
- HTML size change: no `index.html` logic was added; behavior remains externalized in JavaScript.
- Validation status: local validation commands are recorded in the report. Preview synchronization is not complete in this workspace because no `origin` remote is configured and the branch cannot be pushed from here.
- Remaining issues: real preview repository/Pages verification must be performed after pushing the committed branch in an environment with the application and preview remotes configured.

## 2026-06-27 Update09.5.2 formation score type selector

- Phase 5 follow-up: visible runtime version advanced to `3.0.0.0 Update09.5.2` / revision `96`.
- Added a `型` select box to the left side of the total score panel in `renderFormationScoreSummaryHtml` using the existing formation type-score rule sources (`getFormationTypeScoreCandidateRules`).
- Added `setFormationEvaluationType(typeId)` so changing the select updates the current formation `evaluationTypeId` / `evaluationTypeName`, recalculates scores immediately with `buildFormationParameterData(f)` and `calculateFormationAutoScores(f, data)`, saves with `setFormationEvaluationType`, rerenders, and shows `型を変更しました`.
- Added responsive CSS for `.formation-score-type-select-wrap` and `.formation-score-type-select`; no inline HTML logic was added.
- Regression coverage: `tools/test_formation_type_score_render.js` now asserts the select renders, options include the active type and unset state, the forbidden old `formationEvaluationTypeInput`/`評価型ID` UI is absent, and `setFormationEvaluationType` persists and recalculates immediately.
- Remaining issues: preview verification remains blocked in this workspace until remote fetch/push access is available.

## 2026-06-27 Update09.5.3 formation type selector binding fix

- Phase 5 correction: visible runtime version advanced to `3.0.0.0 Update09.5.3` / revision `97`.
- Root cause: the same score-card HTML is rendered in both the mobile board placement and the PC selected stack, so binding only `document.getElementById('formationEvaluationTypeSelect')` could attach the change handler to just one duplicated select. A user could change the unbound visible select and see no immediate recalculation.
- Fix: mark the select with `data-formation-evaluation-type-select="1"` and bind all matching score-panel type selects through `els.formationRoot.querySelectorAll(...)` in `setupFormationEvents`.
- Regression coverage: `tools/test_formation_type_score_render.js` now requires the data marker and the all-select binding source contract.


### Update09.5.4 — 評価スコア根拠タグの発生元表示復旧
- 部隊編成の評価スコア詳細で、`状態変化 与ダメージ(発生元)` のように根拠タグ名の直後へ発生元を括弧付き表示する経路を復旧した。
- `scoreDetails` / `evidenceRows` と `matchedEffects` / `matchedParameters` の双方で `sourceTag` を保持し、表示専用の `formationScoreEvidenceDisplayTitle()` でラベルと発生元を合成する。
- 回帰防止として `tools/test_formation_type_score_render.js` と `tools/validate_formation_score_tag_only.py` を更新し、括弧付き発生元表示と既存の「点」「内訳合計」「評価型ID」禁止を同時に検証する。
- HTML大型ロジック追加なし。修正は外部 JavaScript と検証スクリプト、バージョン記録のみ。


### Update09.5.5 — 評価スコア根拠タグの集約テキスト露出防止
- `sourceLabels` 集約テキストと未定義 `sr-only` 依存を削除し、評価スコア詳細に表示される根拠はタグ内の `ラベル(発生元)` のみに限定した。
- 回帰防止として、HTML に `class="sr-only"` や `/` 区切りの根拠集約ダンプが出ないことを `tools/test_formation_type_score_render.js` で検証する。
- `tools/validate_formation_score_tag_only.py` に `const sourceLabels=` と未定義 `sr-only` 依存の禁止を追加し、同種の「隠したつもりの補助テキスト露出」を静的に止める。


### Update09.5.6 — 評価スコア内訳の欄外表示防止
- 評価スコア内訳の通常表示を `is-collapsed` の1行表示にし、根拠タグがスコアカード外へ回り込まないようにした。
- `さらに表示` 押下時は `is-expanded` に切り替え、結果サマリーと同系統の `formation-quick-summary-chip` スタイルを使うグリッド表示へ変更した。
- 回帰防止として、collapsed/expanded のクラス、結果サマリー風 chip 共有、CSS の overflow/grid 制御を test / validator に追加した。


### Update09.5.7 — 評価スコア内訳の全件ダイアログ化
- `さらに表示` 押下時の inline 展開をやめ、結果サマリーと同じ `formation-mobile-dialog-overlay` 系の別ダイアログで根拠を全件表示するようにした。
- 通常の評価スコア内訳は1行 collapsed のまま維持し、ダイアログ内だけ `formation-quick-summary-chip` を使った結果サマリー風の一覧を表示する。
- 回帰防止として、dialog open state、dialog list、全件 chip 数、close/backdrop イベントを test / validator の対象に追加した。


### Update09.5.8 implementation — 評価スコア詳細切替の全 score card 同期
- `handleFormationScoreDetailClick()` を部分 DOM 置換から state 更新 + `renderFormationScreen()` に変更し、duplicated score card の表示差分をなくした。
- `setupFormationEvents()` は `querySelectorAll('.formation-score-card')` で全 score card に delegated click/key handler を設定する。
- `tools/test_formation_type_score_render.js` と `tools/validate_formation_score_tag_only.py` で全 score card binding と再描画契約を必須化した。


### Update09.5.9 implementation — 評価スコア targetScope 判定の根本見直し
- `hado_type_score.js` に `targetScope` / `effectKind` / `includeAliases` / `excludeAliases` / `requiresTarget` / `displayBucket` を持つ `METRIC_MATCH_SPECS` を追加し、単純 alias 一致から対象判定付きの評価へ変更した。
- `ally_non_damage_effect` は火力・速度・ゲージ・機動・射程・連鎖・通常攻撃対象数を `excludeAliases` で除外し、知力上昇だけは targetScope に関係なく非ダメージ評価へ含める。
- `self_disadvantage_countermeasure` は自部隊または自身を含む味方を対象に、弱化対策・状態変化対策・被火力対策・生存対策・バフ維持の下位 `displayBucket` で分類する。
- `ally_wounded_recovery` は味方対象を必須とし、自部隊のみ・自身のみ・対象不明の回復を除外する。
- `dedupeBreakdownRows()` で同一根拠行の二重加点を禁止し、`weakening_nullify` は `self_disadvantage_countermeasure` への統合候補として低優先度にした。
- 評価スコア内訳は `targetScopeLabel` / `effectKindLabel` / `displayBucket` / 根拠テキストを保持して表示できるようにした。
- `tools/test_update09_phase5_score_target_scope.js` と `tools/validate_update09_phase5_score_target_scope.py` を追加し、`run_app_validation.py` に組み込んだ。

### Update09.5.10 実装 — 評価スコア旧ランタイムパッチ撤去

- `hado_update_meta.js` に残っていた Update09.3.x 系のランタイム hotfix（`calculateFormationAutoScores` の上書き、ワクチン型の旧キーワード一致、描画関数の差し替え、CSS 注入）を撤去し、同ファイルを可視バージョン同期だけに限定した。
- 部隊一覧のスコア表示は空データで `calculateFormationAutoScores(f,{})` を呼ばず、保存済み `totalScore` / `evaluationScore` を表示するソース実装へ変更した。これにより、一覧描画が評価スコア診断を空入力で上書きする副作用を防ぐ。
- 編成バーのメモ欄レイアウトはランタイム CSS 注入ではなく `hado_formation.js` と `hado_styles.css` の通常ソースに移管した。
- `validate_update09_phase5_score_target_scope.py` と `test_formation_type_score_render.js` に、`hado_update_meta.js` からスコア計算・描画差し替え・旧ワクチンキーワード一致を再導入できない検証を追加した。
- 可視バージョンを `3.0.0.0 Update09.5.10` / revision `104` へ更新した。

### Update09.5.11 実装 — 可視バージョン参照の再集中

- `index.html` から `Update09.5.x` の初期表示文字列と `?v=09.5.x` asset query を撤去し、可視バージョン表示は `hado_version.js` → `hado_update_meta.js` の同期に一本化した。
- `hado_type_score.js` の trace `algorithmVersion` は固定文字列ではなく `window.HADO_VERSION` / `window.HADO_APP_DISPLAY_VERSION` から動的に組み立てるようにした。
- `validate_update09_phase4_guides.py` は現行 Update 番号を固定列挙せず `hado_version.js` から `updateNo` / `revision` を読み、`index.html` に Update09.5.x の固定文字列や version query が戻った場合に失敗するようにした。
- 可視バージョンを `3.0.0.0 Update09.5.11` / revision `105` へ更新した。

### Update09.5.12 実装 — 評価スコア内訳の「さらに表示」撤去

- 評価スコア内訳パネルから「さらに表示」ボタンを撤去し、内訳パネル自体をクリック / Enter / Space で詳細ダイアログを開く操作へ変更した。
- `〇〇の内訳` ヘッダー右側には `クリックで詳細表示` を表示し、既存の詳細ダイアログをそのまま再利用する。
- 折りたたみ内訳のタグは `displayBucket` / label ベースの簡略名だけを表示し、同じ簡略名は重複表示しない。
- 詳細ダイアログ側は従来通り、根拠元を含む詳細チップ表示を維持した。
- 可視バージョンを `3.0.0.0 Update09.5.12` / revision `106` へ更新した。
### Update09.5.13 実装 — 評価スコア詳細ダイアログのタグ全文表示

- 評価スコア詳細ダイアログ内の根拠タグは、ellipsis で省略せず複数行で全文を表示する CSS override を追加した。
- 通常の内訳パネルは簡略・重複排除表示のまま維持し、詳細ダイアログだけ全文表示にした。
- 可視バージョンを `3.0.0.0 Update09.5.13` / revision `107` へ更新した。
### Update09.5.14 実装 — 評価スコアカテゴリゲート監査

- 評価スコア根拠判定を、targetScope だけでなく effectKind / displayBucket / category deny を組み合わせる category gate へ整理した。
- 自部隊不利対策は、弱化対策・状態変化対策・制御対策だけを許可し、防御、被ダメージ軽減、兵力/負傷兵回復、火力、速度、ゲージ、連鎖率、射程、機動を除外する。
- 同一根拠の代表キーを source / rawText / effectKind / targetScope ベースへ変更し、同一技能・同一効果が派生タグや親子カテゴリで二重加点されないようにした。
- 類似カテゴリ監査として、被火力対策・生存対策・火力支援・敵部隊妨害・戦法支援・連鎖支援へ別カテゴリ根拠が混入しない Node 回帰ケースを追加した。
- 可視バージョンを `3.0.0.0 Update09.5.14` / revision `108` へ更新した。

### Update09.5.15 実装 — 評価スコア一次効果/派生値分離
- `hado_type_score.js` に score evidence origin 判定を追加し、一次効果ではない `型要素`、検索/関連リンク由来の派生タグ、`部隊の知力(変化率集計)` などの集計値を評価スコア根拠から除外した。
- `scoreEligibleEvidence()` で `aggregate` / `derived` / `primary` を明示し、対象依存カテゴリは targetScope が自部隊/味方/敵として成立しない場合に加点しない。例外的な対象不明加点は追加していない。
- `ally_non_damage_effect` は、一次効果かつ自部隊/味方対象の有益効果だけを対象にし、火力支援・耐久支援・生存支援・不利対策・戦法支援・連鎖支援へ displayBucket を分ける。派生タグ・変化率集計・対象不明・敵対象・ダメージ/妨害は除外する。
- `self_disadvantage_countermeasure` のカテゴリゲートは維持し、防御・被ダメージ軽減・兵力/負傷兵回復・攻撃/会心/戦法ゲージ/連鎖率など通常の耐久/生存/火力支援は不利対策へ横流ししない。
- `tools/test_update09_phase5_score_target_scope.js` と `tools/validate_update09_phase5_score_target_scope.py` に、型要素・変化率集計・対象不明状態変化の除外、一次効果の味方非ダメージ分類、同一根拠の重複排除の検証を追加した。
- 可視バージョンを `3.0.0.0 Update09.5.15` / revision `109` へ更新した。runtime visible version remains centralized in `hado_version.js` only.
## 2026-07-11 JSONインデックス契約修正（表示バージョン据え置き）

### 不具合分類・根本原因

- 分類: 派生JSONの正規化契約不足、参照整合性不良、型評価根拠の混入。
- 生成処理が表示名と平坦化した全文を識別子・検索語・根拠本文として兼用し、発生元のentity/part/pathを保持していなかった。
- 状態変化に見える疑似語、一般技能以外の技能名、戦法本文parameter、記事本文、補佐/侍従の戦法が、表示名結合と推測だけで関連・検索・型評価へ流入していた。

### 恒久対策と実装

- クローラー側に単一のJSON index contract層と再生成CLIを追加し、入力JSONから20個の派生JSONを一括生成する。アプリ側で生成JSONを手修正しない。
- `sourceEntityKey`、`sourcePartType`、`evidencePath`、`canonicalFeatureKey`、`featureDomain`、`roleGate` を型feature/roleの必須契約とした。parameterには `parameterKey` / `parameterFeatureKey`、疑似状態にはmechanic/qualifier、戦法攻撃には明示boolean、対象関係にはgameType/actorPolarityを持たせた。
- 技能所有者は一般技能マスタだけを所有者正本にし、関連リンクは解決可能なcanonical参照だけを出力する。状態変化group/status IDは同じマスタを正本にする。
- 戦法本文は `tactic_text`、技能本文は `skill_text`、装備技能は `equipment_skill_text`、状態変化マスタは `status_master` とする。`article_text` と `parameter_summary` は検索・診断用途に限定する。
- 主将・副将1・副将2だけが戦法根拠を加点できる。補佐・侍従の戦法は候補説明には残せるが、`roleGate` と実配置slotの両方で加点を拒否する。
- アプリ消費側は `hado_type_score.js`、`hado_type_score_evidence.js`、`hado_formation.js`、`hado_type_candidates.js`、`hado_search.js`、`hado_bootstrap.js` を契約対応した。長文かどうかではなく、一次ソース契約の完全性で評価可否を決める。
- `notify-preview.yml` はpreview側workflowを編集せず、Pages失敗を成功扱いせず、commit付きcache-bust URLで公開markerを検証するよう修正した。

### 再生成対象

`hadou_effect_condition_blocks.json`、`hadou_equipment_skill_stage_index.json`、`hadou_formation_candidate_index.json`、`hadou_parameter_summary_index.json`、`hadou_related_link_index.json`、`hadou_result_card_index.json`、`hadou_search_index.json`、`hadou_skill_owner_index.json`、`hadou_status_effect_group_owner_index.json`、`hadou_status_effect_meta_index.json`、`hadou_status_effect_relations.json`、`hadou_tactic_attack_index.json`、`hadou_tag_index.json`、`hadou_type_purpose_rules.json`、`hadou_type_score_rules.json`、`hadou_type_search_feature_index.json`、`hadou_type_search_presets.json`、`hadou_type_search_regression_cases.json`、`hadou_type_search_role_index.json`、`hadou_type_search_role_rules.json`。

### 再発防止

- `tools/test_json_index_contract.js` で20ファイルのJSON構文、11,925関連参照、16,403 parameter効果、5,436 feature根拠、2,228 role行、全 `matchedText` の指定 `evidencePath` 内実在を検査する。
- 起動時release assertionへ計画書の8ケース（疑似状態、戦法source part、role gate、技能所有者、関連参照、状態group、戦法攻撃、parameter断片）を追加した。
- 旧形式の長文派生根拠は除外し、完全な一次根拠契約を持つ長文は文字数だけで除外しない回帰テストを追加した。

### HTML・バージョン

- `index.html` は未変更、サイズ差は0 bytes。新規ロジックは既存の外部JS責務へ統合した。
- `hado_version.js` を `3.0.0.0 Update09.5.42 r132` へ更新し、`HADO_DEV_INFO.json` の更新日時を同期した。可視版の変更理由は今回のJSON契約修正をpreview上で識別するため。

### 検証

- `node tools/test_json_index_contract.js`: pass（20生成ファイル、8必須ケース、全一次根拠包含）。
- `python tools/run_app_validation.py`: 101/101 pass（文書反映後の最終通し実行）。
- preview workflow validatorとno-preview-workflow-edit回帰: pass。
- ローカルHTTP: `index.html`、参照14資産、ルート34 JSONがHTTP 200かつJSON構文有効。表示版 `3.0.0.0 Update09.5.42 r132` を確認する。

### Update09.5.43 — JSON未読込時の空検索防止

- 診断ログでは検索語 `関羽` は正しく受け取られていたが、`generals.total=0` かつ画面上部が `JSON未読込` だった。検索照合ではなく、初回ガイドがデータ選択画面を一時的に隠している間も背面の検索欄を操作でき、空のマスターを通常検索して0件と表示したことが原因。
- `hado_search.js` は武将・装備マスターがともに空の場合、通常検索を実行せず「JSON未読込：検索できません」と表示し、JSON選択画面を再表示する。これによりすべての検索語・カテゴリで同じ誤認を防止する。
- `tools/test_update09_5_43_search_requires_json.js` を追加し、`tools/run_app_validation.py` の常設検証へ組み込んだ。
- HTMLは変更せず、既存の外部JavaScriptへ責務を追加したためHTMLサイズ差は0 byte。

### Update09.5.44 — 公開JSON読込のピークメモリ抑制

- 公開Previewを実ブラウザ操作したところ、29/29・100%取得後も `JSON未読込` のまま停止した。全JSONを `Promise.all` で同時取得・parseし、生文字列とparse後オブジェクトを一括保持していたことが原因。
- `loadExternalJsonBundleViaHttp()` を最大3ファイルのワーカーキューへ変更し、各JSONを順次 `out` へ格納して生文字列を解放する。各ファイル後に描画機会も返す。
- HTMLサイズ差は0 byte。既存外部JavaScriptのみ変更。

### Update09.5.45 — 公開bootstrapのキャッシュ更新

- Pages更新後も固定URLの旧 `hado_bootstrap.js` がブラウザキャッシュから再利用され、09.5.44の読込修正が実行されない経路を確認した。
- `index.html` のbootstrap参照へ版識別クエリを付与し、デプロイ後に必ず新ランタイムを取得させる。
- HTMLサイズは版クエリ分のみ増加。JavaScript本体は引き続き外部化する。
- in-app browserは実行環境が `C:\Users\mytem\AppData` の参照を拒否して起動不能だったため、PC/スマホの実操作は未確認として残す。
- GitHub Actions、実preview repository、公開PagesはPR/merge後に確認し、未確認の間はpreview未完了とする。

### Update09.5.48 — Preview Pages監視経路の統一（表示バージョン据え置き）

- `notify-preview.yml` が廃止対象の `jekyll-gh-pages.yml` を監視していたため、実際に公開を担当する `deploy-preview.yml` を監視対象とする。
- Preview側は `deploy-preview.yml` だけが `actions/deploy-pages` を実行し、重複していたJekyll Pagesワークフロー2本を削除する。
- Preview成果物に `PREVIEW_SOURCE_COMMIT.txt`、`PREVIEW_SOURCE_BRANCH.txt`、`PREVIEW_DISPLAY_VERSION.txt` を生成し、表示版は単一正本 `hado_version.js` から解決してアプリ側の公開marker検証と一致させる。
- 再発防止として、Previewデプロイ開始時にPagesデプロイworkflowが `deploy-preview.yml` の1本だけであることを検証する。
- `index.html` とruntimeは未変更、HTMLサイズ差は0 byte。公開アプリの表示内容を変更しない運用修正のため、`Update09.5.48 r138` は据え置く。

### Update09.5.49 — 武将検索の表出典保持

- `hadou_generals.json` の表は `{index, rows}` 形式だが、runtime正規化で配列へ変換した際に `index` が失われ、五行適正の他武将一覧（table 20/21）を検索対象から除外できていなかった。
- 正規化した表へ非列挙の `_sourceIndex` を保持し、再正規化後も出典indexを維持する。raw検索用コピーはJSON化する前に除外判定する。
- LR夏侯淵・盾兵の実JSONを二重正規化して検索文を生成し、元データには `関羽` がある一方、runtime検索文には含まれないことを検証するNodeテストへ変更した。
- 専用テストを `tools/run_app_validation.py` の常設検証へ追加した。文字列の存在確認だけで合格していた旧テストは廃止した。
- `hado_status_effects.js` の公開キャッシュ識別子を `09.5.49-r139` とし、可視版を `Update09.5.49 r139` へ更新した。
- HTMLへのロジック追加はなく、既存外部JavaScriptへ実装した。`index.html` の差はcache-bust queryの+15 bytesのみ。

### Update09.5.50 — 表示版と検索runtimeの同時キャッシュ更新

- 公開Previewの実検索ではLR夏侯淵除外が成功した一方、`hado_version.js` だけが旧キャッシュから読み込まれ、画面見出しが `Update09.5.48 r138` のまま残る不整合を確認した。
- `hado_version.js` と `hado_status_effects.js` の両方に同一の `09.5.50-r140` cache keyを付け、表示版と検索修正が同じデプロイ単位で取得されるようにする。
- 回帰テストは `hado_version.js` のupdate/revisionから期待cache keyを生成し、両runtime参照が一致することを検証する。
- 可視版を `Update09.5.50 r140` へ更新した。HTMLへのロジック追加はなく、`index.html` はversion cache keyの+15 bytesのみ。

### Update09.5.51 — 全他武将一覧の検索除外

- 追加監査で、五行表以外に `相性の良いLR/UR/SSR/SR/N・R武将` 子セクションと、技能説明内の `○○を持つ武将` 行が検索対象へ残っていることを確認した。
- 武将本人の説明・戦法・技能効果・列伝は維持し、相性一覧セクション、技能所有者一覧行、装備強化対象一覧行だけを共通サニタイズする。
- LR夏侯淵の五行表fixtureに加え、UR花鬘の `兵心を持つ武将` fixtureを実検索文テストへ追加した。
- 可視版と両runtime cache keyを `Update09.5.51 r141` へ更新した。HTMLサイズ差はcache keyの数字置換のみで0 bytes。

### Update09.5.52 — Debug Logパネルの表示復旧

- 公開Previewのセルフチェックで、`ログ表示` ON後にログ本文は生成される一方、`#debugPanel.hidden-panel` が残ってCSSの `display:none` が優先されることを確認した。
- `renderDebugPanel()` が表示状態と同じ正本値 `state.showRawJson` から `hidden-panel` を付け外しし、既存のbodyレイアウトクラス・非同期ログ生成と同期するようにした。
- `tools/test_update09_5_52_debug_panel_visibility.js` はOFF時の非表示とON時のクラス解除・本文生成を実行し、常設検証へ追加した。
- 公開キャッシュ対策として `hado_core.js`、`hado_status_effects.js`、`hado_version.js` を同じ `09.5.52-r142` keyで取得する。HTMLへロジックは追加せず、`index.html` の正規化後サイズ差はcore cache key分の+15 bytes。
- PR #221マージ後、公開Previewで初期バナーの通常配置、ロード後非表示、`関羽`検索、Debug Log表示、390px幅の横あふれなしを実操作確認した。

### Update09.5.53 — 武将全文検索の一次情報境界

- `hado_status_effects.js` の武将検索サニタイズへ、基本情報セクションの直後から戦法セクションの直前までを攻略評価領域として判定する `isGeneralCommentarySearchSection()` を追加した。
- 攻略評価領域に加え、`○○の列伝`、`演義`、`正史` を武将全文検索から除外した。既存の相性・五行・専用名宝・所有者一覧除外も同じ経路で維持する。
- 武将名、基本情報、戦法、技能、能力・兵科等の構造化表は検索対象のまま維持する。これにより `関羽` は本人3件と実際の戦法・技能条件3件の合計6件となる。
- `tools/test_update09_5_53_general_search_source_boundary.js` は実データ481武将の完全一致6件、代表的な攻略評価/列伝由来の誤一致除外、未知の攻略見出し除外、実際の効果本文維持を検証する。
- 可視バージョンは `3.0.0.0 Update09.5.53 r143`。`hado_version.js`、`HADO_DEV_INFO.json`、`index.html` の3 runtime cache keyを同期した。
- HTMLへロジックは追加していない。`index.html` のサイズ差はcache keyの同長置換のため0 bytesで、検索ロジックは外部 `hado_status_effects.js` に維持した。
- Update09.5.51で「説明・列伝を維持」とした境界はユーザー指定と異なっていたため、本Updateの一次情報境界で明示的に置き換える。
- PR #223マージ後、公開Previewで `関羽` が6件だけになること、範囲外武将が0件であること、PC/390x844表示、Debug Log、両リポジトリActions、公開marker一致を実確認した。

### Update09.5.54 — IME確定後検索

- `hado_bootstrap.js` の検索入力へcaptureフェーズのIMEガードを追加した。変換開始時に既存debounceを取り消し、変換中の `input` とIME確定用 `Enter` を通常検索・履歴登録へ渡さない。
- `compositionend` で確定値の検索を一度だけ予約し、直後に同じ値で発火する `input` は重複イベントとして消費する。次の通常入力は既存debounce経路へ戻す。
- `preventDefault()` は使用せず、ブラウザとIMEによる文字確定そのものは維持する。`event.isComposing` と旧ブラウザの `keyCode === 229` の両方を判定する。
- `tools/test_update09_5_54_ime_search_commit.js` で、予約取消、変換中入力、確定時1回検索、重複input除外、IME Enter履歴除外、通常入力・Enter維持を実行検証し、全アプリ検証へ常設した。
- 可視版を `3.0.0.0 Update09.5.54 r144` とし、変更runtimeを含む4資産のcache keyを同期した。HTMLへロジックは追加せず、`index.html` のサイズ差は同長置換のため0 bytes。

### Update09.5.55 — 型候補一覧の侍従成立ゲート

- 型候補一覧は `hadou_type_search_role_index.json` の `roleId=attendant` を採点していたが、部隊編成側の侍従条件を参照しないため、配置できないLR武将も候補として表示していた。
- `hado_formation.js` に役割候補の共通ポリシーを追加し、侍従はUR以下だけを許可する。位置・兵科・能力値は従来どおり、実際の親武将と侍従位置が決まった時点で `evaluateJijuAttendantCondition()` が追加判定する。
- `hado_type_candidates.js` は採点・所有判定より前に共通ポリシーを適用し、LR侍従候補を候補件数と一覧の両方から除外する。主将・副将・補佐のLR候補には影響させない。
- 候補トレイは行の `roleId` に対応する配置先だけを表示する。侍従候補を主将・副将・補佐へ置き換える経路や、LR侍従をトレイへ追加・配置する経路を拒否する。
- `hado_candidate_tray_core.js` は `hado_formation.js` と同じイベントを重複購読し、独自の配置先を生成していたためruntimeから削除した。候補トレイUIは `hado_candidate_tray.js`、保存・配置・成立判定は `hado_formation.js` を正本とする。
- JSON契約とCrawler出力は変更しない。派生索引にLRの侍従ロール行が含まれていても、runtimeの役割成立ゲートで表示対象外にする。
- 可視版を `3.0.0.0 Update09.5.55 r145` とし、変更runtimeとversion資産のcache keyを同期した。ロジックは外部JavaScriptに実装し、HTMLにはscript参照の整理だけを行った。`index.html` は 28,058 bytes から 28,077 bytes（+19 bytes）。

### Update09.5.56 — 検索境界・候補同期・スマホ応答改善

- `hado_status_effects.js` は「兵科の基本能力」「各レベルの能力」「兵科ランク上昇タイミング」「解説」、武将別の `○○の兵科` 親セクション、兵科基本能力表、`解放将星/基礎兵力` 表を武将全文検索から除外する。表番号だけに依存せず表のセル構造でも判定し、通常検索とパラメータ検索の両経路を同じ境界へ揃えた。
- 兵科表を外しても、基本情報、戦法表、追加効果表、技能本文、能力・五行表に実在する兵力効果は検索対象として残す。実データ回帰では `兵力` が481/481件の全件一致から227/481件へ減少し、実効果を持つ司馬師が残ることを検証した。
- `hado_type_candidates.js` は候補トレイsnapshotの `roleId/name/typeId` を選択キーとして保持する。削除・全削除snapshotに該当行がなければ `picked` と `pickedTrayKey` を解除し、開いている候補一覧も再描画する。
- 新規 `hado_type_data_store.js` が `hadou_type_search_role_index.json`、score rules、purpose rulesを1ページ1回だけ取得し、型編成ナビと型候補一覧で同じPromise/結果を共有する。従来の2系統の `cache:no-store` 重複取得を解消した。
- 型編成ナビは主将候補を初回80件、型候補一覧は初回60件だけDOM化し「さらに表示」で追加する。型候補採点は24件ごとに次フレームへ制御を返し、読込・採点中もモーダルと進捗を先に表示する。
- `hado_core.js` の全データ/保存データ切替は、保存操作時に更新済みの保存索引を再利用する。検索・詳細は即時更新し、部隊編成再描画は次フレームへ送って入力応答を先に返す。
- 可視版を `3.0.0.0 Update09.5.56 r146` とし、変更runtimeとversion資産のcache keyを同期した。ロジックはすべて外部JavaScriptへ実装した。Git正規化後の `index.html` は28,057 bytesから28,136 bytes（+79 bytes）で、追加は共通データストアのscript参照とcache keyだけである。
- Crawler入力・20派生JSON契約・保存データ形式は変更していないため、Crawler再実行やJSON再生成は不要である。

### Update09.5.57 — 型候補複数選択・データ切替進捗・診断版数表示

- `hado_type_candidates.js` の選択状態を単一キーから候補キーと候補データの `Map` に変更した。役割タブ切替では選択を消さず、選択した全候補を候補トレイへ追加する。候補トレイsnapshotで対応行がなくなれば、従来どおり該当する全選択を解除する。
- 役割タブには `min-width:max-content`、`white-space:nowrap`、省略なしを指定した。スマホは横スクロールで全タブを表示し、`主将 (N)` 等の件数が `...` にならない。
- `hado_core.js` に `setViewModeWithUiBusy()` を追加し、データ管理画面からの全データ/保存データ切替を既存のoverlayで包む。処理開始前の1フレームで「切り替えています…」を描画し、その後に検索・詳細・編成を更新する。
- 診断画面の版数は `HADO_BUILD_INFO.version` 固定ではなく、`hado_version.js` が正本として公開する `HADO_APP_DISPLAY_VERSION` を読む。可視版を `3.0.0.0 Update09.5.57 r147` へ更新し、変更runtimeのcache keyを同じ版へ同期した。
- HTMLへロジックは追加していない。変更は既存外部JavaScript、version定義、cache keyに限定する。

### Update09.5.58 — 型候補の全役割件数確定表示

- `scheduleIdleRoleCounts()` は定義されていたが呼び出されておらず、選択中以外の役割件数が `…` のまま更新されなかった。
- `prepareAllRoleCounts()` で9役割を既存のフレーム分割採点経路に通し、進捗を表示しながら件数cacheを完成させる。候補カードを描画する時点では全タブが数値になり、役割切替時は採点済みcacheを再利用する。
- 可視版を `3.0.0.0 Update09.5.58 r148` へ更新する。HTMLへロジックは追加せず、外部JavaScriptとcache keyだけを変更する。

### Update09.5.59 — 符号付き数値検索境界・保存データ往復監査

- バグ分類: 符号付きメトリック検索の条件適用漏れ。検索語の `+` / `-` を解析して表示用数値は抽出していたが、候補採否は基礎語（例: `兵力`）の部分一致だけで確定していた。
- 根本原因: `renderSearchResults()` が `extractMetricFromItem()` の抽出結果を並び替え表示にだけ使い、符号・数値・単位を検索条件として要求していなかった。このため `兵力を決定` のような符号付き効果でない本文も `兵力+` に一致した。
- 恒久対策: 共通 `metricMatchesSearchQuery()` で半角/全角符号、明示符号、数値、単位を判定し、非plain検索では実際のメトリック一致を採否条件にする。符号なし基礎値を暗黙の `+` として扱わない。
- 影響範囲: 全カテゴリの末尾/先頭符号付きメトリック検索。通常の単語部分一致、名称のみ検索、JSON契約、Crawler出力、保存形式は変更しない。
- 再発防止: 実データのLR呂布をfixtureにして `兵力を決定` は存在するが `兵力+` には不一致であること、半角/全角正負、数値・単位の一致を実行検証へ追加した。さらに保存データExport→Importの追加・維持・上書き・編成/履歴統合・永続化を実関数で検証する回帰を追加した。
- 可視版を `3.0.0.0 Update09.5.59 r149` へ更新する。ロジックは外部 `hado_status_effects.js` / `hado_search.js` に実装し、HTMLはcache keyだけを変更する。Crawler再実行とJSON再生成は不要である。
