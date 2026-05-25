# Remote sync handoff after Import Roundtrip Hardening

Date: 2026-05-25

## Current remote state

- Product proof anchor: `a56671b test: harden import roundtrip`.
- Local `main` was clean and synchronized with `origin/main` before this handoff note: `git status --short --branch` showed `## main...origin/main`, and `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- The Import Roundtrip Hardening slice was already pushed to `origin/main`.

## Completed slice

Import Roundtrip Hardening is closed. `ZenWriterStorage.importProjectJSON(jsonString)` now validates and normalizes before saving, returns `null` without mutating docs for malformed or unsupported input, accepts valid legacy pages-only JSON, creates fresh document/chapter IDs, suffixes colliding document names deterministically, preserves duplicate chapter titles, normalizes page order/level/visibility/title/content, and rebuilds Markdown document content from pages when needed.

The slice did not change the public import signature, the `zenwriter-v1` export schema, Documents UI wording, Electron menu routes, Cloud sync, EPUB/DOCX, Rich editing heading shortcuts, or Floating memo persistence.

## Validation attached to this state

- `node --check js/storage.js`
- `npx playwright test e2e/import-roundtrip-hardening.spec.js e2e/export-trust.spec.js e2e/chapter-creation-daily-flow.spec.js --workers=1 --reporter=line` -> 6 passed
- `npm run test:smoke`
- `npm run lint:js:check`
- `git diff --check`

Full monolithic E2E and Electron package build were not run for this handoff because the touched surface is storage import plus existing export/chapter trust regressions.

## Restart route on another terminal

Run:

```powershell
git pull --ff-only origin main
git status --short --branch
git rev-list --left-right --count HEAD...origin/main
```

Expected:

- `git status --short --branch` shows `## main...origin/main` with no file entries.
- `git rev-list --left-right --count HEAD...origin/main` returns `0 0`.

Then read:

1. `docs/CURRENT_STATE.md`
2. `docs/INVARIANTS.md`
3. `docs/INTERACTION_NOTES.md`
4. For choosing the next slice: `docs/USER_REQUEST_LEDGER.md`
5. For roadmap context: `docs/ROADMAP.md`

## Next useful entry points

| Priority | Next move | Why it is now the useful bottleneck |
|----------|-----------|--------------------------------------|
| 1 | Rich Editing Heading Shortcut Decision | Decide whether `# 見出し` typed in Rich editing should become an automatic heading shortcut before any editor conversion work starts. |
| 2 | Docs Hygiene: stale spec reconciliation | Align older spec surfaces with the current authority so future planning is not pulled back toward stale tables or old UI states. |
| Release gate | WP-004 parity pack | Keep as a user-actor preview / Reader comparison gate, used when a fresh difference appears rather than as an automatic implementation lane. |
