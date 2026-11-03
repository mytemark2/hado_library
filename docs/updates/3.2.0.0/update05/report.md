# 3.2.0.0 Update05 完了報告

## 1. Summary

Update05 r225を完了した。r224公開確認で残った内部スクロール不成立を、PCの詳細欄直接スクロールとスマートフォンの文書スクロールへ分けて解消した。公開PreviewでPC・390×844とも一致語が表示領域内へ移動し、内蔵検証とconsole確認まで合格した。Update06は開始していない。

## 2. Bug classification and root cause

- 分類: 検索一致ナビゲーションの実装欠落および受入テスト不足。
- 原因: r223までは再描画後の一致語スクロール自体がなかった。r224は内部スクロール領域内のインライン要素へ `scrollIntoView` を呼ぶだけで、詳細欄自身のスクロール結果を制御しなかった。回帰テストもAPI呼出しだけをモック確認し、実スクロール量を契約化していなかった。
- 恒久対策: 対象タブ内の一致語を完全一致優先で特定し、PCでは詳細欄と一致語の実座標から中央位置を計算して詳細欄を即時スクロールする。描画フレームと0msタイマーを排他的に併用して背景タブの遅延を避け、スマートフォンでは文書スクロールへ切り替える。位置認知は青い強調表示で補い、両経路のスクロール先をApp Validationで検証し、公開URLで `scrollTop` と可視範囲を測定する。

## 3. Impact scope checked

武将詳細、技能詳細、通常キーワード検索、検索結果選択、別タブからの一致箇所移動、PC内部スクロール、スマートフォン文書スクロール、折り畳み内一致、操作履歴、技能レベル切替、参照技能、部隊編成共通技能表示、一次・派生JSON契約、版・キャッシュ整合、保存互換、Export / Importを確認した。

## 4. Files changed

- 実装: `hado_core.js`、`hado_search.js`、`hado_status_effects.js`、`hado_formation.js`、`hado_bootstrap.js`
- 表示: `hado_styles.css`
- 版・キャッシュ: `hado_version.js`、`HADO_DEV_INFO.json`、`index.html`
- Update記録: `docs/updates/README.md`、`docs/updates/3.2.0.0/roadmap.md`、`docs/updates/3.2.0.0/update05/{roadmap,implementation,report}.md`
- 回帰: `tools/test_3_2_0_0_keyword_match_reason.js`、`tools/test_3_2_0_0_update05_detail_hierarchy.js`、`tools/test_3_2_0_0_update05_match_scroll.js`、関連する現行版・参照技能回帰
- 一次JSON・派生JSON: 変更なし

## 5. HTML size change and externalization decision

- `index.html`: Git正規化後 28,954 bytes → 28,954 bytes（0 bytes）。キャッシュ識別子のみ変更した。
- 動作とスタイルは既存の外部ファイルへ実装した。

## 6. Validation commands executed

- `node --check hado_core.js`
- `node --check hado_version.js`
- `node tools/test_3_2_0_0_keyword_match_reason.js`
- `node tools/test_3_2_0_0_update05_detail_hierarchy.js`
- `node tools/test_3_2_0_0_update05_match_scroll.js`
- `node tools/test_3_1_0_0_update06_referenced_skill_cards.js`
- `python tools/run_app_validation.py`
- `python tools/check_pr_merge_readiness.py --base feature/app-3.2.0.0`
- `git diff --check`

## 7. Validation results

r224はApp Validation 180/180とGitHub Actionsに合格したが、公開PC実操作で不合格。r225はローカルApp Validation 180/180、PR App Validation、専用スクロール回帰、JavaScript/JSON/HTML/asset/version整合、派生JSON契約、保存Export / Import往復、検索・詳細・編成回帰に合格した。公開PreviewではPC `scrollTop 0 → 2172`、スマートフォン390×844の文書スクロール `1213 → 4099`、一致語可視、横はみ出し0を確認した。

## 8. Git commit and pull request

- r220: PR #408、実装commit `51e1c3e36fdbeb4eaa69d95e2d1ee4eb670e5da1`、merge commit `9dfa0314de58f09efc83a39b0e9079bb48c1c67a`
- r221: PR #409、実装commit `8abda0cc2c2c778ce0e95da5518a9664d6967876`、merge commit `e69c894bf5647df5d8203fd67a31a0b2da3efd8a`
- r222: PR #410、実装commit `e95eeb646b103481d09d3a673d172e729de6cbd4`、merge commit `4bb2f726797cfd53dfa2ba6791e2c70c25e5711d`
- r223: PR #411、実装commit `76a24ccc25fa50d0f7b83bb55efe6deca336e3d0`、merge commit `b9bc7d531b859793e8ba314f9e49b76a6d22323e`
- PR #411 base: `feature/app-3.2.0.0`、merge-readiness base `4bb2f726797cfd53dfa2ba6791e2c70c25e5711d`、head `76a24ccc25fa50d0f7b83bb55efe6deca336e3d0`、競合なし
- r224: PR #413、実装commit `d6697758442622dbbbe8570030b45ea4a1932d95`、merge commit `ada7c2b9f11afe46fa3eefdbd65c49c028ed1ef8`。merge-readiness base `d35a49c2f565a99b638c363a2f0380035a3dcf06`、競合なし。
- r225: PR #414、実装commit `4b0f9dff5ff6b79cb47091b9e26adc9ae8e6e39d`、merge commit `a8f6dc9f00b778e090aa81cf14ba9ca698143b53`。merge-readiness base `ada7c2b9f11afe46fa3eefdbd65c49c028ed1ef8`、競合なし。

