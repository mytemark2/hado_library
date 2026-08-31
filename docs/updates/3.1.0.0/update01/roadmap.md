# 3.1.0.0 Update01 Roadmap — 全件条件センサス

## 状態

完了。Preview同期元を3.1正本へ切り替え、全1,810件・45,929意味単位の条件センサスと44件のgold setを確定した。

## 目的

覇道ライブラリ3.1のCondition Registry / EffectClauseを設計する前に、現行正本に存在する戦法・技能・状態変化の特殊条件を全件監査する。

LR袁紹を設計基準にしない。LR袁紹は複数ある回帰ケースの1つとして扱う。

## 起点

- 開発ブランチ: `feature/app-3.1.0.0`
- 起点Commit: `1a5ce523053661c3b8d6a8fc5a295ef620196fe6`
- 起点表示版: `3.0.2.0 r170`
- Update01開始表示版: `3.1.0.0 Update01 r171`
- 実装環境: ChatGPTデスクトップアプリ Codex

## 監査母数

現行派生JSONのsourceCountsを基準に、少なくとも以下を全件確認する。

- 武将 486件
- 戦法 465件
- 技能 653件
- 状態変化 206件

件数はUpdate01実行開始時に最新正本で再取得し、増減があれば本記録へ反映する。

## 監査対象

1. 武将の戦法本文
2. 武将の技能本文
3. 独立技能マスター
4. 戦法マスター
5. 戦法・技能から参照される状態変化本体の効果説明
6. `hadou_effect_condition_blocks.json`
7. 条件抽出/派生JSON生成に関係するクローラー処理
8. 既存scoreEvidence、検索、状態変化関連リンク等の下流利用箇所

## 監査方式

### A. 全文を母集団にする

既知の条件語を含む文だけを抽出して終わらない。全戦法・全技能・関連状態変化を意味単位へ分割し、未分類残差を必ず出す。

### B. 現行condition blocksを診断材料として使う

現行`hadou_effect_condition_blocks.json`は、条件候補の探索、既存誤分類の把握、対象母数確認に利用する。

ただし現行実装は文字列マーカー中心であり、条件と後続効果の親子関係を保証しないため、そのまま3.1の意味モデルにはしない。

### C. 条件と効果の対応先まで確認する

次を区別する。

- 条件だけの文
- 発動契機だけの文
- 効果だけの文
- 条件付き効果
- 基礎効果に対する条件付きoverride
- 回数/期間/リセット
- 抑止/例外
- 対象選択優先
- 説明文/注記/ノイズ

## 必須成果物

Update01ではコード本体のUI改修より先に、監査成果物を作る。

最低限、次を残す。

1. 条件型一覧
2. trigger型一覧
3. context型一覧
4. modifier/base+override型一覧
5. limit/reset型一覧
6. suppression/exception型一覧
7. 未分類残差一覧
8. 現行condition blocks誤分類一覧
9. 現行condition blocks未抽出一覧
10. gold set 30〜50件以上
11. Condition Registry / EffectClause設計へ渡す要件一覧

## 必ず含める初期gold set

- LR袁紹: 主将、兵力50%以上、25→50、250→700、50→100
- LR馬良: 好相性、政治比例、敵知力比較、付与済み効果合算、副将1/副将2戦法、任命
- LR関平: 特定主将、騎兵、初回戦法まで、強化数、敵攻撃比較、会心攻撃時
- LR孫堅・盾兵: 編制時防御閾値、兵力50%以上、基礎威力固定条件、対象優先
- LR司馬昭: 指定4武将のうち1人以上、敵主将相性、通常攻撃直前、戦法攻撃直前、絶縁による抑止
- LR黄月英: 兵器編制・健在、兵器行動、好相性人数、敵知力比較

センサスで新しい条件型を発見した場合、その条件型の代表例をgold setへ追加する。

## 条件分類の初期候補

以下は仮分類であり、Update01完了前に固定しない。

- 配置
- 編成
- 兵科
- 武将属性
- 特定武将集合
- 好相性
- 編制時能力
- 兵器/装備等の編成物
- 現在兵力
- 能力比較
- 状態変化有無/個数
- 技能Lv
- 将星
- 人数
- 確率
- 出陣
- 交戦開始
- 戦法発動
- 通常攻撃
- 被攻撃/攻撃直前
- 会心/撃心
- 兵器行動
- 回数制限
- 期間終了条件
- 累積/リセット
- 発動抑止
- 対象優先
- 任命/非戦闘context

## Update01で仕様確定してはいけないもの

次は監査結果が揃うまで正式確定しない。

- EffectClauseの最終schema
- Condition Registryの全type
- 新規派生JSONのファイル名
- `hadou_effect_condition_blocks.json`を破壊的変更するか否か
- 編成Evaluatorの最終判定規則
- scoreEvidence切替方式

## 完了ゲート

Update01を完了扱いにする前に、すべて満たす。

- [x] 最新正本の母数を再確認した。
- [x] 対象母数と実走査件数が一致した。
- [x] 未走査武将が0件。
- [x] 未走査戦法が0件。
- [x] 未走査技能が0件。
- [x] 関連状態変化の未走査が0件。
- [x] 現行condition blocksを持たない戦法/技能を個別確認した。
- [x] 未確認残差が0件。
- [x] 条件型/trigger/context/modifier/limit/reset/suppressionの一覧を作成した。
- [x] 各条件型に代表例がある。
- [x] gold setを44件作成した。
- [x] 現行condition blocksの再利用可否と不足点を明文化した。
- [x] Update02でschemaを確定するための入力が揃った。

## Codex実装開始時の必須確認

1. `feature/app-3.1.0.0`の最新HEADを取得する。
2. `docs/updates/3.1.0.0/roadmap.md`を読む。
3. 本`update01/roadmap.md`を読む。
4. `hadou_effect_condition_blocks.json`の現物とクローラー生成関数を確認する。
5. `hadou_generals.json`、`hadou_tactics.json`、`hadou_skills.json`、`hadou_status_effects.json`の最新件数とhashを確認する。
6. 既存`scoreEvidence`、検索、状態変化関連索引の利用経路を確認する。
7. 監査ツールを追加する場合も、既存生成JSONを手修正しない。
8. queue式ソース変換や使い捨てworkflowを作らない。

## Update02への引き渡し条件

Update01の成果を根拠として、初めて正式なCondition Registry / EffectClause / Evaluator schemaを決定する。

「LR袁紹を正しく表現できる」ではなく、「現行正本で確認された全条件型を例外的な自由文パッチなしで表現できる」ことをUpdate02の設計基準とする。
