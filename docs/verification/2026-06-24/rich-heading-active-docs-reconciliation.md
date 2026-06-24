# Rich Heading Active Docs Reconciliation

## Purpose

This docs-only pass reconciles the active roadmap entry after the Rich heading closure checklist so the next agent does not return to the older IME / direct shortcut / placeholder review loop.

## Inspected Anchors

- `docs/CURRENT_STATE.md`
- `docs/USER_REQUEST_LEDGER.md`
- `docs/INVARIANTS.md`
- `docs/INTERACTION_NOTES.md`
- `docs/ROADMAP.md`
- `docs/verification/2026-06-22/rich-heading-feature-closure-checklist.md`
- `docs/verification/2026-06-22/remote-sync-after-rich-heading-closure.md`
- `docs/verification/2026-06-22/rich-heading-placeholder-polish.md`
- `docs/verification/2026-06-18/rich-heading-ime-spotcheck.md`

## Result

`CURRENT_STATE` and `USER_REQUEST_LEDGER` already point to the closure checklist and remote-sync handoff as the current authority. `ROADMAP` still presented the 2026-06-15 writing-trust lane as the latest active context and only named the older Rich heading implementation handoff, so it was updated to include:

- the Rich heading closure / review-dedup anchor;
- the placeholder/caret polish proof;
- an explicit rule not to reopen IME / direct shortcut / empty heading placeholder review without new evidence, a changed target axis, a suspected regression, or an explicit user-requested recheck.

No product code, E2E tests, dependencies, storage, import/export behavior, Electron packaging, GitHub artifacts, or AGENTS rules changed.

## Next Product Candidates

- Advance: choose one current product slice from `docs/USER_REQUEST_LEDGER.md` and keep it to one topic.
- Audit: inspect remaining active-doc drift only when it can mislead the next owner.
- Verify: run a release-wide visual check only as optional release confidence, not as a blocker for the closed Rich heading feature.
