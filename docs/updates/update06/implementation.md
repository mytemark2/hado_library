# Update06 Implementation

## 実装内容

### 候補トレイ
- 陣形を既存陣形設定処理へ接続
- 兵器を既存兵器設定処理へ接続
- 名馬を既存軍馬3枠割当処理へ接続
- 軍馬技能を保有軍馬探索後に既存軍馬3枠割当処理へ接続

### ファイル構成
- hado_candidate_tray.js
- hado_candidate_tray_core.js

へ統合実装した。

### 命名整理
誤って作成した

- hado_candidate_tray_update06.js

は削除した。

Update番号付きJSは今後作成しない。

### HTML肥大化対策
HTMLへの大規模追記は行わず、既存読込済みJSへ統合した。
