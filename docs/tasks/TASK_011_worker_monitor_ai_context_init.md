# Task: worker-monitor.js 導入と AI_CONTEXT.md 初期化スクリプトの検討

Status: OPEN
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-03T23:00:00+09:00
Report: 

## Objective

- worker-monitor.js の導入を検討し、必要に応じて実装する
- AI_CONTEXT.md の初期化スクリプトを検討し、必要に応じて実装する
- Worker 完了ステータスの記録を自動化する

## Context

- worker-monitor.js は shared-workflows に存在する可能性がある（要確認）
- AI_CONTEXT.md の初期化スクリプトが未整備
- Worker 完了ステータスの記録が手動で行われている

## Focus Area

- `scripts/`（worker-monitor.js の導入、AI_CONTEXT.md 初期化スクリプトの作成）
- `docs/`（使用方法のドキュメント化、必要に応じて）
- `.shared-workflows/scripts/`（既存スクリプトの確認、可能な場合）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止、ただし既存スクリプトの使用は可能）
- `js/**`（機能実装は本タスク対象外、スクリプトの作成のみ）

## Constraints

- テスト: 主要パスのみ（スクリプトの動作確認のみ）
- フォールバック: 新規追加禁止（既存スクリプトの拡張のみ）
- 外部通信: 不要

## DoD

- [ ] worker-monitor.js の存在確認と使用方法の調査が完了している
- [ ] AI_CONTEXT.md 初期化スクリプトの必要性が評価されている
- [ ] 必要に応じてスクリプトが作成されている（または既存スクリプトの使用方法がドキュメント化されている）
- [ ] 使用方法がドキュメント化されている（必要に応じて）
- [ ] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- worker-monitor.js が既に存在する場合は、導入方法をドキュメント化する
- worker-monitor.js が存在しない場合は、必要性を評価し、必要に応じて実装を提案する
- AI_CONTEXT.md 初期化スクリプトは、既存の `todo-sync.js` との統合を検討する
