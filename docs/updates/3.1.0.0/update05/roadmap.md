# 3.1.0.0 Update05 Roadmap — 部隊編成の条件評価

## 状態

`3.1.0.0 Update05 r178`は完了。実装、App Validation、Actions、Preview同期、公開URLのPC・スマートフォン実操作に加え、2026-08-23に利用者が`file://`の最小確認を合格した。正式公開は行わない。

## 目的

現在の部隊編成から判定可能なEffectClauseをUpdate02の共通Evaluatorで評価し、成立・不成立・戦闘中判定・対象外・判定不可の5状態を表示する。

## 実装条件

- 正本ブランチ: `feature/app-3.1.0.0`
- 再開起点Commit: `75c1636e5817054a8810a46bb045a873ac22ea36`
- Preview表示版: `3.1.0.0 Update05 r178`
- 推奨・使用エンジン: GPT-5.6 Sol / reasoning High
- ユーザー指示どおりUpdate04を先に完了し、Update05を最新正本へ載せ直して再開した。
- `formalRelease: false`を維持し、正式公開・本番昇格は行わない。

## 実施内容

1. Update03全件パーサーの近似Clauseと、Update02で人手確認した44 gold Clauseをtrust境界で分離する。
2. 44 reviewed Clauseをアプリruntimeへ読み込み、現在編成の主将・副将・補佐・侍従、兵科、好相性、武将集合、編制時能力値、兵器編制、将星をfactへ変換する。
3. 現在兵力、敵能力比較、ライブ状態変化、戦闘triggerは戦闘中判定とする。
4. 任命contextは対象外、未reviewed生成Clauseは推測せず判定不可とする。
5. 条件タブで5状態の件数とreviewed判定根拠を表示する。
6. 評価結果を保存schema、Export、Importへ追加せず、編成と最新Clauseから都度再計算する。

## 完了ゲート

- 44 reviewed Clauseが正式fixtureと構造一致し、近似生成Clauseをreviewedへ昇格しない。
- 5状態とAND/OR優先規則の専用回帰が合格する。
- 主将/補佐、能力値閾値、兵器有無、戦闘trigger、任命contextの代表ケースが合格する。
- 保存schemaとExport/Importが不変である。
- PC/390x844、file/https相当、全App Validation、Actions、Preview marker、公開Preview操作が合格する。

## Update04との関係

Update04の詳細consumerとUpdate05の編成判定は、同じ`hado_formation_condition_evaluator.js`とreviewed Clause索引を共有する。Update05では編成側に独自自由文解析を追加せず、表示と判定の横断一致を回帰・実ブラウザで確認する。

## 確認事項

なし。Update05完了後はUpdate06の通常検索・状態変化検索統合へ進む。推奨エンジンはGPT-5.6 Sol / reasoning High。
