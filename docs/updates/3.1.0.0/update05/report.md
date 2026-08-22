# 3.1.0.0 Update05 Report

## 状態

Preview完了。実装、クローラ修正、21派生JSON再生成、App Validation、Pull Request、Actions、Preview同期、公開URL実操作はすべて合格した。`file://`の最小利用者確認を残す。

## Summary

- 44 reviewed gold Clauseと24,329 generated Clauseのtrust境界を分離した。
- 現在編成を共通Evaluatorへ接続し、条件タブへ5状態を表示した。
- 戦闘中/任命/未reviewedを推測で成立・不成立へしない。
- 評価結果を保存schemaへ追加しない。
- Crawler PR #20を`feature/crawler-1.1.0.0`へマージし、確定Commit `ec10b7979faa93dd8a5a45bd978a8ebe818b0e50`の1.1.0.6から全21派生JSONを一括再生成した。
- LR司馬師の正本どおり「退勢」を関連リンク代表回帰へ含め、`representativeRegression`と`legacyEquivalence`を合格へ戻した。
- Update04の詳細表示とUpdate05の編成判定が同じClause/Evaluator索引を共有する状態で再開した。
- 初回Preview同期で新規CSSが転送対象外だったため、`hado_*.css`を包括する恒久同期契約へ修正し、r176へ更新した。

## Bug classification and root cause

- 分類: 派生JSONの代表回帰期待値の陳腐化。
- 原因: LR司馬師の正本へ「退勢」が追加された後も、旧2件の期待値が残っていた。
- 影響: 正しい関連リンクJSONがローカル厳格監査で誤ってNGになった。
- 恒久対策: クローラ生成元の期待値と回帰テストを正本3件へ更新し、全21ファイルを一括再生成した。

## Files changed

- `hadou_*.json`: クローラ1.1.0.6から生成した21ファイル。
- `hado_version.js`, `HADO_DEV_INFO.json`, `index.html`: `3.1.0.0 Update05 r178`とキャッシュキー。
- README、全体Roadmap、Update05 Roadmap・実装記録・本報告。

## HTML size and externalization

- `index.html`はキャッシュキーのみ同じ長さで更新するため、Update04完了版から0 bytes。
- Update05のロジックは既存の外部`hado_formation_condition_evaluator.js`と`hado_formation.js`、表示は外部`hado_update05.css`を継続利用し、HTML内へロジックを追加しない。

## Local validation

- クローラ単体回帰: 合格。
- クローラ決定性check: 21ファイル、JSON contract 10 / 10 合格。
- 関連リンク厳格監査: 全項目合格。
- EffectClause生成・契約・検索回帰: 合格。
- 21派生JSONの全件再生成・決定性check: 合格。
- Update05専用回帰: 44 reviewed cases / 5 states / representative formation facts 合格。

- App Validation: 140 / 140 PASS。
- PC実ブラウザ: LR袁紹を主将へ登録し、成立3、不成立0、戦闘中判定1、対象外0、判定不可14を確認した。
- PC条件行: 935 / 935 px、横あふれなし。
- スマートフォン390 x 844: 条件shell 316 / 316 px、各行310 / 310 px、横あふれなし。
- 条件欄のLR袁紹リンクから詳細へ遷移し、Update04の4件表示と700%複合条件を同じデータで確認した。
- ブラウザerror / warningログ: 0件。
- `file://`実ブラウザ操作はブラウザのURL安全制約により自動化不可。構文、起動分岐、JSON読込、保存Export / ImportはApp Validationで確認し、最小利用者確認へ残す。

## Git and Preview

- Crawler PR: #20、merge commit `ec10b7979faa93dd8a5a45bd978a8ebe818b0e50`。
- App実装commit: `292c02860f8b7950c044250c77955355f1f269f9`。
- App PR: #302、merge commit `b0c0bde733431942972da76d28d7824f89553185`。
- merge-readiness: base `75c1636e5817054a8810a46bb045a873ac22ea36`へ競合なし、PASS。
- `App Validation / app-validation`: PASS。run `32606018322`、job `97111062651`。
- `Notify Hado Library Preview`: PASS。run `32606038756`、job `97111109543`、1分29秒。

### Preview confirmation

- 状態: PASS、Preview完了。
- 公開URL: `https://mytemark2.github.io/hado_library-preview/`
- 表示版: `3.1.0.0 Update05 r178`
- app branch / HEAD: `feature/app-3.1.0.0` / `b0c0bde733431942972da76d28d7824f89553185`
- preview repository / HEAD: `mytemark2/hado_library-preview` / `e782938fe28bf61afd5e89a723948cef58d5106d`
- `PREVIEW_SOURCE_COMMIT.txt`: `b0c0bde733431942972da76d28d7824f89553185`
- `PREVIEW_SOURCE_BRANCH.txt`: `feature/app-3.1.0.0`
- `PREVIEW_DISPLAY_VERSION.txt`: `3.1.0.0 Update05 r178`
- 必須ファイル: `index.html`, `hado_formation.js`, `hado_styles.css`, Update04/05 CSS、detail presenter、formation evaluator、`.nojekyll`、3マーカー、`hadou_*.json`を確認した。
- 操作: 既存部隊を上書きせず検証用部隊を新規作成し、LR袁紹を主将へ登録した。
- 5状態: 成立3、不成立0、戦闘中判定1、対象外0、判定不可14。reviewed 44 / Clause 24329。
- PC: 条件shell 941 / 941 px、横あふれなし。
- スマートフォン390 x 844: shell 316 / 316 px、各行310 / 310 px、横あふれなし。
- 横断確認: 条件欄からLR袁紹詳細へ遷移し、Update04の4件と700%複合条件を確認した。
- debug log: error / warning 0件。

## Minimum user acceptance operation

ローカルの`index.html`を直接開き、JSONフォルダを読み込んだ後、LR袁紹を主将にした部隊の「条件」で「成立3」「戦闘中判定1」「判定不可14」が表示され、JSON監査エラーが出ないことを確認する。

## 確認事項

1件。上記`file://`の最小利用者確認をお願いする。公開PreviewはCodex側で確認する。確認後はUpdate06の通常検索・状態変化検索統合へ進む。推奨エンジンはGPT-5.6 Sol / reasoning High。

## Remaining issues

`file://`の最小利用者確認1件。Preview側の残件はなし。
