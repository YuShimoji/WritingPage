# Task: Audit Smoke Test Expectations
Status: DONE
Tier: 3
Branch: chore/audit-smoke
Owner: Worker
Created: 2026-02-03T13:55:00+09:00

## Objective
Update `scripts/dev-check.js` to match current Phase E active features.

## Context
- `dev-check.js` (smoke test) checks for specific UI elements.
- Recent changes (Tabs, Floating Panels) might have changed IDs or DOM structure.
- Some checks might be "soft" (warn only) when they should be "hard" (error).

## Focus Area
- `scripts/dev-check.js`

## DoD
- [x] Review all checks in `dev-check.js`.
- [x] Ensure `customTabs` and related new features are checked.
- [x] Remove obsolete checks.
- [x] Pass `npm run test:smoke`.
