# Task: グローバルMemoryに中央リポジトリ絶対パスを追加

Status: DONE
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-03T23:00:00+09:00
Report: docs/reports/REPORT_TASK_010_global_memory_central_repo_path_20260104_1238.md

## Objective

- グローバルMemoryに中央リポジトリ（shared-workflows）の絶対パスを追加する
- AI エージェントが中央リポジトリの場所を容易に参照できるようにする

## Context

- shared-workflows は submodule として `.shared-workflows/` に導入されている
- グローバルMemoryに中央リポジトリの絶対パスが未記載
- 絶対パスを記載することで、AI エージェントが参照しやすくなる

## Focus Area

- `AI_CONTEXT.md`（グローバルMemoryセクションの追加または更新）
- `docs/HANDOVER.md`（必要に応じて中央リポジトリ参照情報を追加）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- `js/**`（機能実装は本タスク対象外）

## Constraints

- テスト: 主要パスのみ（ドキュメントの内容確認のみ）
- フォールバック: 新規追加禁止（既存ドキュメントの拡張のみ）
- 外部通信: 不要

## DoD

- [x] AI_CONTEXT.md または HANDOVER.md に中央リポジトリの絶対パスが記載されている
  - 根拠: AI_CONTEXT.md の「中央ルール参照（SSOT）」セクションと docs/HANDOVER.md の「セットアップ状況」セクションに、GitHub URL とローカルパス（submodule）の両方を記載
- [x] 絶対パスの記載形式が明確である（例: GitHub URL、ローカルパスなど）
  - 根拠: GitHub URL（`https://github.com/YuShimoji/shared-workflows`）とローカルパス（`.shared-workflows/`）の両方を明記
- [x] ドキュメントの整合性が保たれている
  - 根拠: AI_CONTEXT.md と docs/HANDOVER.md の両方で同じ情報（GitHub URL とローカルパス）が記載されていることを確認
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
  - 根拠: `docs/inbox/REPORT_TASK_010_global_memory_central_repo_path_20260104_1238.md` を作成
- [x] 本チケットの Report 欄にレポートパスが追記されている
  - 根拠: Report 欄に `docs/inbox/REPORT_TASK_010_global_memory_central_repo_path_20260104_1238.md` を追記

## Notes

- 中央リポジトリの絶対パスは、GitHub URL（例: `https://github.com/owner/shared-workflows`）またはローカルパス（例: `.shared-workflows/`）のいずれかを記載
- 複数の参照方法がある場合は、すべて記載することを推奨
