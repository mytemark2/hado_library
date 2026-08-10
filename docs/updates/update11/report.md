# Update11 Report

## 3.0.1.1公開移行

- Update11は `3.0.0.0` 開発計画における最終追加対応として `3.0.1.0 Update11.4 r164` で完了した。
- Updateは大型開発の分割計画に限定し、完了後の通常改善では使用しないルールへ統一した。
- スマホ検索・編成の受入済み改善を正式公開するため、4桁版を `3.0.1.1`、最終プレビュー版を `3.0.1.1 r165` とする。
- 正式版は `formalRelease: true` により `3.0.1.1` だけを表示し、プレビュー版は `formalRelease: false` により `3.0.1.1 r165` を表示する。
- 開発ブランチ: PR [#277](https://github.com/mytemark2/hado_library/pull/277) をmergeし、正本commitは `9592e6a5f171245711eb26e2821ba9f5d2cec467`。`App Validation / app-validation` run `31350753878` は成功した。
- Preview同期: 初回run `31350782645` は、Preview Pages側が空の `updateNo` を受理できず失敗した。根本原因をPreview PR [#5](https://github.com/mytemark2/hado_library-preview/pull/5) で修正し、Pages run `31351006919` は成功した。
- Preview repository `main`: `607fab319eb5ce12f2b4843fbba8d509181eaf92`。必須runtime、`.nojekyll`、派生JSON 34件を確認した。
- Preview marker: `PREVIEW_SOURCE_COMMIT.txt=9592e6a5f171245711eb26e2821ba9f5d2cec467`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.0.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.0.1.1 r165`。
- 公開Preview実操作: https://mytemark2.github.io/hado_library-preview/ で `3.0.1.1 r165`、Update非表示、公開JSON自動読込、状態変化検索の `技能:練兵` 5件、検索中のタグ先行表示、横overflow 0px、Debug Log表示とログ生成を確認した。
- 正式公開: PR [#278](https://github.com/mytemark2/hado_library/pull/278) をmergeし、`main` commitは `eb492f45890a3d1a1cffe5d9b225ca626ddf0524`。リリースブランチHEADは `765046cc4de2f07d4a4b971eec749ccbc0c59b67`。
- main統合: 最新main `f5621a44315f702068378cbc0332bb9055420f10` と開発正本 `9592e6a5f171245711eb26e2821ba9f5d2cec467` の双方に対するmerge readinessは成功。文書・版表示・版検証の10競合は、本番Pages基盤、過去の3.0.1.0公開履歴、最新3.0.1.1機能を保持するよう内容単位で解消した。
- 正式版検証: `python -X utf8 tools/run_app_validation.py` は本番Pages検証を含む130/130件成功。PR Actions `App Validation / app-validation` run `31351822970` も成功した。
- 本番配信: `Deploy Hado Library Production Pages` run `31351858443` 成功。`Notify Hado Library Preview` run `31351858398` はmain pushのため意図どおりskip。Pagesはworkflow配信、source `main` / `/`、status `built`。
- 正式公開URL: https://mytemark2.github.io/hado_library/ 。title、h1、診断表示はいずれも `3.0.1.1` のみで、Update・revisionは非表示。公開JSONは武将485、戦法444、技能1,365、装備247、状態変化206、兵器6、武装18、専用技能32、陣形21、軍馬5、軍馬技能27を読込済み。
- 正式公開実操作: 状態変化検索で `技能:練兵` の選択済みタグを検索開始前に表示し、その後5件（先頭: UR越吉）へ確定。横overflow 0px、Debug Log 2,402文字、重大エラーなし、console error / warning 0件を確認した。
- HTML: mainのGit blob 29,154 bytesから29,172 bytesへ18 bytes増。変更は外部asset cache keyのみで、インラインJavaScript / CSSは追加していない。
- 最小受入操作: 正式公開URLの状態変化検索でタグ欄へ `技能:練兵` を入力し、タグが先に表示され、その後5件になることを確認する。
- 残課題: none。

## Update11.4 Preview反映前報告

- 表示版: `3.0.1.0 Update11.4 r164`。正式版の基本バージョンは `3.0.1.0` のまま。
- 実装: 状態変化検索の完全なタグ入力コンボボックス、スマホ検索結果の主要badge・一致理由、選択枠の有効技能開閉、参軍の有効技能名、軍馬の編成・技能補足、軍馬画面の未定義変数修正、検索タブ外の検索履歴非表示、入力系16px化。
- HTML: 変更前29,168 bytes、変更後29,162 bytes（6 bytes減）。HTMLはasset cache key更新のみで、動作・表示は既存の外部JavaScript/CSSへ実装した。
- 専用回帰: `node tools/test_update11_4_mobile_parity.js` 成功。Update11〜11.3の履歴回帰も成功。
- 全体回帰: `python -X utf8 tools/run_app_validation.py` 128/128成功。JavaScript・JSON・HTML・外部CSS・派生JSON 20件・検索・詳細・編成・保存Import / Export・レスポンシブ契約を確認した。
- PC 1280px: 状態変化分類・状態変化・解除・タグ入力は同一行（top差2px以内）。状態変化行と文書の横overflowは0px。
- スマホ: 320px・375px・390pxで状態変化行・文書の横overflowは0px、状態変化選択とタグ入力は16px。390pxで `技能:練兵` 選択直後にbadgeと検索進捗34%が表示され、その後5件へ確定した。
- スマホ検索結果: 選択欄直下にカテゴリ、名称、補足、主要badgeを表示し、要約欄と文書の横overflowは0px。
- スマホ部隊編成: 主将枠で有効技能6件を開閉表示、参軍「王異」で `増兵Ⅰ / 助言Ⅰ` を表示。軍馬枠は1列で補足行を表示し、軍馬画面・部隊編成ともconsole error / warning 0件。
- Git: 基準 `c6c82105312b0a89b2a57ac602d69d5a37d37d16`、実装commit `188cc5f68e174490b37c578f17caba97e74bef7d`、PR [#276](https://github.com/mytemark2/hado_library/pull/276)。`python tools/check_pr_merge_readiness.py --base feature/app-3.0.0.0` は競合なしで成功した。
- Actions: `App Validation / app-validation` run `31345853587` 成功。イベント駆動Preview同期は正本ブランチへのmerge後に確認する。
- 最小受入操作: スマホで状態変化検索を開き、タグ欄へ `技能:練兵` を入力してタグが先に表示されること、検索結果を選んで補足badgeを確認すること、部隊編成の主将枠で有効技能を展開すること、参軍枠を開いて現在の有効技能を確認すること、軍馬編成タブがエラーなく開くことを確認する。
- 残課題: 正本ブランチへのmerge、イベント駆動Preview同期、公開URLとmarker一致の確認。

## Update11.3 Preview反映報告（スマホ実機受入待ち）

- 表示版: `3.0.1.0 Update11.3 r163`。
- 実装: タグ描画先行、世代番号付き遅延検索、スマホ入力16px、429px以下の状態変化検索2段配置、選択済みタグ・件数の折り返し表示。
- HTML: 変更前29,180 bytes、変更後29,168 bytes（12 bytes減）。動作は `hado_status_effects.js`、表示は `hado_styles.css` に実装し、HTMLはasset cache keyだけを更新した。
- 専用回帰: `node tools/test_update11_3_mobile_tag_ux.js` 成功。
- 全体回帰: `python -X utf8 tools/run_app_validation.py` 127/127成功。JavaScript・JSON・HTML・外部CSS・派生JSON 20件・検索・詳細・編成・保存Import / Export・レスポンシブ契約を確認した。
- ローカル実操作: `技能:練兵` を入力後、検索進捗56%時点で選択済みタグが表示済みであること、その後に武将5件へ確定することを確認した。状態変化「攻撃上昇」とタグ「技能:練兵」のAND検索は越吉・関興・関索・曹洪・曹真の5件。
- PC 1280px: 状態変化分類・状態変化・解除・タグのtop座標が266pxで一致し、行の `scrollWidth=clientWidth=956px`、文書横overflow 0pxを確認した。
- スマホ契約: 520px以下の入力16px、429px以下の2段配置、選択済みタグ折り返し、件数全表示、viewportズーム維持を専用回帰で確認した。ブラウザーのURLポリシーによりローカル検証用の狭幅フレーム作成が拒否されたため、実際の320px・375px・390px操作は利用者のスマホ受入確認対象とする。
- Git: 基準 `863c137011f5ad20d7a6daf27634823d745c1f31`、実装commit `8f23aa6882fafa436e2c4ec7fadd96ed6af050e4`、PR [#274](https://github.com/mytemark2/hado_library/pull/274)、正本merge commit `0d5af461a5cc283d33739caa72b9d9c08649bf18`。
- マージ準備: `python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.0.0.0` 成功。取得base `863c137011f5ad20d7a6daf27634823d745c1f31`、head `8f23aa6882fafa436e2c4ec7fadd96ed6af050e4`、競合なし。
- Actions: `App Validation / app-validation` run `31315203580` 成功、`Notify Hado Library Preview` run `31315240852` 成功。
- Preview repository `main`: `bbaa10d577dfdef840d7ee4b30a76d1b9b2c7b62`。`Deploy Hado Library Preview` run `31315258424` 成功。
- Preview marker: `PREVIEW_SOURCE_COMMIT.txt=0d5af461a5cc283d33739caa72b9d9c08649bf18`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.0.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.0.1.0 Update11.3`。
- 公開URL: https://mytemark2.github.io/hado_library-preview/ 。表示版、Update11.3のJS/CSSとcache key、状態変化検索・タグDOM、必須runtime・派生JSON・`.nojekyll` を確認した。
- 公開実操作: `技能:練兵` は検索進捗34%時点で選択済みタグが表示され、その後武将5件へ確定した。状態変化「攻撃上昇」とのAND検索も越吉・関興・関索・曹洪・曹真の5件。Debug Log表示・非表示とログ生成を確認し、console error / warning 0件。
- 最小受入操作: スマホで公開URLを開き、(1)キーワード欄タップで画面が自動拡大しない、(2)状態変化検索が2段で欠けない、(3)タグ選択直後にbadgeが表示されてから検索が進む、(4)選択済みタグとヒット件数が省略されない、の4点を確認する。
- 残課題: 320px・375px・390pxのスマホ実機受入確認。

## 3.0.1.0 正式版反映完了（履歴）

- 正式表示: `3.0.1.0`。内部識別`Update11.2 r162`はキャッシュ・履歴・開発Preview向けに保持する。
- 統合元: `main` commit `46912ef5b19e5f2b5562e4a65d219a08d308f2ce`、開発正本 commit `863c137011f5ad20d7a6daf27634823d745c1f31`。
- `main`固有の本番Pages workflowと正式表示規則を維持し、Update11のruntime・回帰・記録を統合した。
- HTML: 開発Preview版と同一の29,180 bytes。正式表示切替は外部`hado_version.js`で行い、HTML・機能JavaScript・CSSは変更していない。
- 全体回帰: `python -X utf8 tools/run_app_validation.py` 127/127成功。本番Pages workflow、JavaScript・JSON・HTML・外部CSS・派生JSON 20件・検索・詳細・編成・保存Import / Export・レスポンシブ契約を確認した。
- ローカル実操作: title、h1、診断画面がすべて`3.0.1.0`のみで、`Update11.2`と`r162`の可視表示なし。「追加」ボタン0件、`技能:練兵`の入力だけで自動追加・武将5件、状態変化「攻撃上昇」とのAND検索5件を確認した。
- PC配置: 状態変化選択とタグ入口が同一行、横overflowなし。アプリ内検証ログ2,402文字を生成し、error / exception / failedなし。
- Git: リリースcommit `5417b6a3e82d08e1f9360576de30e772eb602ffd`、PR [#272](https://github.com/mytemark2/hado_library/pull/272)、正式版`main` commit `0755b447973747648094d2b37bfa75a1b4d9d403`。
- マージ準備: `python -X utf8 tools/check_pr_merge_readiness.py --base main`はbase `46912ef5b19e5f2b5562e4a65d219a08d308f2ce`、`--base feature/app-3.0.0.0`はbase `863c137011f5ad20d7a6daf27634823d745c1f31`で成功。6競合は版数・本番Pages・文書の事実を内容単位で統合済み。
- Actions: `App Validation / app-validation` run `31306314323`成功。`Deploy Hado Library Production Pages` run `31306352848`成功。`Notify Hado Library Preview` run `31306352862`は`main` pushのため意図どおりskip。
- Pages: source `main` / `/`、status `built`、配信commit `0755b447973747648094d2b37bfa75a1b4d9d403`。

### 正式公開確認

- 公開URL: https://mytemark2.github.io/hado_library/
- 表示版: title、h1、診断画面はいずれも`3.0.1.0`のみ。`Update11.2`と`r162`の可視表示なし。
- DOM / runtime / data: 状態変化選択、タグ入口、タグ一覧DOM、正式版runtime assets、公開JSON読込を確認。表示件数は武将485、戦法444、技能1,365、装備247、状態変化206、兵器6、武装18、専用技能32、陣形21、軍馬5、軍馬技能27。
- 操作: 「追加」ボタン0件。`技能:練兵`を入力すると自動追加され武将5件。状態変化「攻撃上昇」とのAND検索も5件。状態変化選択とタグ入口は同一行、横overflowなし。
- Debug Log: 画面内検証は`OK`、`criticalFailures: 0`、`warnings: 0`、`info: 0`。表示版は`3.0.1.0`。
- 判定: PASS。
- 最小受入操作: 正式公開URLの通常検索で`技能:練兵`を入力し、追加ボタンなしでタグが追加され武将5件になることを確認する。
- 残課題: none。

## Update11.2 完了報告

- 表示版: `3.0.1.0 Update11.2 r162`。
- 実装: 有効タグ完全一致時の自動追加、IME変換保護、無効入力保持、重複追加の副作用抑止、「追加」ボタン削除、3列レスポンシブ化。
- HTML: 変更前29,257 bytes、変更後29,180 bytes（77 bytes減）。HTMLはボタン削除と外部asset cache key更新のみで、動作・表示は外部JavaScript/CSSへ実装。
- 専用回帰: `node tools/test_update11_2_tag_auto_add.js` 成功。
- 全体回帰: `python -X utf8 tools/run_app_validation.py` 126/126成功。JavaScript・JSON・HTML・外部CSS・派生JSON 20件・検索・詳細・編成・保存Import / Export・レスポンシブ契約を確認した。
- ローカル実操作: 「追加」ボタンなし、部分一致入力保持、`技能:練兵` の完全一致入力で自動追加・入力欄消去・武将5件、重複入力でbadge 1件・結果5件を維持、無効な `技能:連兵` はEnter後も保持、状態変化「攻撃上昇」とタグ「技能:練兵」のAND検索5件を確認した。
- PC 1280px: 状態変化分類・状態変化・解除・タグのtop座標がすべて231pxで同一行、横overflowなし。ブラウザconsole error / warning 0件。
- IME境界: 専用回帰で `compositionstart` / `compositionend`、`isComposing`、keyCode 229の保護を固定した。
- Git: 基準 `497199f25df2208e72241925d399acc8a74297bb`、実装commit `d96d76ea8cf474e1e46ea1fc556381cf5c79ac7a`、PR [#270](https://github.com/mytemark2/hado_library/pull/270)、正本merge commit `0ea7d86c2cbaae662f7fe10ee1a5763bf04d3b11`。
- マージ準備: `python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.0.0.0` 成功。取得base `497199f25df2208e72241925d399acc8a74297bb`、head `d96d76ea8cf474e1e46ea1fc556381cf5c79ac7a`、競合なし。
- Actions: `App Validation / app-validation` run `31305115421` 成功、`Notify Hado Library Preview` run `31305131954` 成功。
- Preview repository `main`: `3e8af11b282f9cd64ae216d38d02a8586d45efb0`。`Deploy Hado Library Preview` run `31305149606` 成功。
- Preview marker: `PREVIEW_SOURCE_COMMIT.txt=0ea7d86c2cbaae662f7fe10ee1a5763bf04d3b11`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.0.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.0.1.0 Update11.2`。
- 公開URL: https://mytemark2.github.io/hado_library-preview/ 。表示版、必須runtime・派生JSON、cache key、自動追加、部分一致・無効入力保持、重複抑止、状態変化AND検索、PC同一行・横overflowなし、Debug Log、console error / warning 0件を確認した。
- 最小受入操作: 通常検索のタグ欄で `技能:練兵` を入力し、「追加」ボタンを押さずにタグが追加され、武将5件になることを確認する。
- 残課題: none。

## Update11.1 完了報告

- 表示版: `3.0.1.0 Update11.1 r161`。
- 実装: 技能651件のタグを武将所有関係1,598件、装備所有関係427件へ共通反映。
- 個別確認: `技能:練兵` は武将5件、装備5件、技能1件。状態変化「攻撃上昇」とのAND検索も武将5件。
- タグ表示: `武将・技能・装備｜技能`。
- HTML: 変更前29,230 bytes、変更後29,257 bytes（27 bytes増）。変更は外部asset cache keyのみで、動作は外部JavaScriptへ実装。
- ローカル検証: `python -X utf8 tools/run_app_validation.py` 125/125成功。専用回帰、派生JSON 20件契約、版数整合、保存Import / Export、部隊編成、レスポンシブ契約、PC実操作、ブラウザconsoleを確認済み。
- Git: 基準 `bf05d58a57e0d0cb1180b649c0d38f531ea16367`、実装commit `a99e58593f7bdfb7556be96ee707e8acd04f3413`、PR [#268](https://github.com/mytemark2/hado_library/pull/268)、正本merge commit `3e715a233cc4364ac7a6e7bd0a17e5901bc3e0aa`。
- Actions: `App Validation / app-validation` run `31303341917` 成功、`Notify Hado Library Preview` run `31303366732` 成功。
- Preview repository `main`: `575023323a8212e1779c691de1d2996c3304ad97`。`Deploy Hado Library Preview` run `31303384185` 成功。
- Preview marker: `PREVIEW_SOURCE_COMMIT.txt=3e715a233cc4364ac7a6e7bd0a17e5901bc3e0aa`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.0.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.0.1.0 Update11.1`。
- 公開URL: https://mytemark2.github.io/hado_library-preview/ 。表示版、必須runtime・派生JSON、`技能:練兵` の武将5件・装備5件、状態変化「攻撃上昇」とのAND 5件、同一行配置、cache key、Debug Log、console error 0件を確認した。
- 最小受入操作: 武将カテゴリで `技能:練兵` を設定し、越吉・曹真・関索・曹洪・関興の5件が表示されることを確認する。
- 残課題: none。

## 状態

完了。実装、ローカル検証、Pull Request、Actions、イベント駆動Preview同期、公開URL実操作を確認済み。

## 変更概要

- 表示版: `3.0.1.0 Update11 r160`。
- タググループ: 対象カテゴリをbadge表示し、検索カテゴリ順へ統一した。
- 状態変化検索: 状態変化とタグ入口を同一行にし、タグによるAND絞り込みを同期・非同期の全検索経路へ追加した。
- 回帰防止: タグカテゴリ対応、表示順、状態変化検索、キャッシュ、モード復元、1行CSS、版数cache keyを専用回帰で固定した。

## HTMLサイズと外部化

- 変更前: 29,254 bytes。
- 変更後: 29,230 bytes（24 bytes減）。
- 差分は外部asset cache keyの更新のみ。動作とCSSは既存外部ファイルへ実装した。

## 検証

- `node tools/test_update11_tag_organization.js`: 成功。
- `node tools/test_update09_5_60_search_mode_isolation.js`: 成功。
- `node tools/test_json_index_contract.js`: 派生JSON 20件の契約成功。
- `python -X utf8 tools/validate_update_version_consistency.py`: 成功。
- `python -X utf8 tools/validate_external_css.py`: 成功。
- `python -X utf8 tools/validate_app_js.py`: 成功。
- `python -X utf8 tools/run_app_validation.py`: 124/124 成功。
- PC表示（1280px）: 状態変化2条件・リセット・タグ入口が同一行、横overflowなし。
- スマートフォン表示（実効375px）: 同一行表示、タグpanelを含め横overflowなし。
- 実操作: 状態変化「攻撃上昇」363件にタグ「兵科:騎兵」を追加し82件へAND絞り込みされることを確認。
- タグ表示: 対象カテゴリbadge、カテゴリ順、選択済み条件のカテゴリ表示を確認。
- ブラウザconsole: error / warning なし。

## Git・Actions・Preview

- 基準ブランチ: `feature/app-3.0.0.0`。
- 基準commit: `5a06478461e756e41305c57e9b9b649f5fcb2fe4`。
- 作業ブランチ: `codex/update301-tag-organization`。
- 実装commit: `0ec6d719cc251d8e6254c5a2ef0d02b7f893960d`。
- Pull Request: [#266](https://github.com/mytemark2/hado_library/pull/266)（`feature/app-3.0.0.0`向け、merge済み）。
- 正本merge commit: `f127ca3d80682b032aa1a66e70ccbc1c8a2cc8e1`。
- `App Validation / app-validation`: run `30015078301`、成功。
- `Notify Hado Library Preview`: run `30015225348`、成功。
- `Deploy Hado Library Preview`: run `30015272034`、成功。

## Preview confirmation

- 公開URL: https://mytemark2.github.io/hado_library-preview/
- 表示版: `3.0.1.0 Update11 r160`。
- Preview repository `main`: `50fd95fc30c4052d4c0a8434cfb35329c743b624`。
- marker: `PREVIEW_SOURCE_COMMIT.txt=f127ca3d80682b032aa1a66e70ccbc1c8a2cc8e1`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.0.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.0.1.0 Update11`。
- 必須ファイル: `index.html`、`hado_formation.js`、`hado_styles.css`、`hadou_*.json`、`.nojekyll`、marker 3件を確認。
- DOM / asset: Update11のタイトル、状態変化検索、タグ入口、カテゴリbadge、`hado_search.js?v=11-r160`、`hado_styles.css?v=11-r160`を確認。
- 実操作: 公開版でも「攻撃上昇」363件に「兵科:騎兵」を追加して82件へAND絞り込み。PCの同一行配置とスマートフォン実効375pxの同一行・横overflowなしを確認。
- Debug Log / console: error / warning なし。
- 判定: PASS。

## 最小受入操作

1. 状態変化検索を開き、状態変化選択と「タグ」が同じ1行にあることを確認する。
2. 状態変化を1件選択し、対象カテゴリのタグを追加して結果が両条件のANDで減ることを確認する。
3. タグ一覧で各グループに「武将」「装備」「状態変化」などの対象カテゴリが表示され、カテゴリ順に並ぶことを確認する。
4. 通常検索、状態変化検索、型検索を切り替え、各モードのタグ条件が復元されることを確認する。

## 残課題

none
