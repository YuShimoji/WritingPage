# Task: Orchestrator出力検証スクリプトの統合

Status: OPEN
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-04T20:45:00+09:00
Report: 

## Objective

- shared-workflows に追加された `orchestrator-output-validator.js` をプロジェクトに統合する
- Orchestrator の出力（固定5セクション形式）を自動検証できるようにする

## Context

- `orchestrator-output-validator.js` が shared-workflows に追加された（最新更新で確認）
- Orchestrator の出力形式（固定5セクション）を検証する仕組みが未整備
- 自動検証により、Orchestrator の出力品質を向上できる

## Focus Area

- `scripts/`（orchestrator-output-validator.js の統合、必要に応じてプロジェクト固有の設定を追加）
- `docs/`（使用方法のドキュメント化、必要に応じて）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止、ただし既存スクリプトの使用は可能）
- `js/**`（機能実装は本タスク対象外、スクリプトの統合のみ）

## Constraints

- テスト: 主要パスのみ（スクリプトの動作確認のみ）
- フォールバック: 新規追加禁止（既存スクリプトの統合のみ）
- 外部通信: 不要

## DoD

- [ ] orchestrator-output-validator.js の存在確認と使用方法の調査が完了している
- [ ] スクリプトをプロジェクトに統合し、正常に動作することを確認
- [ ] 使用方法がドキュメント化されている（必要に応じて）
- [ ] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- orchestrator-output-validator.js は `.shared-workflows/scripts/` に存在する可能性がある（要確認）
- 既存の `report-validator.js` との関係を確認し、統合方法を決定する
