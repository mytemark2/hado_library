# 3.2.0.0 Update05 完了報告

## 1. Summary

Update05 r219は技術検証には合格したが、利用者確認で操作性低下が判明したため完了扱いを取り消した。r220で利用者導線を修正し、r221で画面内の一致元を優先した。r221公開Previewで固有名だけの技能・戦法節が概要へ誤分類される残件を検出し、r222で所有技能表と戦法名による分類を追加した。Update06は開始していない。

## 2. Bug classification and root cause

- 分類: 利用者動線・情報優先順位の設計不整合、および一致元優先順位の実装不備。
- 原因: 情報の出所順を利用者の確認順と誤認した。さらに一致先判定を見出しの一般語に依存し、`轟名`のような固有名見出しを所有技能へ結び付けていなかった。
- 恒久対策: 固定タブ順と初期表示を分離し、画面に表示できる節・表を優先する。固有名見出しは所有技能表と戦法名へ照合し、一般語を含まない実データ名も分類する。要約衝突と固有名節の両fixtureを維持する。

## 3. Impact scope checked

武将詳細、技能詳細、通常キーワード検索、検索結果選択、詳細リンク、操作履歴、技能レベル切替、参照技能、部隊編成共通技能表示、保存互換、Export / Import、PC・スマートフォンを対象とする。

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

- `node --check hado_core.js hado_search.js hado_status_effects.js hado_formation.js hado_bootstrap.js`
- `node tools/test_3_2_0_0_keyword_match_reason.js`
- `node tools/test_3_2_0_0_update05_detail_hierarchy.js`
- `node tools/test_3_1_0_0_update06_referenced_skill_cards.js`
- `python tools/run_app_validation.py`
- `python tools/check_pr_merge_readiness.py --base feature/app-3.2.0.0`
- `git diff --check`

## 7. Validation results

r220とr221のApp Validation 179項目は合格したが、各公開実操作で残件を検出した。r222もApp Validation 179項目に合格し、固有名の戦法・技能節fixtureを含めた。PR、Actions、Preview実動作は未完了のため、現時点ではUpdate05を完了扱いにしない。

## 8. Git commit and pull request

未確定。検証後に記録する。

## 9. GitHub Actions result

未実行。

## 10. Preview synchronization result

未実行。公開Previewでの実操作確認完了までUpdate05は未完了。

## 11. Minimum user acceptance operation

- キーワードが戦法に一致する武将を開き、戦法タブと一致理由が最初から表示される。
- 技能に一致する武将を開き、技能タブと一致理由が最初から表示される。
- `LR袁紹 → 轟名` で、`轟天Lv3` と `盟主Lv2` が親技能と同一階層に並び、付与元が分かる。
- PC・スマートフォンで重要情報が初期表示範囲に入り、横はみ出しがない。

## 12. Remaining issues

r222のPR、Actions、Preview同期、公開実操作確認が残っている。

## 13. 確認事項

なし。
