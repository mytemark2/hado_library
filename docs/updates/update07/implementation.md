# Update07 Implementation

## 実装内容

### 共通採点処理
- `hado_type_score.js` を新設した。
- 型ごとの先頭5項目を同一比率で採点し、1項目2点、最大10点とした。
- 技能Lvは加点回数へ影響させない。
- 兵力は通常の採点項目として維持した。
- Update08で所有情報フィルター後の候補にも同じ関数を再利用できる構造とした。

### 過剰一致の抑制
候補の特徴文に含まれやすい汎用語だけで点が入らないよう、次のような広すぎる別名を除外した。

- `有利変化`
- `強化効果`
- `味方部隊`
- `秒間`
- `不利変化`
- `弱化効果`
- `敵部隊`

代わりに、`味方バフ配布`、`味方対象部隊数`、`敵デバフ配布`、`敵対象部隊数`、`効果時間` などの採点項目固有の表現で判定する。

### 表示
- 型編成ナビの主将比較を `主将適合スコア: n/10` 表示へ変更した。
- 型候補一覧を `適合スコア: n/10` 表示へ変更した。
- 主軸型は `主軸理由`、補助型は `補助理由` として表示する。
- 0点候補は候補一覧へ表示しない。

### HTML肥大化対策
- HTMLへの追加は `hado_type_score.js` の読込宣言1行相当のみとした。
- HTML増減は `index.html` が **+102 bytes**、`hado_library_3.0.0.0.html` が **+102 bytes** である。
- 採点処理は外部JSへ分離した。
- 読込順は `hado_type_score.js` → `hado_type_entry.js` → `hado_type_candidates.js` とした。
- 相対パス読込のため、`file://` ローカル版と `https://` プレビュー版の双方で利用できる。

### 共通化後の整理
- `hado_type_entry.js` に残っていた旧 `METRIC_ALIASES`、`metricAliases`、`flatten` を削除した。
- 採点別名表の正本は `hado_type_score.js` のみに集約した。

### 再発防止
- `tools/validate_app_js.py` を新設した。
- ルート直下と `src/` 配下の全JSへ `node --check` を実行する。
- ルート直下JSONの構文と、`index.html` / `hado_library_3.0.0.0.html` の同一性も検証する。
### Update07.6 候補選択表示と役割限定条件対応
- `hado_type_candidates.js` で候補カードのクリック選択状態を表示し、同じ候補の再クリックで選択解除できるようにした。
- `hado_type_score.js` で `主将`、`副将`、`補佐`、`侍従` などの役割限定句を候補役割と照合し、役割不一致の句を採点対象から除外した。
- 技能Lv表記そのものを対象数などの数値採点に混入させず、該当役割で発動する句に含まれる効果量だけを採点するようにした。
- 型候補一覧へ候補トレイ追加ボタンを自動挿入していた `hado_candidate_tray_core.js` の処理を無効化し、既存ボタンが残っても削除するようにした。
- HTML増減は `index.html` 0 bytes、`hado_library_3.0.0.0.html` 0 bytes。
- 外部化判断: HTMLへ追記せず、既存責務の外部JSのみを変更した。

### Update07.6.1 プレビュー外部JSキャッシュ対策
- 原因調査の結果、プレビュー上のHTMLとメタ情報はUpdate07.6へ更新されていた一方、外部JSの `script src` がUpdate07.5以前と同一URLのままだったため、ブラウザまたはGitHub Pages側のキャッシュが旧JSを再利用し、候補選択UI・候補トレイ追加ボタン削除・役割限定句フィルタが画面へ反映されない可能性があった。
- `index.html` と `hado_library_3.0.0.0.html` の外部JS読込URLへ `?v=3.0.0.0-update07.6` を付与し、Update07.6のJSを確実に再取得させるようにした。
- HTML増減は `index.html` **+231 bytes**、`hado_library_3.0.0.0.html` **+231 bytes**。
- 外部化判断: 新規ロジックはHTMLへ追加せず、既存外部JSの読込URLだけを更新した。
- 読込順は `hado_type_score.js` → `hado_type_entry.js` → `hado_type_candidates.js` → `hado_candidate_tray_core.js` → `hado_candidate_tray.js` のまま維持した。
