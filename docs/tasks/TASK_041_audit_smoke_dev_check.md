# Task: smoke/dev-check の期待値と現行実装の整合監査
Status: OPEN
Tier: 2
Branch: feature/audit-smoke-dev-check
Created: 2026-01-20T03:05:00+09:00

## Objective
`scripts/dev-check.js` および smoke test における「未実装扱い」の記述と、現行実装（AI_CONTEXT.md 等）との矛盾を解消する。
`docs/AUDIT_TASK_BREAKDOWN.md` の P1-5 に対応する。

## Focus Area
- `scripts/dev-check.js`
- `test/smoke/` (if exists) or smoke test scripts
- `AI_CONTEXT.md` (整合性確認のみ)

## Forbidden Area
- `.shared-workflows/**`
- テストの期待値を下げること（カバレッジ低下）

## Constraints
- **案A（推奨）** を採用: dev-check を現行実装に合わせ、UI が存在するなら UI の存在/動線を検証する形に修正・コメント更新する。

## DoD
- [ ] `scripts/dev-check.js` のコメントとチェック内容が現行実装の実態（GadgetPrefs UIの存在など）と矛盾しない
- [ ] `npm run test:smoke` が「何を保証しているか」が読み手に一意に伝わる状態になっている
