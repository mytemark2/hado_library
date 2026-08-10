# Update11 Implementation

## 3.0.1.1版管理移行

- `3.0.0.0` の大型開発計画完了に伴い、runtimeの `updateNo` を空にし、通常の4桁版管理へ移行した。
- `releaseVersion` は公開後のスマホ対応修正版として `3.0.1.1`、preview buildは `r165` とした。
- `hado_update_meta.js` はUpdate計画中、Updateなしpreview、正式版の3表示契約を共通処理で導出する。
- preview marker生成、asset cache key、版数validator、過去Update回帰を、空の `updateNo` と `3.0.1.1 r165` に対応させた。
- 過去のUpdate01〜11文書と `3.0.1.0 Update11.4 r164` の受入記録は履歴として保持する。

## Update11.4 PC/スマホ機能差解消

### 分類と根本原因

- 分類: レスポンシブ表示で代替UIへ切り替える際の情報欠落、および共通画面の描画エラー。
- 根本原因: 状態変化検索はタグボタンと候補パネルだけを状態変化行へ移し、タグ入力を含む親要素を意図的に非表示にしていた。検索結果はPCカードをスマホで非表示にしてセレクトへ置換したが、一致理由とbadgeの代替表示を用意していなかった。部隊編成も狭幅で技能・参軍技能・軍馬補足を非表示にしたまま代替表示がなかった。軍馬画面は削除済み集計の変数名をDebug Logが参照していた。
- 同一欠陥クラスの影響: 通常/状態変化/型検索のタグUI、スマホ検索結果、部隊編成の選択枠・参軍・軍馬、軍馬画面、検索以外のスマホタブに残る検索履歴、16px未満の入力系。

### 恒久対策と実装

- `hado_search.js` はタグ入力・タグボタン・クリア・候補パネルを含む `tagSearchWrap` 全体を、検索モードに応じて通常行または状態変化行へ移す。タグ状態と検索判定は既存の共通経路を維持する。
- `hado_formation.js` はスマホ検索結果の選択項目へ主要badge・一致理由の要約を追加した。選択枠の技能は開閉欄、参軍技能は参軍選択ダイアログ、軍馬情報は各軍馬枠の補足行で確認できる。
- `hado_core.js` は軍馬画面の割当数を現在の `activeSlots` から算出し、未定義変数参照を解消した。スマホ検索履歴の表示条件を検索タブだけに限定した。
- `hado_styles.css` はPCの状態変化条件とタグ入力を同一行へ配置し、980px以下ではタグ入力を次段へ折り返す。520px以下の軍馬枠は1列とし、すべての入力系を16px以上にした。`maximum-scale` / `user-scalable=no` は使用しない。
- `tools/test_update11_4_mobile_parity.js` を全App Validationへ常設した。過去Update11回帰の版数固定は各機能を導入した版以降を許容する条件へ修正し、将来Updateでも履歴回帰が継続するようにした。

### 外部化判断

動作は既存責務の外部 `hado_core.js`、`hado_search.js`、`hado_status_effects.js`、`hado_formation.js`、表示は外部 `hado_styles.css` に実装した。HTMLは外部asset cache key更新だけで、インラインJavaScriptとインラインCSSは追加していない。

## Update11.3 スマホのタグ操作・表示改善

### 分類と根本原因

- 分類: メインスレッドの描画順序と狭幅レスポンシブ指定の競合による操作フィードバック遅延・表示欠損。
- 根本原因: タグDOM更新と検索・結果再描画を同一JavaScriptタスクで同期実行していたため、重い検索が終わるまでブラウザーが選択済みタグを描画できなかった。加えてスマホ用入力が12pxでiOS Safariの自動拡大条件に該当し、状態変化検索は320〜390pxでも4列1行を強制していた。選択済みタグ行にも `nowrap` と `overflow:hidden` が残っていた。
- 同一欠陥クラスの影響: 通常・状態変化・型検索で共有するタグ追加・解除・全解除、スマホのキーワード・タグ入力、状態変化検索行、選択済みタグ・ヒット件数表示。

