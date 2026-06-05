# Remote sync after GitHub artifact authority correction

Date: 2026-06-05

## Current remote state

- Local `main` is synchronized with `origin/main` at `c272503 docs: downgrade stale github artifacts`.
- `git fetch --prune origin` completed.
- `git pull --ff-only origin main` returned already up to date.
- Before this docs update, `git status --short --branch` showed clean `## main...origin/main`.
- Before this docs update, `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- This file keeps the restart context in project docs so another terminal can resume without chat history.

## What is preserved

Product proof remains `a56671b test: harden import roundtrip`. This handoff does not change product code, UI wording, storage behavior, dependencies, DB/auth/API behavior, Electron/package behavior, or the current writing-trust proof.

The latest authority correction remains active: open GitHub Issues / PRs are weak management information in this repo, not active artifacts by themselves. PR #119 remains stale / reference-only and must not be merged, rebased, cherry-picked, or reused as an implementation branch. Issue #118 only matters if embed security is explicitly selected, and then only as a current-main missing-DoD audit.

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

## Next entry points

| Entry point | Reduces friction in | What becomes possible |
|-------------|---------------------|-----------------------|
| Advance: Rich Editing Heading Shortcut Decision | Editor typing policy | Decide whether `# 見出し` in Rich editing should auto-convert before any editor transform implementation. |
| Audit: stale spec reconciliation | Planning authority | Remove old spec pull so next implementation starts from current shell, import trust, and GitHub artifact authority facts. |
| Verify: cross-terminal restart check | Handoff confidence | A second terminal can pull, confirm `0 0`, and start from project docs without asking for chat context. |

## Validation for this docs-only slice

- `git diff --check`
- `git diff --cached --check`
