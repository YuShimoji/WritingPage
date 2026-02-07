# Task: ドキュメントの整合性とSSOT化の監査対応
Status: DONE
Tier: 2
Branch: feature/audit-docs-consistency
Created: 2026-01-20T03:05:00+09:00
Completed: 2026-01-29T18:40:00+09:00
Report: docs/reports/REPORT_TASK_040_audit_docs_consistency_20260129.md

## Objective
プロジェクト内の主要ドキュメント（GADGETS.md, KNOWN_ISSUES.md, DESIGN_HUB.md）における「現行実装」と「未実装/提案」の混在や矛盾を解消する。
`docs/AUDIT_TASK_BREAKDOWN.md` の P1-1, P1-2, P1-4 に対応する。

## Focus Area
- `docs/GADGETS.md`
- `docs/KNOWN_ISSUES.md`
- `docs/DESIGN_HUB.md`
- `docs/BACKLOG.md`
- `docs/DEVELOPMENT_STATUS.md` (必要に応じて)

## Forbidden Area
- `.shared-workflows/**`
- 実装コード (`js/**`) の機能変更

## Constraints
- 実装は変更せず、ドキュメントの記述と実態を一致させる作業に集中する。

## DoD
### P1-1: DESIGN_HUB
- [x] `docs/DESIGN_HUB.md` の扱い（提案未実装）が明確化され、BACKLOG 等と矛盾しない
  - ドキュメント冒頭に「ステータス: 提案（未実装）」と明記済み
  - BACKLOG.md に設定ハブタスクは未登録（将来案扱いで整合）

### P1-2: Wiki 制限事項
- [x] Wiki の未実装項目（リンク/AI/画像添付）が一箇所 (`docs/DEVELOPMENT_STATUS.md` 等) で追跡でき、重複/矛盾が無い
  - `docs/DEVELOPMENT_STATUS.md` の「Wiki 機能の制限事項（SSOT）」セクションで一元管理
  - `docs/GADGETS.md` の Wiki セクション末尾から SSOT への参照リンクを設置済み

### P1-4: GADGETS.md 構造化
- [x] `docs/GADGETS.md` 内で「現行実装」と「提案・未実装」が明確に区別されている（見出し・ラベル等で）
  - 「現行リファレンス（現行）」セクション（L18-461）と「提案・未実装 / 旧メモ」セクション（L472-494）で明確に分離
- [x] 現行実装の説明だけを追える導線が成立している
  - 「このドキュメントの読み方」セクションで現行/将来案の読み分け方を案内済み
