# Stale spec reconciliation after heading shortcut

Date: 2026-06-08

## Slice selected

Stale spec reconciliation. Current `main` already contains the Rich editing typed heading shortcut product slice, so this pass reconciles only active owner docs that could mislead the next restart or feature lookup.

## Authority read

- `docs/CURRENT_STATE.md`
- `docs/USER_REQUEST_LEDGER.md`
- `docs/INVARIANTS.md`
- `docs/INTERACTION_NOTES.md`
- `docs/verification/2026-06-05/issue-118-pr-119-meta-review.md`
- `docs/ROADMAP.md`
- `docs/FEATURE_REGISTRY.md`
- `docs/verification/2026-06-08/rich-editing-heading-shortcut-handoff.md`

## Reconciled

- `docs/CURRENT_STATE.md`: added this docs-only handoff, kept product proof at `1e33e38 feat: add rich editing heading shortcut`, changed active priorities so Rich Editing Heading Shortcut Decision is done, and moved stale spec reconciliation to the first current candidate.
- `docs/FEATURE_REGISTRY.md`: added `FR-014` for the Rich editing typed heading shortcut, with its source docs, implementation file, and focused E2E coverage.
- `docs/ROADMAP.md`: updated the authority note so typed heading shortcut lookup includes `FEATURE_REGISTRY` FR-014 instead of only the handoff and ledger.

## Intentionally untouched

- No product code, UI behavior, storage/import/export behavior, dependency, DB/auth/API, Electron/package behavior, or tests were changed.
- Historical verification notes that name older next-candidate order remain historical references.
- GitHub Issue #118 / PR #119 cleanup remains non-blocking bookkeeping, not product progress.
- Embed security was not audited because the user did not select it as this slice.

## Validation

- `git diff --check`
- `git diff --cached --check`

Result: both passed for this docs-only slice.
