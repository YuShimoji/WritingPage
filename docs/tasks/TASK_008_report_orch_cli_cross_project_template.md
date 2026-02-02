# Task: REPORT_ORCH CLI 完了後他プロジェクトへの横展開テンプレ作成

Status: DONE
Tier: 1
Branch: main
Owner: Worker
Created: 2026-01-03T23:00:00+09:00
Report: docs/reports/REPORT_TASK_008_report_orch_cli_cross_project_template_20260104_1238.md 

## Objective

- REPORT_ORCH CLI の完了後、他プロジェクトへの横展開を容易にするためのテンプレートを作成する
- shared-workflows を導入している他プロジェクトでも REPORT_ORCH CLI を利用できるようにする

## Context

- REPORT_ORCH CLI は既に実装済み（report-orch-cli.js）
- 他プロジェクトへの横展開テンプレートが未整備
- 横展開テンプレートがあれば、他プロジェクトでも迅速に導入できる

## Focus Area

- `docs/`（横展開テンプレートの作成）
- `.shared-workflows/docs/`（submodule 内のドキュメント更新、可能な場合）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止、ただしドキュメント更新は可能な場合のみ）
- `js/**`（機能実装は本タスク対象外）

## Constraints

- テスト: 主要パスのみ（テンプレートの内容確認のみ）
- フォールバック: 新規追加禁止（既存ドキュメントの拡張のみ）
- 外部通信: 不要

## DoD

- [x] 他プロジェクト向けの横展開テンプレート（Markdown形式）が作成されている
  - 根拠: `docs/CROSS_PROJECT_TEMPLATE_REPORT_ORCH.md` を新規作成
- [x] テンプレートに REPORT_ORCH CLI の導入手順が記載されている
  - 根拠: テンプレートに「導入手順」セクションを追加し、前提条件、基本的な使用方法、オプション一覧を記載
- [x] テンプレートに使用例やベストプラクティスが記載されている
  - 根拠: テンプレートに「使用例」セクション（4つの例）と「ベストプラクティス」セクションを追加
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
  - 根拠: `docs/inbox/REPORT_TASK_008_report_orch_cli_cross_project_template_20260104_1238.md` を作成し、`report-validator.js` で検証（OK）
- [x] 本チケットの Report 欄にレポートパスが追記されている
  - 根拠: Report 欄に `docs/inbox/REPORT_TASK_008_report_orch_cli_cross_project_template_20260104_1238.md` を追記

## Notes

- テンプレートは `docs/CROSS_PROJECT_TEMPLATE_REPORT_ORCH.md` などの名前で作成することを推奨
- shared-workflows の submodule 導入が前提条件であることを明記する
