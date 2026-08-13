# 正式版データ反映フロー

## 目的

Previewで確認済みのデータ一式だけを、ChatGPTデスクトップアプリ上の利用者による実行単位の明示承認後に正式版 `main` へ反映する。定期処理、Windowsタスクスケジューラ、crawler CLIに正式版の自動反映経路は設けない。

## 反映前の必須確認

1. Preview marker の `PREVIEW_SOURCE_COMMIT.txt`、`PREVIEW_SOURCE_BRANCH.txt`、`PREVIEW_DISPLAY_VERSION.txt` を確認する。
2. `hadou_meta.json` の `dataUpdatedAt`、`dataUpdatedAtJst`、`runId`、`sourceCommit` を確認する。`sourceCommit` はPreview markerと一致しなければならない。
3. crawler の `run-report.json` で、一次JSON・戦法JSON・派生JSONの生成と検証完了日時、主要件数、差分件数を確認する。
4. App の `Notify Hado Library Preview` と Preview の `Deploy Hado Library Preview` が成功し、公開URLでPreview確認済みであることを確認する。
5. 正式版 `main` の最新HEAD、既存のPR、`main` に対するApp Validation、ロールバック候補となる直前の `main` commitを記録する。

## 承認ゲート

上記をChatGPTデスクトップアプリで提示した後、利用者が対象commitを明示して次の文言で承認した場合だけ進める。

`<対象commit> の正式版反映を承認します`

承認前は、正式版リポジトリへのcommit、push、merge、デプロイを実行しない。再クロール、再生成、別commitへの差し替えも行わない。

## 実行方法

1. Previewの `sourceCommit` と同じ内容だけを、専用の正式版反映ブランチから `main` 向けPull Requestとして作成する。
2. `hado_version.js` は `formalRelease: true` とし、画面の表示版は4桁版のみとする。`revision` は内部識別子として保持してよいが、画面には表示しない。
3. `hadou_meta.json` の4項目と主要JSONのSHA-256・件数を再照合する。
4. `main` へのmerge後、App Validation結果と正式公開URLを確認する。`main` はPreview同期対象外のため、Previewを上書きしない。

## ロールバック

正式版に問題があれば、直前に記録した `main` の正常commitを基点に専用ロールバックPull Requestを作成する。履歴改変や強制pushは行わない。ロールバック後も正式公開URL、表示版、データ更新日、sourceCommit、主要JSON件数を確認する。
