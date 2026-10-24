# Update02 実装記録

## 基準

- アプリ正本: `feature/app-3.2.0.0` / `abd1d390a4785e420fb430396df588940fb9d34a`
- クローラー基準: `feature/crawler-1.1.0.0` / `f5d652700061d01af2f0026509d09934afe17a26`
- クローラー生成元確定: PR #39 / head `41b93692ac150e02bc12850b8f280528463865ef` / merge `f0907fcc30fa2396ac8a14cc0ec6de73a04c2e9f`
- 隔離branch: `codex/3200-update02-troop-cross-search`、`codex/3200-update02-troop-tags`
- 一次データ再取得: なし。2026-10-17取得済み一式を再利用。
- 表示版: `3.2.0.0 Update02 r215`
- アプリ実装: PR #395 / head `a062aee443f7ca296c31de3ec55182264c01d957` / merge `a318201d687723f96eff485f901c31fc69f28bda`

## 不具合分類・根本原因

分類は派生タグ生成欠落と検索関係未接続。

1. クローラーの兵科抽出が最初に見つかった「兵科」セルを使い、新しい記事形式の見出し行 `兵科 / 列伝` を値として扱っていた。このため騎兵54、弓兵40、歩兵45のタグが欠落した。
2. 生成器とアプリの許可兵科が騎兵・歩兵・弓兵に固定され、工兵5、盾兵7を除外していた。
3. 兵科技能の検索行は5件存在したが、一次JSONの武将兵科との関係を保持せず、詳細から主将候補へ進めなかった。
4. 旧hotfixが派生JSONの `crawlerVersion` を `1.1.0.3` へ巻き戻していた。

## 恒久対策

- 武将自身の兵科は `兵科` と `相性` を同じ行に持つセルを正本とし、`輸送` 行だけを限定fallbackにした。
- 5兵科を生成器とruntimeの共通受入対象にした。
- 生成時 `troopTypeAudit` で全武将数、兵科別件数、欠落を監査し、欠落時は品質ゲートを失敗させる。
- runtimeでも派生タグと一次セル由来タグを併合し、差分件数を診断へ残す。
- `hado_troop_skills.js` で5兵科技能と499主将候補を結び、検索語、結果カード、詳細リンク、コピーへ反映した。
- gold fixtureへ499件の安定article ID、名称、一次セルを固定した。

## データ関係

| 兵科 | 兵科技能 | 主将候補 |
|---|---|---:|
| 騎兵 | 走撃 | 160 |
| 歩兵 | 反槍 | 161 |
| 弓兵 | 射襲 | 166 |
| 盾兵 | 列盾 | 7 |
| 工兵 | 操器 | 5 |

合計499。兵科技能は「出陣時に自身1部隊へ付与」の兵科契約であり、通常技能の所有者索引へ混入させない。装備は兵科技能所有者として追加しない。

## 実装ファイル

- クローラー: `app.js`、版情報、hotfixメタデータ、生成ツール、タグ索引テスト。
- アプリ: `hado_troop_skills.js`、`hado_status_effects.js`、`hado_formation.js`、`hado_core.js`、`hado_search.js`、`hado_version.js`、`HADO_DEV_INFO.json`、`index.html`。
- データ: 生成元から作り直した21派生JSONと `hadou_bundle_manifest.json`。
- 回帰: `tools/test_3_2_0_0_update02_troop_cross_search.js`、`troop-cross-search-gold.json`、App Validation登録。

## HTMLサイズ・外部化

`index.html`はcache keyのみ更新し、論理サイズ差は0 bytes。検索関係ロジックは既存外部ファイル `hado_troop_skills.js` と `hado_status_effects.js` に実装し、HTMLへJavaScriptを追加していない。

## 確認事項

なし。2026-10-24に利用者が現行r215の `index.html` を `file://` で開き、同フォルダーのJSON読込、`工兵`検索、「操器」詳細、主将候補5名の表示が正常であることを確認した。正式公開は行わない。
