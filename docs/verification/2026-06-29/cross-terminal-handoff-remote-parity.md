# Cross-Terminal Handoff and Remote Parity

## Purpose

Preserve the current Codex/WritingPage context in project files and publish it
to remote so another terminal can resume without relying on chat history.

## Current State

- Branch: `main`.
- Latest context before this handoff: `2e68c0e docs: record heading shortcut
  runtime freshness`.
- Upstream sync before editing: `git fetch --prune origin` and
  `git pull --ff-only origin main` returned `Already up to date`.
- Upstream distance before editing: `git rev-list --left-right --count
  "HEAD...origin/main"` returned `0 0`.

## Preserved Context

- The current product anchor is still the 2026-06-28 runtime freshness /
  first-line heading shortcut repro.
- That pass found the source fix present and the launched `dist/` / Electron
  dir package stale; rebuilding refreshed those ignored local artifacts.
- Direct `dist/index.html` readback after refresh converted first-line
  `#` + Space into one H1 and kept `spellcheck="false"`.
- The visible black line after conversion is the app-owned H1 border style, not
  by itself evidence of failed conversion or native IME / spellcheck underline.
- No new product behavior, source code, package script, launcher, roadmap, or
  UI-copy decision was changed in this handoff pass.

## Restart Instructions

From another terminal:

```powershell
git pull --ff-only origin main
git status --short --branch --untracked-files=all
git rev-list --left-right --count "HEAD...origin/main"
```

Then read:

1. `docs/CURRENT_STATE.md`
2. `docs/INVARIANTS.md`
3. `docs/INTERACTION_NOTES.md`

Only read `docs/USER_REQUEST_LEDGER.md` and `docs/ROADMAP.md` when choosing the
next product slice.

If the next terminal needs to launch the app, use:

```powershell
npm run app:update:open
```

That route checks for a clean worktree, fast-forwards, rebuilds `dist/`, and
opens the normal built app path. Generated `dist/` and `build/win-unpacked`
remain ignored local artifacts and are not the remote handoff surface.

## Boundaries

- This is a maintenance / handoff commit.
- No runtime source changes were made.
- No manual user approval was inferred.
- No stale GitHub issue or PR was promoted into active product work.
- Do not reopen IME underline, heading shortcut, launcher, effect settings,
  Markdown source gate, WP-005, Project import recovery, or rich text block
  alignment unless new evidence appears.

## Verification

Completed in this handoff pass:

- `npm run test:smoke` -> pass, `ALL TESTS PASSED`
- `npx markdownlint docs\verification\2026-06-29\cross-terminal-handoff-remote-parity.md` -> pass
- `git diff --check` -> pass

Before commit / push, also require:

- `git diff --cached --check`
- final `git status --short --branch --untracked-files=all`
- final `git rev-list --left-right --count "HEAD...@{u}"`
