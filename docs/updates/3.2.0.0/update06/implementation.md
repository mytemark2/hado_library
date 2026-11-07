# Update06 実装記録

## 実装

- `hado_share.js`: 共有専用の軍馬読み取りsnapshotを追加。保存データへ正規化を書き戻す `getCurrentWarhorseData()` はコピーに使用しない。
- 武将ごとの1行表示を維持し、参軍5枠、兵器/武装レベル、武装の異民族武将、軍馬能力・固有技能を文章へ追加。
- 通常技能は枠順で最大3件。軍馬3枠の空欄も明示。
- 部隊リンクは同じsnapshotを使用し、軍馬情報は参照専用の追加フィールド `warhorseReference` へ格納する。保存形式は変更しない。
- 受信確認画面で編成内容を展開表示し、軍馬登録・配置を変更しない旨を表示。不足参軍も既存の不足項目処理へ統合。
- schema v1の旧リンクを受け入れる。軍馬参照情報の欠落と未設定を区別する。無効dataと、受信できない上限超過リンクは生成・受信時に拒否する。
- `hado_share.css`: 共有確認の長文を折り返し表示。スマートフォンのボタンは44px以上で折返し可能。
- `hado_version.js`: Update06 r226へ更新。`index.html`と版依存回帰のキャッシュキーを `06-r226` に統一。

## 変更ファイル

実装 `hado_share.js`、表示 `hado_share.css`、版 `hado_version.js`、キャッシュ `index.html`、検証一覧 `tools/run_app_validation.py`、専用回帰 `tools/test_3_2_0_0_update06_formation_share.js`、既存版整合回帰、Update資料5件。

`HADO_DEV_INFO.json`、一次JSON、派生JSON、保存schemaは変更しない。

## HTMLと外部化

`index.html`はキャッシュキーのみ変更。Git正規化後28,954 bytes → 28,954 bytes、増減0。新しい動作は既存外部JavaScript、表示は既存外部CSSへ実装。

## 検証

専用回帰: 5枠の同一行表示、参軍、兵器/武装、軍馬3技能の枠順、名馬固有技能、凍結された入力に対するコピー・リンク生成、snapshot往復、確認/キャンセル、副作用なし、新規追加、既存部隊・軍馬保持、不足項目、HTML escape、旧リンク、上限を検証。

全App Validation 181/181に合格。専用UI fixture `tools/fixtures/3_2_0_0_update06_share_save.json` を通常Importから追加し、実画面で武将・侍従位置・装備の同一行、軍馬能力、枠順3技能、名馬固有技能をコピーできることを確認した。公開Previewは未完了。

## 確認事項

なし。
