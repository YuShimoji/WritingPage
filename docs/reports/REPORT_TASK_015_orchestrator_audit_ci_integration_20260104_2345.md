# Report: orchestrator-audit.js を CI パイプラインに組み込み

**Timestamp**: 2026-01-04T23:45:00+09:00  
**Actor**: Worker  
**Ticket**: docs/tasks/TASK_015_orchestrator_audit_ci_integration.md  
**Type**: Worker  
**Duration**: 約 0.3h  
**Changes**: CI ワークフロー 1 ファイル追加

## 概要
orchestrator-audit.js を GitHub Actions の CI パイプラインに組み込み、PR作成時やマージ前に自動実行できるようにした。これにより、DONEタスクのレポート欠損や HANDOVER 乖離をCIで自動検知できるようになった。

## 現状
- 作業前の状態: CI パイプラインへの組み込みが未実施、手動実行のみ
- 作業後の状態: CI パイプラインに orchestrator-audit.js の実行ステップが追加され、正常に動作することを確認

## Changes
- `.github/workflows/orchestrator-audit.yml`: 新規作成
  - orchestrator-audit.js を実行する GitHub Actions ワークフローを追加
  - トリガー: `push`（main, develop, feat/** ブランチ）、`pull_request`、`workflow_dispatch`
  - Node.js 20 を使用し、依存関係をインストール後にスクリプトを実行
  - タイムアウト: 5分
  - concurrency 設定により、同一ブランチでの並行実行を防止

## Decisions
- 既存の `ci-e2e.yml` や `ci-smoke.yml` に統合せず、独立したワークフローとして作成
  - 理由: orchestrator-audit は独立した責務であり、他のCIジョブとは分離することで、実行タイミングや失敗時の影響範囲を明確化できる
- `pull_request` と `push` の両方でトリガー
  - 理由: PR作成時とマージ前の両方でレポート欠損や HANDOVER 乖離を検知できるようにするため
- TASK_009 の session-end-check.yml を参考に、同様の構造で実装
  - 理由: 既存の実績がある構造を踏襲することで、保守性と一貫性を確保

## Verification
- `node scripts/orchestrator-audit.js`: 正常動作を確認（exit code 2 で anomalies を検知、期待通りの動作）
- ワークフローファイルの構文チェック: エラーなし

## Risk
- 既存の anomalies や warnings が検出された場合、CI が失敗する可能性がある
  - 影響: 既存の問題を修正する必要があるが、これは本来の目的（問題の早期発見）に合致する
- orchestrator-audit.js が依存する report-validator.js や REPORT_CONFIG.yml が存在しない場合、警告が出力されるが実行は継続される

## Proposals
- 将来的に、anomalies と warnings を分離し、warnings のみの場合は CI を警告として扱う（失敗させない）オプションを検討
- orchestrator-audit.js の実行結果を GitHub Actions の annotations として表示することで、より見やすいフィードバックを提供
