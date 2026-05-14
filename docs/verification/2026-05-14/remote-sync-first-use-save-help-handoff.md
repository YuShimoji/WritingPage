# Remote sync handoff after First-use Save Help

Date: 2026-05-14

## Status

- Product proof commit before this handoff: `8770edd feat: clarify first-use save help`.
- Local `main` was pulled with `git pull --ff-only origin main` and was already up to date.
- `git rev-list --left-right --count HEAD...origin/main` was `0 0` before creating this handoff note.
- Working tree was clean before creating this handoff note.
- This note exists so a different terminal can restart from project files instead of chat history.

## Current trusted writing path

The current writing-trust lane is fixed through these slices:

1. Save / Resume Trust Audit: writing, saved status, Documents discovery, reload resume, Reader return, and TXT / JSON download event were proved.
2. Export Trust Proof: TXT export file contents match the canonical current editor value; JSON export parses as `zenwriter-v1` and keeps `document.id`, `document.name`, `document.content`, and `pages`; JSON import and Reader-after-export paths were proved.
3. Chapter Creation Daily Flow: `+ 新しい章` from Rich editing creates Store-backed chapters; chapter bodies stay isolated; save/reload, Reader, TXT/JSON export, and JSON import roundtrip keep chapter structure.
4. First-use Save Help: first-use empty state, Documents, writing status chip, and `入出力` menu now explain the existing model: local autosave on this device, save state at the bottom chip, TXT/JSON as external takeout, and JSON import as the way back.

## Restart route on another terminal

Run:

```powershell
git pull --ff-only origin main
git status --short --branch
git rev-list --left-right --count HEAD...origin/main
```

Expected after sync:

- `git status --short --branch` shows `## main...origin/main` with no file entries.
- `git rev-list --left-right --count HEAD...origin/main` returns `0 0`.

Then read, in order:

1. `docs/CURRENT_STATE.md`
2. `docs/INVARIANTS.md`
3. `docs/INTERACTION_NOTES.md`
4. For next-slice selection only: `docs/USER_REQUEST_LEDGER.md`
5. For roadmap context only: `docs/ROADMAP.md`

Do not use stale partial statements in `docs/APP_SPECIFICATION.md` or `docs/WRITING_PIPELINE.md` as the current authority when they conflict with `CURRENT_STATE`, `INVARIANTS`, `INTERACTION_NOTES`, `USER_REQUEST_LEDGER`, or `ROADMAP`.

## Do not reopen unless a new failure appears

- Save / Resume Trust Audit
- Export Trust Proof
- Chapter Creation Daily Flow
- First-use Save Help

## Next slice candidates

| Priority | Candidate | Why it is next |
|----------|-----------|----------------|
| 1 | Import Roundtrip Hardening | Makes the external-takeout return path stronger for multiple chapters, duplicate names, existing document collisions, and older pages-only JSON. |
| 2 | Rich Editing Heading Shortcut Decision | Decides whether `# 見出し` in Rich editing should become a Markdown shortcut before any editor conversion work starts. |
| 3 | Docs Hygiene: stale spec reconciliation | Aligns old specification surfaces such as `APP_SPECIFICATION` / `WRITING_PIPELINE` with the current writing-trust authority. |

## Verification already attached to the product proof

The First-use Save Help closeout passed:

- `node --check js/writing-status-chip.js`
- `node --check js/gadgets-documents-hierarchy.js`
- `node --check js/gadgets-documents-tree.js`
- `node --check e2e/first-use-save-help.spec.js`
- `npx playwright test e2e/first-use-save-help.spec.js --workers=1 --reporter=line`
- `npx playwright test e2e/export-trust.spec.js --workers=1 --reporter=line`
- `npx playwright test e2e/daily-writing-proof.spec.js --workers=1 --reporter=line`
- `npx playwright test e2e/chapter-creation-daily-flow.spec.js --workers=1 --reporter=line`
- `npx playwright test e2e/content-guard.spec.js -g "Documents toolbar separates|Documents menus stay unique" --workers=1 --reporter=line`
- `npm run test:smoke`
- `npm run lint:js:check`
- `npm run build`
- `npm run test:unit`
- `git diff --check`
- `git diff --cached --check`

Full monolithic E2E is still not the default for handoff because this repo has timeout history on full-suite runs. Use focused specs or shard / suite division for total inspection.
