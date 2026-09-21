# 2026-09-20 取得データの公開版反映

## 対象と承認

利用者は2026-09-21に最新取得データのPreview・公開版反映を明示依頼。未確認の状態変化は別途回答予定のため今回は追加せず、206件を維持する。再クローリングは実施しない。

- 収集run: `2026-09-20T08-44-33-220Z`
- データ更新日: `2026-09-20 18:57:41 JST`
- 確定データPR: #367 / `4a9ef58bc483380d94c5579e2e379365928eeb43`
- Preview source branch: `feature/app-3.1.1.0`
- Preview source commit: `3828dddd261f6b53510c53a40cff3f4377a4d0ac`
- 公開版変更前main: `ecee951898e3c6f383712d45db046cd4ff7e5c4a`（ロールバック候補）
- Bundle: `4c4659e965640c6d7682f311eccf14d2d320106742eb8380764c932471243c83`

`hadou_meta.json.sourceCommit` は現CLIでは収集時の基準コミット `d98796e9fceeda55ce93be7b88ef37bdfcf6405a` を表す。Preview markerはデータPRのマージコミットを表すため値は異なる。確定データは変更せず、両方を記録して追跡する。

## 反映範囲

武将494（+4）、装備260（+5）、技能681（+16）、陣形22、戦法473、状態変化206。技能681は収集JSONの件数であり、画面の統合技能表示件数とは異なる。

一次・戦法・21派生JSON・メタデータ・bundle manifestを一体でコピー。アプリ監査JSONをmainの既存生成手順で同期。`index.html`、実行JS/CSS、`hado_version.js`、`HADO_DEV_INFO.json`、workflowは変更しない。公開版3.1.0.0を保持し、開発版3.1.1.0の新機能を混入させない。

## 検証

- 保存runのSHA-256とデータPRの28ファイルが一致（GitのLF表現）。
- Preview側 `python -X utf8 tools/run_app_validation.py`: 166コマンド成功。
- 公開Previewのsource markerとmanifest全30ファイルのサイズ・SHA-256一致。
- Preview UI: 武将494、装備260、新規武将4件の表示、瑞獣の硯の検索・詳細を確認。
- main側監査生成: `node tools/build_update01_condition_census.js`、`node tools/build_update02_condition_contract.js`。
- main側 `python -X utf8 tools/run_app_validation.py`: 163コマンド成功。
- 公開候補29ファイルが確定データPRのGit blobとバイト一致。残りの継承データも維持。
- 初回ローカル準備ではmanifest対象のみのコピーで戦法JSONが不足し、検証で検出。公開前にCLIの全公開ファイル一覧へ修正し、全163検証を再実行して成功。失敗候補のpush・公開はなし。

## 配信後の受入

main向けPRのApp Validation成功後に統合し、Production Pagesの成功、公開URLのmanifest・全JSONハッシュ、更新日時、新規武将/装備の表示を確認する。Previewはそのまま維持する。公開版反映の自動化は追加しない。

## 確認事項

未確認の状態変化追加・分類確定は今回の範囲外。全件再収集、既存データ削除、機能版更新、シャットダウンは行わない。
