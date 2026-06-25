# Remote Sync After Markdown Source Authority

## Purpose

Preserve the current WritingPage context in project files and make `main`
immediately resumable from another terminal after the Markdown source command
dev gate and its active-authority reconciliation.

## Verified State

- Repo: WritingPage.
- Branch: `main`.
- Pre-handoff sync check: `git fetch origin`, `git status -sb`, and
  `git rev-list --left-right --count HEAD...origin/main`.
- Pre-handoff result: clean `main...origin/main`, `HEAD...origin/main = 0 0`.
- Latest pushed context before this handoff commit:
  `8db12aa docs: reconcile markdown source authority`.

## Current Context

- Runtime product proof: `210246c fix: gate markdown source command`.
- Active authority proof: `8db12aa docs: reconcile markdown source authority`.
- Normal command palette does not expose `Markdown ソース`; developer mode keeps
  it as an escape hatch.
- Active docs now describe normal writing routes as Rich editing / MD preview /
  Reader, with Markdown source reserved for developer mode.
- Closed unless new evidence appears: WP-005 preview/comparison, Project import
  recovery, Rich heading, Rich text block align persistence, and Markdown source
  dev gate implementation.

## Restart Route

On another terminal:

1. `git pull --ff-only origin main`
2. Confirm clean `main...origin/main`.
3. Confirm `git rev-list --left-right --count HEAD...origin/main` returns
   `0 0`.
4. Read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` ->
   `docs/INTERACTION_NOTES.md`.
5. Read `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing
   the next slice.

## Validation

- `git diff --check`
- `npx markdownlint docs/verification/2026-06-25/remote-sync-after-markdown-source-authority.md`
