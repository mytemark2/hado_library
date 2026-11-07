# Update06 報告

## Summary

Update06 r226を完了した。部隊共有文章を拡充し、リンクから作成する前に内容を確認できるようにした。既存の2つのコピーボタンを維持し、コピー時の保存データ書換えを除去した。全検証と公開PC・スマートフォン実操作に合格。

## 不具合分類・原因・恒久対策

読み取り処理の副作用。共有処理が `getCurrentWarhorseData()` を呼び、軍馬の正規化結果を元の保存データへ代入していた。共有専用snapshotへ置換し、入力を凍結してコピーとリンク生成を実行する回帰で再発を防ぐ。不足参軍が従来の不足項目検査から漏れていたため、同じ検査へ追加した。

## 影響範囲と変更ファイル

部隊文章コピー・新規作成リンク、軍馬文章コピー、受信確認、旧リンク、保存互換、Export/Import。変更一覧とHTML増減0・外部化判断は [implementation](implementation.md) に記録。

## 検証コマンド・結果

- `node tools/test_3_2_0_0_update06_formation_share.js`: 合格
- `node --check hado_share.js`: 合格
- `python tools/run_app_validation.py`: 181/181合格（既存サンプル出力に必要な書込権限で実行）
- `python tools/check_pr_merge_readiness.py --base feature/app-3.2.0.0`: 合格、base `e0a08e5af2d5bb169f3e734a82336f29803d037f`、head `525bb59a41a8d19e5ef079ab33cea48510f82336`、競合なし
- `git diff --check`: 合格

## Git・Actions

開始正本HEAD `e0a08e5af2d5bb169f3e734a82336f29803d037f`。PR #416、実装commit `525bb59a41a8d19e5ef079ab33cea48510f82336`、開発正本merge `97bf37378071388701f0061400cf901d1ee8f19b`。

- PR base: `feature/app-3.2.0.0`、head `codex/3200-update06-formation-share`。関連変更のみ、競合なし。
- App Validation run `42357649835`: 成功（1分12秒）
- Notify Hado Library Preview run `42357948559`: push起点で自動実行、成功（1分16秒）

## Preview confirmation

**合格。** 同期・marker・公開実操作・内蔵検証まで確認済み。

- 公開URL: `https://mytemark2.github.io/hado_library-preview/?v=06-r226&source=97bf3737`
- 表示版: `3.2.0.0 Update06 r226`
- Preview HEAD: `966d13510354df8c958f7509ecabd81fe20f9536`
- source commit: `97bf37378071388701f0061400cf901d1ee8f19b`
- source branch: `feature/app-3.2.0.0`
- display version marker: `3.2.0.0 Update06 r226`
- 必須ファイル: `index.html`、`hado_formation.js`、`hado_styles.css`、`.nojekyll`、3 marker、`hadou_*.json`36件を確認。
- 起動件数: 武将499 / 戦法458 / 技能1480 / 兵科技能5 / 装備268 / 状態変化214 / 兵器6 / 武装18 / 専用技能32 / 陣形22 / 軍馬5 / 軍馬技能27。
- PC受信: 実際にコピーした圧縮 `share=d.` リンクで確認画面を表示。参照軍馬の3技能Lv1/2/3・能力・固有技能を含む全文が送信元のコピー文章と一致。
- PC新規作成: 部隊3 → 4件、既存3部隊を保持。武将・侍従右下・装備3種を引き継ぎ、登録軍馬・配置を変更しない旨を確認。受信側は保存データ未作成のまま、新規部隊のみ追加。
- 公開文章コピー: 主将LR袁紹・侍従UR袁紹（右下）・武器鋒利典雅剣・防具孤月照耀兜・文物江淮水利灌漑図を同一行へ出力。受信側の軍馬未設定3枠を正しく表示。
- 390×844: PCと同一のコピー文章、横はみ出し0、共有ボタン2つは高さ44px。共有受信確認画面もカード横はみ出し0、キャンセル/新規作成は44px。キャンセル後の部隊数4件を保持。新規作成で4→5件となり、既存部隊を保持した。
- 内蔵検証: OK、context `manual-button`、重大0・警告0・情報0。
- debug log/console: 警告・エラー0件。共有処理の例外なし。

## 最小受入操作

PC・スマートフォンで部隊の「編成共有コピー」を押し、武将・侍従位置・装備を確認。軍馬3技能とレベルはローカルの通常Import済み保存データから実コピーし、同じ文章が公開共有リンクの確認画面へ表示されることを照合した。新規部隊作成リンクを開き、キャンセル後は件数不変、新規作成後は部隊のみ1件増え、既存部隊と軍馬配置を保持することを確認済み。利用者側の必須追加確認はなし。

## 残件

なし。Update07未開始。正式版・Production・mainは未変更。

## 確認事項

なし。
