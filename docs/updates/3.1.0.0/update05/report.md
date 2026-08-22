# 3.1.0.0 Update05 Report

## 状態

実装・ローカル検証完了。Pull Request、Actions、Preview同期、公開URL実操作後に完了結果を追記する。

## Summary

- 44 reviewed gold Clauseと24,329 generated Clauseのtrust境界を分離した。
- 現在編成を共通Evaluatorへ接続し、条件タブへ5状態を表示した。
- 戦闘中/任命/未reviewedを推測で成立・不成立へしない。
- 評価結果を保存schemaへ追加しない。
- Crawler PR #19を`feature/crawler-1.1.0.0`へマージし、確定Commit `ec92bbc6fb7f22a62b51776c36d1ed8209784d72`から全21派生JSONを一括反映した。
- 初回Preview同期で新規CSSが転送対象外だったため、`hado_*.css`を包括する恒久同期契約へ修正し、r176へ更新した。

## Local validation

- App Validation: 139/139 合格。
- EffectClause生成・契約・検索回帰: 合格。
- 21派生JSONの全件再生成・決定性check: 合格。
- Update05専用回帰: 44 reviewed cases / 5 states / representative formation facts 合格。

## 確認事項

なし。未実施のUpdate04は戦法・技能詳細UIで、Update05と同じClause/Evaluator APIへ接続する。推奨エンジンはGPT-5.6 Sol / reasoning High。

## Remaining issues

リモート検証前。Update04の詳細consumerとの横断一致確認はUpdate04実施時に行う。
