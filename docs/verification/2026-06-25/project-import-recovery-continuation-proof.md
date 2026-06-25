# Project Import Recovery Continuation Proof

## Purpose

This slice completes the follow-up to `project-import-safe-failure-signal`. The prior proof made malformed JSON project import visibly safe; this proof checks the next writer-facing question: after that failure, the same editor can still accept continuation text, save it, and restore it after reload.

## Selected Slice

- Family: Project Recovery / failed import recovery.
- Scope: focused E2E proof in `e2e/editor-trust-workflow.spec.js`.
- Non-targets: import schema, export schema, storage mutation rules, chapter editing model, cloud sync, Electron packaging, Rich heading, broad docs cleanup, GitHub cleanup.

## What Changed

- `e2e/editor-trust-workflow.spec.js` now performs an invalid JSON import immediately after the normal document save/reload proof.
- The test asserts the safe-failure message, unchanged current doc id, unchanged raw id, and unchanged documents snapshot.
- The test then writes continuation text containing `editor-trust-recovery-continue-4b91`, waits for saved state, reloads, and verifies the same document still contains both the original explicit-save token and the continuation token.
- The later chapter-mode invalid import check remains focused on non-mutation of the chapter parent/raw id/docs snapshot before the JSON roundtrip import proof.

## Validation

- `node --check e2e/editor-trust-workflow.spec.js`
- `git diff --check`
- `npx playwright test e2e/editor-trust-workflow.spec.js --workers=1 --reporter=line`
- `npm run lint:js:check`
- `npx markdownlint docs/verification/2026-06-25/project-import-recovery-continuation-proof.md`

A broader markdownlint pass over `docs/CURRENT_STATE.md`, `docs/USER_REQUEST_LEDGER.md`, and `docs/ROADMAP.md` is still blocked by older document-wide MD038 / MD025 / MD012 warnings outside this slice.

## Trust Effect

No product implementation fix was needed. The focused proof now covers the recovery chain the writer experiences: malformed JSON import does not replace the current manuscript, the notification says the document was kept, writing can continue in the current document, and reload/resume preserves that continuation.
