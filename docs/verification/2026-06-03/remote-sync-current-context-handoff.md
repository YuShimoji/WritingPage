# Remote sync and current-context handoff

Date: 2026-06-03

## Current remote state

- Product proof anchor remains `a56671b test: harden import roundtrip`; no product code, UI contract, storage contract, dependency, DB, auth, or API behavior was changed in this handoff.
- Pre-handoff context anchor was `b9948fb docs: hand off import roundtrip sync`.
- After `git fetch --prune origin`, local `main` and `origin/main` were synchronized before these docs edits: `git rev-list --left-right --count HEAD...origin/main` returned `0 0`, and `git status --short --branch` showed `## main...origin/main` with no file entries.
- This handoff exists to keep the restart context in project docs rather than chat history, then push that context to `origin/main`.

## What is preserved

The current product trust stack is unchanged: local autosave/resume, TXT/JSON export contents, chapter creation daily flow, first-use save help, and safe JSON import roundtrip are already proved. Do not reopen those areas unless a new failure appears.

The next useful decision remains `Rich Editing Heading Shortcut Decision`: decide whether typing `# 見出し` in Rich editing should auto-convert to a heading, and keep the Rich editing / Markdown source boundary explicit before implementation. The second useful lane is docs hygiene / stale spec reconciliation. WP-004 parity work stays a user-actor release gate only when a fresh preview / Reader difference appears.

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

- `git fetch --prune origin`
- `git rev-list --left-right --count HEAD...origin/main` -> `0 0` before docs edits
- `git status --short --branch` -> clean before docs edits
- `git diff --cached --check` -> pass
- `npm run test:smoke` -> pass
- After commit/push, confirm `git status --short --branch` and `git rev-list --left-right --count HEAD...origin/main` again.

## Next entry points

| Entry point | Reduces friction in | What becomes possible |
|-------------|---------------------|-----------------------|
| Advance: Rich Editing Heading Shortcut Decision | Editor typing policy | Implement or decline `# 見出し` auto-conversion without blurring Rich editing and Markdown source. |
| Audit: stale spec reconciliation | Planning authority | Remove old UI-state/spec pull so the next slice starts from current shell and writing-trust facts. |
| Verify: cross-terminal restart check | Handoff confidence | A second terminal can pull, confirm `0 0`, and start from project docs without asking for chat context. |
