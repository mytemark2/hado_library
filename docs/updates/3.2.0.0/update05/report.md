# 3.2.0.0 Update05 完了報告

## 1. Summary

Update05 r219は技術検証には合格したが、利用者確認で操作性低下が判明したため完了扱いを取り消した。r220で利用者導線、r221で画面内の一致元、r222で固有名節の分類を修正した。r222公開Previewの内蔵検証で旧実装文字列に依存した誤判定を検出し、r223で実際の選択関数を検証する方式へ変更した。r223のローカル回帰、PR、Actions、自動Preview同期、marker、公開実操作、内蔵検証がすべて合格したためUpdate05を完了する。Update06は開始していない。

## 2. Bug classification and root cause

- 分類: 利用者動線・情報優先順位の設計不整合、一致元優先順位の実装不備、および回帰検証の実装追従漏れ。
- 原因: 情報の出所順を利用者の確認順と誤認した。さらに一致先判定を見出しの一般語に依存し、`轟名`のような固有名見出しを所有技能へ結び付けていなかった。内蔵検証は関数文字列から旧実装断片を探していたため、実動作が正しくても失敗した。
- 恒久対策: 固定タブ順と初期表示を分離し、画面に表示できる節・表を優先する。固有名見出しは所有技能表と戦法名へ照合する。内蔵検証は実際の選択関数を実行し、関数文字列の部分一致へ依存しない。

## 3. Impact scope checked

武将詳細、技能詳細、通常キーワード検索、検索結果選択、詳細リンク、操作履歴、技能レベル切替、参照技能、部隊編成共通技能表示、一次・派生JSON契約、版・キャッシュ整合、保存互換、Export / Import、PC・スマートフォンを確認した。

## 4. Files changed

- 実装: `hado_core.js`、`hado_search.js`、`hado_status_effects.js`、`hado_formation.js`、`hado_bootstrap.js`
- 表示: `hado_styles.css`
- 版・キャッシュ: `hado_version.js`、`HADO_DEV_INFO.json`、`index.html`
- Update記録: `docs/updates/README.md`、`docs/updates/3.2.0.0/roadmap.md`、`docs/updates/3.2.0.0/update05/{roadmap,implementation,report}.md`
- 回帰: `tools/test_3_2_0_0_keyword_match_reason.js`、`tools/test_3_2_0_0_update05_detail_hierarchy.js`、関連する現行版・参照技能回帰
- 一次JSON・派生JSON: 変更なし

## 5. HTML size change and externalization decision

- `index.html`: Git正規化後 28,954 bytes → 28,954 bytes（0 bytes）。キャッシュ識別子のみ変更した。
- 動作とスタイルは既存の外部ファイルへ実装した。

## 6. Validation commands executed

- `node --check hado_core.js`
- `node --check hado_version.js`
- `node tools/test_3_2_0_0_keyword_match_reason.js`
- `node tools/test_3_2_0_0_update05_detail_hierarchy.js`
- `node tools/test_3_1_0_0_update06_referenced_skill_cards.js`
- `python tools/run_app_validation.py`
- `python tools/check_pr_merge_readiness.py --base feature/app-3.2.0.0`
- `git diff --check`

## 7. Validation results

r223はローカルApp Validation 179/179項目、Update05詳細階層回帰、キーワード一致理由、参照技能カード、保存Export / Import往復、派生JSON契約、`git diff --check` に合格した。GitHubのApp Validationも合格した。公開Previewの内蔵検証は重大失敗0・警告0・情報0だった。

## 8. Git commit and pull request

- r220: PR #408、実装commit `51e1c3e36fdbeb4eaa69d95e2d1ee4eb670e5da1`、merge commit `9dfa0314de58f09efc83a39b0e9079bb48c1c67a`
- r221: PR #409、実装commit `8abda0cc2c2c778ce0e95da5518a9664d6967876`、merge commit `e69c894bf5647df5d8203fd67a31a0b2da3efd8a`
- r222: PR #410、実装commit `e95eeb646b103481d09d3a673d172e729de6cbd4`、merge commit `4bb2f726797cfd53dfa2ba6791e2c70c25e5711d`
- r223: PR #411、実装commit `76a24ccc25fa50d0f7b83bb55efe6deca336e3d0`、merge commit `b9bc7d531b859793e8ba314f9e49b76a6d22323e`
- PR #411 base: `feature/app-3.2.0.0`、merge-readiness base `4bb2f726797cfd53dfa2ba6791e2c70c25e5711d`、head `76a24ccc25fa50d0f7b83bb55efe6deca336e3d0`、競合なし

## 9. GitHub Actions result

- PR #411 App Validation: run `41438712893`、成功（1分5秒）
- Preview同期: run `41438904971`、成功（1分38秒）
- 同期方式: `feature/app-3.2.0.0` へのpush起点。手動workflow dispatchおよび定期pollingは不使用。

## 10. Preview synchronization result

### Preview confirmation

- 状態: **PASS**
- 公開URL: `https://mytemark2.github.io/hado_library-preview/?v=05-r223&source=b9bc7d53`
- 表示版: `3.2.0.0 Update05 r223`
- アプリ正本: branch `feature/app-3.2.0.0` / commit `b9bc7d531b859793e8ba314f9e49b76a6d22323e`
- Previewリポジトリ: `main` / commit `31d6970b89f298123d21e2c25ae39c4a01c66429`
- marker: source commit `b9bc7d531b859793e8ba314f9e49b76a6d22323e` / source branch `feature/app-3.2.0.0` / display version `3.2.0.0 Update05 r223`
- 必須ファイル: `index.html`、`hado_formation.js`、`hado_styles.css`、`.nojekyll`、3 marker、`hadou_*.json` 36件を確認。
- 起動件数: 武将499 / 戦法458 / 技能1480 / 兵科技能5 / 装備268 / 状態変化214 / 兵器6 / 武装18 / 専用技能32 / 陣形22 / 軍馬5 / 軍馬技能27。
- DOM・操作: `轟名` は1件で技能タブを自動表示し、`轟天Lv3` と `盟主Lv2` を `data-referenced-from="轟名"` 付きで同一グリッドへ表示。旧入れ子グループ0件。`強盛莫敵` は1件で戦法タブを自動表示。一致理由と「一致箇所を表示」を確認。
- レスポンシブ: PC 1280×900、スマートフォン390×844ともページ横はみ出し0。スマートフォンの一致箇所ボタン高さ44px、参照技能カードの横はみ出し0。
- 内蔵検証: OK、重大失敗0、警告0、情報0。
- debug / console: ブラウザー警告・エラー0件。

## 11. Minimum user acceptance operation

公開Previewで次を実施し、すべて合格した。

- `轟名` 検索でLR袁紹の技能タブと一致理由が最初から表示される。
- `強盛莫敵` 検索でLR袁紹の戦法タブと一致理由が最初から表示される。
- `轟天Lv3` と `盟主Lv2` が親技能と同一階層に並び、付与元が分かる。
- PC・スマートフォンで横はみ出しがなく、スマートフォンの主要操作が44px以上である。
- 内蔵検証が重大失敗0・警告0で完了する。

## 12. Remaining issues

なし。Update06は未開始。Production・正式版・`main` は別途承認を得るまで変更しない。

## 13. 確認事項

なし。
