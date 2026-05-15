# Remote sync and restart roadmap handoff

Date: 2026-05-15

## Status

- Local `main` was checked against `origin/main`; before this docs handoff, `git status --short --branch` showed `## main...origin/main` and `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- `git pull --ff-only origin main` had already reported `Already up to date.` in this restart block.
- Product proof remains `8770edd feat: clarify first-use save help`; this handoff is docs/context preservation only.
- No source implementation was changed in this handoff.

## Local readiness checked in this block

- `npm run test:smoke` passed.
- `npm run lint:js:check` passed.
- `npm run test:unit` passed: 11 tests passed.
- `npm run build` passed and refreshed `dist`.
- `git diff --check` passed.
- `npx playwright test --list` reported 66 spec files and 588 tests.

Full monolithic E2E and Electron package build were not run in this block. The current project guidance still treats focused Playwright specs, shard runs, or targeted Electron/package checks as the safer default because full-suite timeout history exists.

## Current trusted context

The writing-trust lane is fixed through:

1. Save / Resume Trust Audit: writing, saved status, Documents discovery, reload resume, Reader return, and TXT / JSON download event were proved.
2. Export Trust Proof: TXT / JSON downloads were checked by real file contents; JSON keeps `document.id`, `document.name`, `document.content`, and `pages`.
3. Chapter Creation Daily Flow: Rich editing -> `+ 新しい章` -> chapter bodies -> save/reload -> Reader -> TXT/JSON -> JSON import roundtrip keeps chapter structure.
4. First-use Save Help: the current local autosave / Documents / TXT/JSON takeout model is legible without adding a new save mechanism.

Do not reopen Save / Resume, Export Trust, Chapter Creation, or First-use Save Help unless a new failure appears.

## Current roadmap judgment

| Priority | Next move | Why it is the next useful bottleneck |
|----------|-----------|---------------------------------------|
| 1 | Import Roundtrip Hardening | Strengthens the return path from external JSON takeout by covering multiple chapters, duplicate names, existing document collisions, and older pages-only JSON. |
| 2 | Rich Editing Heading Shortcut Decision | Decides whether `# 見出し` in Rich editing should become a Markdown shortcut before any editor conversion work starts. This is a specification boundary, not an implementation default. |
| 3 | Docs Hygiene: stale spec reconciliation | Aligns older surfaces such as `APP_SPECIFICATION` / `WRITING_PIPELINE` with the current authority so future planning is not pulled by stale partial tables. |
| Release gate | WP-004 parity pack | Manual preview / Reader comparison remains a user-actor release check. It is not an automatic implementation lane without a new difference report. |

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

Then read, in order:

1. `docs/CURRENT_STATE.md`
2. `docs/INVARIANTS.md`
3. `docs/INTERACTION_NOTES.md`
4. For next-slice selection: `docs/USER_REQUEST_LEDGER.md`
5. For roadmap context: `docs/ROADMAP.md`

Use this file as the 2026-05-15 restart confirmation, not as a replacement for the canonical docs above.
