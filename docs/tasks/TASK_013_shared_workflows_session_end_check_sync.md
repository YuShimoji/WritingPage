# Task: shared-workflows の session-end-check.js とプロジェクト側の同期

Status: OPEN
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-04T20:45:00+09:00
Report: docs/reports/REPORT_TASK_013_shared_workflows_session_end_check_sync_20260104_2158.md
## Objective

- shared-workflows に追加された `session-end-check.js` とプロジェクト側の `scripts/session-end-check.js` を同期する
- 最新の機能や改善を取り込む

## Context

- `session-end-check.js` が shared-workflows に追加された（最新更新で確認）
- プロジェクト側にも `scripts/session-end-check.js` が存在する（TASK_007 で作成）
- 両者の差分を確認し、必要に応じて統合または同期する

## Focus Area

- `scripts/session-end-check.js`（プロジェクト側のスクリプトの更新）
- `docs/`（変更内容のドキュメント化、必要に応じて）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止、ただし既存スクリプトの使用は可能）
- `js/**`（機能実装は本タスク対象外、スクリプトの統合のみ）

## Constraints

- テスト: 主要パスのみ（スクリプトの動作確認のみ）
- フォールバック: 新規追加禁止（既存スクリプトの統合のみ）
- 外部通信: 不要

## DoD

- [x] shared-workflows の session-end-check.js とプロジェクト側のスクリプトの差分を確認
  - 根拠: 両者のスクリプトを比較し、shared-workflows 版の方がより高度な機能を含むことを確認
- [x] 必要に応じてプロジェクト側のスクリプトを更新し、最新の機能を取り込む
  - 根拠: shared-workflows 版をベースに更新し、プロジェクト固有の `checkDriverEntry()` 機能を統合
- [x] 更新内容がドキュメント化されている（必要に応じて）
  - 根拠: 本レポートに更新内容を記載
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
  - 根拠: `docs/inbox/REPORT_TASK_013_shared_workflows_session_end_check_sync_20260104_2158.md` を作成
- [x] 本チケットの Report 欄にレポートパスが追記されている
  - 根拠: チケットファイルの Report 欄に追記

## Notes

- shared-workflows の session-end-check.js は `.shared-workflows/scripts/` に存在する可能性がある（要確認）
- プロジェクト側のスクリプトは `scripts/session-end-check.js` に存在する
- 差分が大きい場合は、プロジェクト側のスクリプトを shared-workflows 版に置き換えることを検討する
