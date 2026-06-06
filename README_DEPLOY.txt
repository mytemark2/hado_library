# 覇道ライブラリ GitHub Pages 配置手順

1. このZIPを展開します。
2. 展開された `index.html` と JSON 29件を、GitHub リポジトリ `mytemark2/hado_library` のルートへ上書き配置します。
3. GitHub Pages の公開URLを再読込します。

## ウェブ版の仕様
- 起動時に公開JSONを自動取得します。
- 手動JSONロード画面は表示しません。
- JSON取得失敗時は、手動選択ではなくページ再読込を案内します。
- ローカルHTML版では従来どおり手動JSON読込を利用できます。