### 恒久対策と実装

- `hado_status_effects.js` に世代番号付きの遅延検索スケジューラーを追加した。タグDOMと「タグを反映しました。検索中…」を同期更新し、`requestAnimationFrame` 後のタスクで検索を開始する。連続操作時は古い予約検索を破棄する。
- `hado_styles.css` で520px以下のキーワード・タグ入力を16pxへ固定し、viewport拡大禁止を使わずにiOSの自動拡大を防止した。
- 429px以下は状態変化の分類・項目を1段目、解除・タグ入口を2段目、候補パネルを3段目へ再配置した。PC・430px以上の同一行配置は維持する。
- 520px以下では検索状態行を1列へ切り替え、選択済みタグを折り返し、タグと件数の切り捨てを解除した。
- `tools/test_update11_3_mobile_tag_ux.js` を全App Validationへ常設し、描画順、検索予約の世代管理、16px入力、狭幅2段配置、タグ折り返し、viewportズーム維持を固定した。

### 外部化判断

動作は既存責務の外部 `hado_status_effects.js`、表示は外部 `hado_styles.css` に実装した。HTMLは外部asset cache key更新だけとし、インラインJavaScriptとインラインCSSは追加していない。

## 3.0.1.0 正式版反映履歴

- `main`の本番Pages配信設定を保持したまま、開発正本`feature/app-3.0.0.0`のUpdate11一式を統合する。
- `hado_version.js`は内部の`updateNo: 11.2`と`revision: 162`を保持し、`formalRelease: true`を正式版表示の単一切替とする。正式画面は`3.0.1.0`だけを表示し、開発Previewは`3.0.1.0 Update11.2 r162`を維持する。
- `HADO_DEV_INFO.json`は`releaseStatus: released`とし、可視版数値を重複保持しない。
- `main`固有の`.github/workflows/deploy-production-pages.yml`、Pages source `main` / `/`、本番配信検証を維持する。
- 競合は`HADO_DEV_INFO.json`、`README.md`、Update10文書3件、`hado_version.js`の6件。版数は最新開発正本、本番Pagesの事実と正式表示規則は最新`main`を採用し、内容単位で解消する。
- HTMLと機能JavaScript/CSSは検証済み開発正本をそのまま利用する。正式版切替は外部`hado_version.js`だけで行い、HTMLを増やさない。

## Update11.2 タグ操作改善

### 分類と根本原因

- 分類: タグ入力UIの不要な確定操作による操作負荷。
- 根本原因: `datalist` 候補選択後も利用者が「追加」ボタンまたはEnterで確定する二段階操作になっていた。また従来の追加関数は重複タグでも再描画、再検索、操作履歴追加を実行していた。
- 同一欠陥クラスの影響: 通常検索、状態変化検索、型検索で共有するタグ入力経路。タグ一覧のチェックボックス経路は直接追加のため影響なし。

### 恒久対策と実装

- `hado_status_effects.js` に有効タグ完全一致だけを確定する `commitTagSearchInput` を追加した。候補リスト選択時の `input` / `change` と、直接入力・Enterを同じ関数へ集約した。
- 無効または部分一致の入力は保持する。有効タグは追加後に入力欄を空にし、重複タグは選択状態、検索結果、操作履歴を変更しない。
- `compositionstart` / `compositionend` と `isComposing` / keyCode 229を使い、日本語IMEの変換途中では追加しない。
- `index.html` から `addTagSearchBtn` を削除し、`hado_core.js` のDOM参照、`hado_bootstrap.js` の必須要素・click listener、`hado_styles.css` のボタン用指定を同時に削除した。
- タグ入力行はPC・スマホとも「タグ・入力・クリア」の3列へ統一した。
- `tools/test_update11_2_tag_auto_add.js` を全App Validationへ常設し、完全一致、自動追加、IME保護、無効入力保持、重複抑止、DOM/CSS契約を固定した。