## 9. GitHub Actions result

- PR #411 App Validation: run `41438712893`、成功（1分5秒）
- Preview同期: run `41438904971`、成功（1分38秒）
- 同期方式: `feature/app-3.2.0.0` へのpush起点。手動workflow dispatchおよび定期pollingは不使用。
- r224 PR #413 App Validation: run `41571144194`、成功（1分16秒）
- r224 Preview同期: run `41571316403`、成功（1分42秒）
- r225 PR #414 App Validation: run `41573574419`、成功（1分3秒）
- r225 Preview同期: run `41573705561`、成功（1分31秒）

## 10. Preview synchronization result

### Preview confirmation

- r225状態: **合格**
- 公開URL: `https://mytemark2.github.io/hado_library-preview/?v=05-r225&source=a8f6dc9f`
- 表示版: `3.2.0.0 Update05 r225`
- アプリ正本: branch `feature/app-3.2.0.0` / commit `a8f6dc9f00b778e090aa81cf14ba9ca698143b53`
- Previewリポジトリ: `main` / commit `73ed725668526cd121bb1779af42c9bba320b61b`
- marker: source commit `a8f6dc9f00b778e090aa81cf14ba9ca698143b53` / source branch `feature/app-3.2.0.0` / display version `3.2.0.0 Update05 r225`
- r224公開URL: `https://mytemark2.github.io/hado_library-preview/?v=05-r224&source=ada7c2b9`
- r224表示版: `3.2.0.0 Update05 r224`
- r224アプリ正本: branch `feature/app-3.2.0.0` / commit `ada7c2b9f11afe46fa3eefdbd65c49c028ed1ef8`
- r224 Previewリポジトリ: `main` / commit `6f14e5e50e4b165e2046415019f13a55baaafaee`
- r224 marker: source commit `ada7c2b9f11afe46fa3eefdbd65c49c028ed1ef8` / source branch `feature/app-3.2.0.0` / display version `3.2.0.0 Update05 r224`
- 必須ファイル: `index.html`、`hado_formation.js`、`hado_styles.css`、`.nojekyll`、3 marker、`hadou_*.json` 36件を確認。
- 起動件数: 武将499 / 戦法458 / 技能1480 / 兵科技能5 / 装備268 / 状態変化214 / 兵器6 / 武装18 / 専用技能32 / 陣形22 / 軍馬5 / 軍馬技能27。
- r224不合格操作: `奮檄`検索後に概要タブへ移動し「一致箇所を表示」を押すと技能タブと強調クラスは切り替わったが、詳細欄は `clientHeight=226`、`scrollHeight=3157`、`scrollTop=0`、一致語は表示領域外だった。
- r225 PC操作: 1280×720、技能タブへ移動し、詳細欄 `clientHeight=226`、`scrollHeight=3157`、`scrollTop 0 → 2172`、`奮檄` は詳細欄内に表示、強調クラス付与、横はみ出し0。
- r225スマートフォン操作: 390×844、技能タブへ移動し、文書スクロール `1213 → 4099`、`奮檄` は画面内（上端474.9px、下端495.9px）、横はみ出し0。
- 参照技能: `轟名` は1件、技能タブを表示し、`data-referenced-from="轟名"` 付きカード2件、`轟天` と `盟主` を確認。
- 内蔵検証: OK、重大失敗0、警告0、情報0（context `manual-button`）。
- debug / console: ブラウザー警告・エラー0件。

## 11. Minimum user acceptance operation

公開Previewで次を実施し、すべて合格した。

- `轟名` 検索でLR袁紹の技能タブと一致理由が最初から表示される。
- `強盛莫敵` 検索でLR袁紹の戦法タブと一致理由が最初から表示される。
- `轟天Lv3` と `盟主Lv2` が親技能と同一階層に並び、付与元が分かる。
- PC・スマートフォンで横はみ出しがなく、スマートフォンの主要操作が44px以上である。
- 内蔵検証が重大失敗0・警告0で完了する。
- `奮檄`検索後に別タブへ移動し、「一致箇所を表示」で技能タブ内の`奮檄`が表示領域内へスクロールされることをPC・スマートフォンで確認する。

## 12. Remaining issues

なし。Update06は未開始。Production・正式版・`main` は別途承認を得るまで変更しない。

## 13. 確認事項

なし。
