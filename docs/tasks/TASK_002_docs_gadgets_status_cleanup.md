# Task: docs/GADGETS.md の現行実装と提案の混在を解消（P1-4）

Status: DONE
Tier: 1
Branch: main
Owner: Worker-2
Created: 2025-12-19T15:09:00+09:00
Report: docs/reports/REPORT_TASK_002_docs_gadgets_status_cleanup_20260103_1943.md

## Objective

- `docs/GADGETS.md` 内で「現行実装」と「将来案/旧メモ（提案）」を明確に区別し、読み手が誤認しない構造に整理する
- 参照先がある将来案は OpenSpec や Backlog へ寄せ、`docs/GADGETS.md` は現行の入口として成立させる

## Context

- SSOT: `docs/AUDIT_TASK_BREAKDOWN.md` の **P1-4**
- `docs/ISSUES.md` にも起票候補として列挙されている

## Focus Area

- `docs/GADGETS.md`
- （必要なら）`docs/ARCHITECTURE.md`, `docs/BACKLOG.md`（参照導線だけ最小修正）

## Forbidden Area

- `js/**`（コード変更はしない）
- `.shared-workflows/**`（共有SSOTは変更しない）

## Constraints

- テスト: 主要パスのみ（網羅テストは後続タスクへ分離）
- フォールバック: 新規追加禁止
- 既存の事実関係を変えずに「表示/区別/導線」を整える

## DoD

- [x] 未実装/提案である内容が見出し/本文で明確に区別される
- [x] 現行実装の説明だけを追える導線（目次や見出し）が成立する
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- 可能なら「（現行）」「（提案・未実装）」のようなラベルを見出しに付ける
