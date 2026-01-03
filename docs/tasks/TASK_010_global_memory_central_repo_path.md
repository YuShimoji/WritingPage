# Task: グローバルMemoryに中央リポジトリ絶対パスを追加

Status: OPEN
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-03T23:00:00+09:00
Report: 

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

- [ ] AI_CONTEXT.md または HANDOVER.md に中央リポジトリの絶対パスが記載されている
- [ ] 絶対パスの記載形式が明確である（例: GitHub URL、ローカルパスなど）
- [ ] ドキュメントの整合性が保たれている
- [ ] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- 中央リポジトリの絶対パスは、GitHub URL（例: `https://github.com/owner/shared-workflows`）またはローカルパス（例: `.shared-workflows/`）のいずれかを記載
- 複数の参照方法がある場合は、すべて記載することを推奨
