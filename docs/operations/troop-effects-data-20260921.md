# 兵科効果データ・アプリ側引継ぎ

利用者の依頼により、クローラー収集とPreview/Productionのデータ反映だけを実施。表示・部隊編制計算は別タスク。アプリの実行コード、版数、workflowを変更しない。

## データ契約

`hadou_generals.json.troop_effects` を追加。既存 `items` 494件と `meta` はそのまま。

- schema_version: 1
- scope: commanders-troop-type（部隊の主将兵科に対応する共有データ）
- items[].troop_type: 騎兵 / 弓兵 / 工兵 / 盾兵 / 歩兵
- items[].grant_text: 武将記事の兵科効果行の原文
- items[].effects[]: name, description, sources[]
- sources[]: url, collected_at（UTC ISO）, method=rendered-tooltip
- items[].source_urls: 同じ兵科効果行を確認した武将記事一覧

騎兵=走撃、弓兵=射襲、工兵=操器、盾兵=列盾、歩兵=反槍。武将固有技能や通常状態変化への自動分類は行っていない。アプリ改修時は主将の兵科で適用し、副将・補佐分を重複加算しない。

## 収集・検証

run `2026-09-21T04-05-02-781Z`。基準Preview feature/app-3.1.1.0 / 3828dddd261f6b53510c53a40cff3f4377a4d0ac。既存494武将の表を照合、代表5記事の通常表示tooltipを取得。新規武将・装備等の全件再クロールなし。5兵科/5説明、欠落・不一致0。最終収集コードでも5記事の付与条件と説明が候補JSONと一致することを確認。

Previewの21派生JSON生成、bundle manifest、JSON契約、166アプリ検証が成功。データ全体の取得日時は 2026-09-20 18:57:41 JST のまま、兵科説明の取得日時は各sourcesに記録。

## 確認事項

工兵の詳細表は「出陣時」、編制解説577694は「交戦開始時」で不一致。本データは詳細表の原文を保持し、解説記事を根拠に書き換えていない。アプリで発動計算を実装する前に確認する。

今回のデータ追加だけでは画面に新しい兵科技能表示は出ない。既存206状態変化は維持。公開版へは同じ確定JSON一式だけを昇格し、開発中の3.1.1.0実装は混入させない。
