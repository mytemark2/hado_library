# 3.1.0.0 Update05 Roadmap — 部隊編成の条件評価

## 目的

現在の部隊編成から判定可能なEffectClauseをUpdate02の共通Evaluatorで評価し、成立・不成立・戦闘中判定・対象外・判定不可の5状態を表示する。

## 実装条件

- 正本ブランチ: `feature/app-3.1.0.0`
- 実装起点Commit: `bcef465b96bd08f468ce0aaeada19d90b20ec761`
- Preview表示版: `3.1.0.0 Update05 r175`
- 推奨・使用エンジン: GPT-5.6 Sol / reasoning High
- ユーザー指示によりUpdate04を先行実施せずUpdate05へ進む。Update04の詳細UIは未実施として明示する。
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

同じClauseを詳細UIと編成判定で共有する最終ゲートは、未実施Update04の詳細consumer接続後に横断確認する。Update05では共通Clause/Evaluator APIを正本化し、編成側で独自自由文解析を追加しない。
