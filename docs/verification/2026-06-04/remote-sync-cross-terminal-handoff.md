# Remote sync and cross-terminal handoff

Date: 2026-06-04

## Current remote state

- Local `main` was fast-forwarded from `4aa2f62 docs: record restart roadmap handoff` to `d007bf0 docs: hand off current sync context` after `git fetch origin` reported new remote work.
- The pulled remote work includes `a56671b test: harden import roundtrip`, `b9948fb docs: hand off import roundtrip sync`, and `d007bf0 docs: hand off current sync context`.
- Product proof anchor remains `a56671b test: harden import roundtrip`; no product code, UI contract, storage contract, dependency, DB, auth, or API behavior is changed by this handoff.
- Before this docs update, `git status --short --branch` showed clean `## main...origin/main`, and `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- This file keeps the cross-terminal restart context in project docs instead of chat history before pushing it to `origin/main`.

## What is preserved

The trusted writing path is unchanged: local autosave/resume, TXT/JSON export contents, chapter creation daily flow, first-use save help, and safe JSON import roundtrip are already proved. Do not reopen those areas unless a new failure appears.

Import Roundtrip Hardening is now done. `ZenWriterStorage.importProjectJSON(jsonString)` normalizes and validates incoming JSON before mutating stored documents, keeps invalid imports from changing existing docs, creates new document/chapter IDs, resolves document name collisions with deterministic `読み込み N` suffixes, preserves duplicate chapter titles, and normalizes page order / level / visibility / content fallback.

The next useful decision remains `Rich Editing Heading Shortcut Decision`: decide whether typing `# 見出し` in Rich editing should auto-convert to a heading, while keeping the Rich editing / Markdown source boundary explicit before implementation. The second useful lane is docs hygiene / stale spec reconciliation. WP-004 parity work remains a user-actor release gate only when a fresh preview / Reader difference appears.

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
4. Only when choosing the next slice: `docs/USER_REQUEST_LEDGER.md`
5. Only for roadmap context: `docs/ROADMAP.md`

## Handoff validation for this docs-only slice

- `git fetch origin`
- `git pull --ff-only origin main`
- `git status --short --branch` -> clean before docs edits
- `git rev-list --left-right --count HEAD...origin/main` -> `0 0` before docs edits
- `git diff --check` -> pass
- `npm run test:smoke` -> pass
- After commit/push, confirm `git status --short --branch` and `git rev-list --left-right --count HEAD...origin/main` again.

## Next entry points

| Entry point | Reduces friction in | What becomes possible |
|-------------|---------------------|-----------------------|
| Advance: Rich Editing Heading Shortcut Decision | Editor typing policy | Implement or decline `# 見出し` auto-conversion without blurring Rich editing and Markdown source. |
| Audit: stale spec reconciliation | Planning authority | Remove old UI-state/spec pull so the next slice starts from current shell, import trust, and writing-trust facts. |
| Verify: cross-terminal restart check | Handoff confidence | A second terminal can pull, confirm `0 0`, and start from project docs without asking for chat context. |
