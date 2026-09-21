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

## 公開版への昇格記録

- 利用者は本タスクでデータのPreview・公開版反映を明示承認。
- Preview PR #369 / source commit ddafc592b077d003854617062ef3d179dd3de415 / branch feature/app-3.1.1.0。
- Preview repo e7178e8c66267b47fc10c90f40b62268943316cd、同期workflow 35560440805、Pages workflow 35560480168成功。
- 公開Previewの30 bundleファイルのSHA-256/サイズ、source marker一致。画面起動・494武将読込・LR馬超検索成功、console errorなし。Preview index.htmlは既存workflowがバナーを挿入するため元HTMLとの単純ハッシュ比較対象外。
- 確定bundle 8c95df3057f8bbafe451cd068080863e5f9a17ec71bfc6342b08d38d3f750a81。
- 公開版基準/ロールバック候補 a0b8d1c0bdfdafd33f0b8e4cca875d84bc06c858。実行コード3.1.0.0は維持。
- main側監査再生成、全163ローカル検証が成功。Preview確定JSON一式をコピーし、再クロール・アプリ再実装なし。
