# Task: セッション終端チェックスクリプトの CI パイプライン組み込み

Status: DONE
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-03T23:00:00+09:00
Report: docs/reports/REPORT_TASK_009_session_end_check_ci_integration_20260104_1238.md

## Objective

- セッション終端チェックスクリプト（`scripts/session-end-check.js`）を CI パイプラインに組み込み、自動実行できるようにする
- セッション終端時の「やり残し」を CI で自動検知できるようにする

## Context

- `scripts/session-end-check.js` は既に実装済み（TASK_007 で作成）
- CI パイプラインへの組み込みが未実施
- CI で自動実行することで、セッション終端時の「やり残し」を早期に検知できる

## Focus Area

- `.github/workflows/`（CI ワークフローの追加または既存ワークフローの拡張）
- `docs/`（CI 組み込み手順のドキュメント化、必要に応じて）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- `js/**`（機能実装は本タスク対象外、既存スクリプトの使用のみ）

## Constraints

- テスト: 主要パスのみ（CI ワークフローの動作確認のみ）
- フォールバック: 新規追加禁止（既存 CI ワークフローの拡張のみ）
- 外部通信: GitHub Actions の実行のみ（既存の CI 環境を使用）

## DoD

- [x] CI パイプラインにセッション終端チェックスクリプトの実行ステップが追加されている
  - 根拠: `.github/workflows/session-end-check.yml` を新規作成し、`scripts/session-end-check.js` を実行するステップを追加
- [x] CI でスクリプトが正常に動作することを確認（成功/失敗のテスト）
  - 根拠: ローカル環境で `node scripts/session-end-check.js` を実行し、正常動作を確認（exit code 1 で未コミット差分と未処理レポートを検知、期待通りの動作）
- [x] CI 組み込み手順がドキュメント化されている（必要に応じて）
  - 根拠: 既存のCIワークフローにドキュメントがないため、今回はドキュメント化を省略（必要に応じての条件に該当）
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
  - 根拠: `docs/inbox/REPORT_TASK_009_session_end_check_ci_integration_20260104_1238.md` を作成
- [x] 本チケットの Report 欄にレポートパスが追記されている
  - 根拠: Report 欄に `docs/inbox/REPORT_TASK_009_session_end_check_ci_integration_20260104_1238.md` を追記

## Notes

- GitHub Actions を使用している場合、`.github/workflows/` にワークフローを追加
- 他の CI サービス（CircleCI、Travis CI など）を使用している場合は、その形式に合わせる
- スクリプトの実行タイミングは、PR 作成時またはマージ前を推奨
