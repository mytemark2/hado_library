# 3.1.0.0 r201 状態変化検索のグループ別トレンド順 Report

## 1. Summary

状態変化検索の小項目順を、全分類共通の旧固定順から、6分類別の2026年8月トレンド順へ変更する。上位項目外は最新JSONの重複除外所有者数で並べ、データ更新へ追随する。

## 2. Bug classification and root cause

- 分類: 検索候補の優先順位設計不整合。
- 原因: 全分類で1つの固定配列を共有し、`攻撃上昇`など旧表示名が現在の`攻撃変化(強化)`等と一致しないため、大半の項目が文字コード順へ落ちていた。
- 恒久対策: 分類別アンカーを現行正規名で固定し、対象外を現行JSON所有者数で補完する。アンカーの存在・重複と実際の比較結果を全体検証へ追加する。

## 3. Impact scope checked

状態変化検索の6分類、小項目の全候補、JSON再読込、通常検索・型検索とのモード分離、PC・スマートフォン、検索結果・詳細、保存Export / Importを確認する。

## 4. Files changed

検索runtime、専用回帰、App Validation一覧、Preview revision・cache key、README、Roadmap、r201実装・報告記録。JSON、crawler、CSS、`HADO_DEV_INFO.json`は変更しない。

## 5. HTML size change and externalization decision

検証完了後に記録する。HTML構造は変更せず、既存外部`hado_search.js`へ統合する。

## 6. Validation commands executed

検証完了後に記録する。

## 7. Validation results

検証完了後に記録する。

## 8. Git commit and pull request

統合完了後に記録する。

## 9. GitHub Actions result

統合完了後に記録する。

## 10. Preview synchronization result

### Preview confirmation

同期・公開確認後に記録する。

## 11. Minimum user acceptance operation

公開Previewで「検索」→「状態変化検索」を開き、中項目を順に切り替えて先頭候補を確認する。

## 12. Remaining issues

検証完了後に記録する。

## 確認事項

検証完了後に記録する。正式公開は利用者の明示承認まで行わない。
