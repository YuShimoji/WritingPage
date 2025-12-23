# Issues（docs同期用 / SSOTバックログ）

このファイルは、GitHub Actions の「Reusable Sync Issues from docs」ワークフロー（`.github/workflows/sync-issues.yml`）で読み取られ、各セクション（`##` 見出し）ごとに GitHub Issue を作成/更新します。

- 更新の基本: 見出しタイトルを変えなければ同じIssueが更新されます
- 削除の扱い: ここから削除された見出しは、`managed:docs-sync` ラベル付きの既存Issueが自動でクローズされます
- 実行方法: `docs/ISSUES.md` 更新時に自動実行（mainのみ）し、必要なら手動実行（workflow_dispatch）もできます

---

## 1) docs/ISSUES.md 運用の定着（このファイルのテンプレ整備）

### Goal（目的）

- docs起点のバックログ管理（Issue同期）をチーム運用として定着させる

### DoD（受入基準）

- [ ] 本ファイルの運用ルール（命名、更新、削除の扱い）が簡潔に記載されている
- [ ] Actionsから自動実行（push）または手動実行（workflow_dispatch）でIssue同期ができる

### Note（補足）

- `.github/workflows/sync-issues.yml` は `docs/ISSUES.md` 更新時に自動実行（push）し、必要なら手動実行（workflow_dispatch）もできます

## 2) README に Issue 同期（docs/ISSUES.md）運用の導線を追加

### Goal（目的）

- 「どこにバックログを書けばよいか」をREADMEから辿れるようにする

### DoD（受入基準）

- [ ] READMEのどこかに `docs/ISSUES.md` と同期ワークフローの存在が記載されている
- [ ] 「更新→Actions実行→Issue反映」の最小手順が分かる

## 3) sync-issues.yml のラベル運用を柔軟化（任意）

### Goal（目的）

- リポジトリ/チームごとのラベル体系に合わせやすくする

### DoD（受入基準）

- [ ] 既定ラベル（`managed:docs-sync` 等）を入力（workflow_dispatch inputs）や変数で上書きできる
- [ ] 上書きしない場合は現状互換で動く
