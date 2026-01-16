# Task: orchestrator-output-validator.js を CI パイプラインに組み込み

Status: OPEN
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-04T23:00:00+09:00
Report: docs/reports/REPORT_TASK_016_orchestrator_output_validator_ci_integration_20260104_2347.md
## Objective

- orchestrator-output-validator.js を GitHub Actions の CI パイプラインに組み込み、Orchestratorのチャット出力（固定5セクション形式）を自動検証できるようにする
- Orchestratorの出力品質を継続的に向上させる

## Context

- orchestrator-output-validator.js は TASK_012 でプロジェクトに統合済み（`scripts/orchestrator-output-validator.js`）
- 現在は手動実行のみで、CI パイプラインには組み込まれていない
- REPORT_ORCH_20260104_2200.md の改善提案（優先度: Medium）に記載されている
- Orchestratorの出力形式（固定5セクション）を自動検証する仕組みが未整備

## Focus Area

- `.github/workflows/`（GitHub Actions ワークフローの作成・更新）
- `docs/`（CI 統合のドキュメント化、必要に応じて）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止、ただし既存スクリプトの使用は可能）
- `scripts/orchestrator-output-validator.js`（既存スクリプトの変更は本タスク対象外、CI 統合のみ）

## Constraints

- テスト: 主要パスのみ（CI ワークフローの動作確認のみ）
- フォールバック: 新規追加禁止（既存スクリプトの CI 統合のみ）
- 外部通信: 不要（GitHub Actions 内での実行のみ）

## DoD

- [x] orchestrator-output-validator.js を GitHub Actions の CI パイプラインに組み込み、PR作成時やマージ前に自動実行できるようにする
  - 根拠: `.github/workflows/orchestrator-output-validator.yml` を新規作成し、PR コメントの自動検証機能を実装
- [x] CI 実行時のエラーや警告が適切に表示されることを確認
  - 根拠: ワークフローで orchestrator-output-validator.js を実行し、エラーや警告が GitHub Actions のログに表示されることを確認
- [x] 使用方法がドキュメント化されている（必要に応じて）
  - 根拠: `docs/ORCHESTRATOR_OUTPUT_VALIDATOR_USAGE.md` に CI パイプライン統合のセクションを追加
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
  - 根拠: `docs/inbox/REPORT_TASK_016_orchestrator_output_validator_ci_integration_20260104_2347.md` を作成
- [x] 本チケットの Report 欄にレポートパスが追記されている
  - 根拠: Report 欄に `docs/inbox/REPORT_TASK_016_orchestrator_output_validator_ci_integration_20260104_2347.md` を追記

## Notes

- TASK_009 の session-end-check.yml を参考に、同様の構造で orchestrator-output-validator.yml を作成する
- orchestrator-output-validator.js は `scripts/orchestrator-output-validator.js` に存在する（TASK_012 で統合済み）
- CI 実行時のエラーや警告は GitHub Actions のログに表示される
- Orchestratorのチャット出力を検証するため、PR コメントや Issue コメントを検証対象とする必要がある可能性がある（要調査）
