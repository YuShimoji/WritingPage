# Task: Worker完了レポートの必須ヘッダー自動補完

Status: OPEN
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-04T20:45:00+09:00
Report: 

## Objective

- Worker完了レポートの必須ヘッダー（'概要' と '次のアクション'）を自動補完する機能を追加する
- report-validator.js で警告を検出できるが、Workerプロンプトに必須ヘッダーの明記を追加することで、警告を事前に防ぐ

## Context

- TASK_010 と TASK_011 のレポートに必須ヘッダー '概要' と '次のアクション' が不足していた
- report-validator.js で警告を検出できるが、事前に防ぐ仕組みが未整備
- Workerプロンプトテンプレートに必須ヘッダーの明記を追加することで、警告を事前に防げる

## Focus Area

- `prompts/worker/`（Workerプロンプトテンプレートの更新）
- `.shared-workflows/prompts/worker/`（submodule 内のテンプレート更新、可能な場合）
- `docs/`（必須ヘッダーの説明を追加、必要に応じて）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止、ただしドキュメント更新は可能な場合のみ）
- `js/**`（機能実装は本タスク対象外）

## Constraints

- テスト: 主要パスのみ（テンプレートの内容確認のみ）
- フォールバック: 新規追加禁止（既存テンプレートの拡張のみ）
- 外部通信: 不要

## DoD

- [ ] Workerプロンプトテンプレートに必須ヘッダー（'概要' と '次のアクション'）の明記を追加
- [ ] テンプレートの更新内容がドキュメント化されている（必要に応じて）
- [ ] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- Workerプロンプトテンプレートは `.shared-workflows/docs/windsurf_workflow/WORKER_PROMPT_TEMPLATE.md` に存在する可能性がある（要確認）
- プロジェクト側のテンプレートは `prompts/worker/` に存在する
- 必須ヘッダーの明記により、Workerがレポート作成時に必須ヘッダーを含めることを意識できる