### 外部化判断

動作は既存責務の外部 `hado_status_effects.js` と `hado_bootstrap.js`、表示は外部 `hado_styles.css` に実装した。HTMLはボタン要素の削除と外部asset cache key更新だけで、インラインJavaScriptとインラインCSSは追加していない。

## Update11.1 技能所有者タグ修正

### 分類と根本原因

- 分類: 派生索引間の関連付け欠落による検索機能不全。
- 根本原因: `hadou_tag_index.json` の `技能:<技能名>` は技能項目へだけ適用され、`hadou_skill_owner_index.json` に存在する所持武将・所持装備との所有関係をタグ検索索引へ反映していなかった。このため「技能:練兵」を武将カテゴリへ適用すると0件になった。
- 同一欠陥クラスの影響: 651技能タグ、武将所有関係1,598件、装備所有関係427件。

### 恒久対策と実装

- `hado_status_effects.js` に技能所有者タグ検索表を構築する共通処理を追加した。
- タグ索引に存在する技能タグだけを対象にし、所有者索引の `generals` と `equipments` へタグを合成する。個別技能名の特例は設けない。
- 技能タググループの対象カテゴリへ武将・装備を追加し、既存の検索カテゴリ順で「武将・技能・装備」と表示する。
- 適用項目数・適用タグ数・未解決タグ数を診断情報へ記録する。
- `tools/test_update11_1_skill_owner_tags.js` を全App Validationへ常設し、技能全体の所有関係と「練兵」5武将・5装備を固定した。
- 派生JSONは変更せず、既存20ファイルの契約検証を実行する。

### 外部化判断

動作は既存責務の外部 `hado_status_effects.js` に実装し、HTMLは外部assetのcache key更新だけに限定した。インラインJavaScriptとインラインCSSは追加していない。

## 分類と根本原因

- 分類: タグUIの情報設計不足、および状態変化検索専用経路の検索条件欠落。
- 根本原因: タグ候補はタグキーだけを表示し、派生タグ索引に存在する項目カテゴリを表示モデルへ保持していなかった。また状態変化検索は専用の非同期所有者索引を利用し、通常検索の `matchesSelectedTags` 経路を通らず、モード状態も状態変化用タグを保存していなかった。

## 実装

- `hado_core.js` に検索カテゴリ表示順とタググループ対象カテゴリ状態を追加した。
- `hado_status_effects.js` で `hadou_tag_index.json` の各項目からタググループ別対象カテゴリを算出する。タグ候補見出しへカテゴリbadgeを表示し、カテゴリ順、生成JSONのタググループ順、名称順で安定ソートする。
- 生成JSONのsnake_caseカテゴリ名は画面側のカテゴリキーへ正規化し、状態変化・兵器・武装・軍馬技能が英字表示または末尾表示にならないようにする。
- `hado_search.js` で状態変化検索の同期検索、グループ索引検索、非同期検索、pending fallbackへ共通タグ判定を適用する。キャッシュキーと検索条件chipにもタグを含め、モード切替時に状態変化用タグを保存・復元する。
- 状態変化モードではタグ入口を状態変化選択行へ移動し、PC・スマホとも1行の4列構成にする。候補パネルは同じ行の直下へ展開する。
- `tools/test_update11_tag_organization.js` を全App Validationへ常設した。

## 論理仕様

- 状態変化条件とタグ条件: AND。
- 同一タググループ内: OR。
- 異なるタググループ間: AND。
- タグ対象カテゴリ表示順: 武将、戦法、技能、装備、状態変化、兵器、武装、陣形、名馬、軍馬技能。

## 外部化判断

動作は既存責務の外部 `hado_status_effects.js` と `hado_search.js`、表示は外部 `hado_styles.css` に実装した。HTMLへインラインJavaScriptまたはインラインCSSは追加していない。
