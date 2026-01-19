# Task: ドキュメントの整合性とSSOT化の監査対応
Status: OPEN
Tier: 2
Branch: feature/audit-docs-consistency
Created: 2026-01-20T03:05:00+09:00

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
- [ ] `docs/DESIGN_HUB.md` の扱い（提案未実装）が明確化され、BACKLOG 等と矛盾しない

### P1-2: Wiki 制限事項
- [ ] Wiki の未実装項目（リンク/AI/画像添付）が一箇所 (`docs/DEVELOPMENT_STATUS.md` 等) で追跡でき、重複/矛盾が無い

### P1-4: GADGETS.md 構造化
- [ ] `docs/GADGETS.md` 内で「現行実装」と「提案・未実装」が明確に区別されている（見出し・ラベル等で）
- [ ] 現行実装の説明だけを追える導線が成立している
