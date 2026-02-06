# Task: orchestrator-audit.js を CI パイプラインに組み込み

Status: DONE
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-04T23:00:00+09:00
Report: docs/reports/REPORT_TASK_015_orchestrator_audit_ci_integration_20260104_2345.md
## Objective

- orchestrator-audit.js を GitHub Actions の CI パイプラインに組み込み、DONEタスクのレポート欠損を自動検知できるようにする
- HANDOVER 乖離を自動通知し、報告漏れや整合性の問題を早期に発見する

## Context

- orchestrator-audit.js は既に存在し、DONEタスクのレポート欠損や HANDOVER 乖離を検知できる
- 現在は手動実行のみで、CI パイプラインには組み込まれていない
- TASK_009 で session-end-check.js を CI パイプラインに組み込んだ実績がある
- HANDOVER.md の Proposals と Outlook（Mid-term）に記載されている

## Focus Area

- `.github/workflows/`（GitHub Actions ワークフローの作成・更新）
- `docs/`（CI 統合のドキュメント化、必要に応じて）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止、ただし既存スクリプトの使用は可能）
- `scripts/orchestrator-audit.js`（既存スクリプトの変更は本タスク対象外、CI 統合のみ）

## Constraints

- テスト: 主要パスのみ（CI ワークフローの動作確認のみ）
- フォールバック: 新規追加禁止（既存スクリプトの CI 統合のみ）
- 外部通信: 不要（GitHub Actions 内での実行のみ）

## DoD

- [x] orchestrator-audit.js を GitHub Actions の CI パイプラインに組み込み、PR作成時やマージ前に自動実行できるようにする
  - 根拠: `.github/workflows/orchestrator-audit.yml` を新規作成し、PR作成時やマージ前に自動実行できるように設定
- [x] CI 実行時のエラーや警告が適切に表示されることを確認
  - 根拠: ワークフローで orchestrator-audit.js を実行し、エラーや警告が GitHub Actions のログに表示されることを確認
- [x] 使用方法がドキュメント化されている（必要に応じて）
  - 根拠: レポートに実装内容を記載
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
  - 根拠: `docs/inbox/REPORT_TASK_015_orchestrator_audit_ci_integration_20260104_2345.md` を作成
- [x] 本チケットの Report 欄にレポートパスが追記されている
  - 根拠: Report 欄に `docs/inbox/REPORT_TASK_015_orchestrator_audit_ci_integration_20260104_2345.md` を追記

## Notes

- TASK_009 の session-end-check.yml を参考に、同様の構造で orchestrator-audit.yml を作成する
- orchestrator-audit.js は `scripts/orchestrator-audit.js` または `.shared-workflows/scripts/orchestrator-audit.js` に存在する可能性がある（要確認）
- CI 実行時のエラーや警告は GitHub Actions のログに表示される
