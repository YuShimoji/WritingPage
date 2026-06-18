# Remote Sync Context Handoff

This handoff keeps the current repository context in project files so another
terminal can resume without relying on chat history.

## Sync State Before This Handoff

- Branch: `main`.
- Remote update: `git fetch origin` moved `origin/main` from `89548fd` to
  `5bd3f71`.
- Fast-forward: `git pull --ff-only origin main` updated local `main` to
  `5bd3f71 docs: hand off freeform review autonomy context`.
- Post-pull remote comparison before these handoff edits:
  `git rev-list --left-right --count "HEAD...origin/main"` returned `0 0`.
- Worktree before these handoff edits had one local adapter-only change:
  `AGENTS.md` added the empty footer `## Imported Claude Cowork project
  instructions`. It was preserved instead of discarded.

## What This Handoff Updates

- `docs/CURRENT_STATE.md` now has a 2026-06-18 restart snapshot at the top.
- `docs/USER_REQUEST_LEDGER.md` now points the remote sync / cross-terminal
  handoff request to this file.
- `AGENTS.md` now keeps the local imported-instructions footer together with
  the upstream review/autonomy pointer.

## Current Project State

- Product/runtime behavior did not change in this handoff.
- Latest editor product proof remains WP-SAVELOAD-001 /
  `writing-trust-workflow-001`.
- Product verification anchor remains
  `docs/verification/2026-06-15/editor-trust-vertical-slice.md`.
- Review/autonomy operating context remains the 2026-06-17 v1.8 docs slice:
  `docs/OPERATOR_REVIEW_UX.md`, `docs/ai/STATUS_AND_HANDOFF.md`,
  `docs/ai/WORKFLOWS_AND_PHASES.md`, and `docs/OPERATOR_WORKFLOW.md`.
- `docs/RUNTIME_STATE.md` remains intentionally absent. Restart facts stay in
  `docs/CURRENT_STATE.md`.

## Validation Run In This Handoff

- `git diff --check` passed.
- `npx markdownlint docs\verification\2026-06-18\remote-sync-context-handoff.md`
  passed. Node printed the existing `fs.R_OK` deprecation warning only.
- `python -m mkdocs build --clean` could not run through the default
  WindowsApps `python.exe` stub. The same command succeeded with the bundled
  Codex Python at
  `C:\Users\thank\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`.
- MkDocs still reports the known excluded-path and legacy anchor warnings. The
  new 2026-06-18 verification note is visible to MkDocs as an unnaved docs page,
  matching the existing verification-log pattern.

## Restart Route From Another Terminal

1. Run `git pull --ff-only origin main`.
2. Confirm `git status --short --branch` is clean on `main...origin/main`.
3. Confirm `git rev-list --left-right --count "HEAD...origin/main"` returns
   `0 0`.
4. Read `docs/CURRENT_STATE.md`.
5. Read `docs/INVARIANTS.md`.
6. Read `docs/INTERACTION_NOTES.md`.
7. If choosing work, read `docs/USER_REQUEST_LEDGER.md` and `docs/ROADMAP.md`.
8. If touching review/autonomy or handoff behavior, read:
   - `docs/OPERATOR_REVIEW_UX.md`
   - `docs/ai/STATUS_AND_HANDOFF.md`
   - `docs/ai/WORKFLOWS_AND_PHASES.md`
   - `docs/OPERATOR_WORKFLOW.md`

## Non-Targets Preserved

- No product code changed.
- No storage/import/export behavior changed.
- No Electron/package behavior changed.
- No dependency, DB/auth/API, external deployment, or GitHub Issue / PR state
  changed.
- No removed restart magnet such as `docs/RUNTIME_STATE.md` was recreated.

## Next Practical Entry Points

| Entry | Purpose | What becomes possible |
| --- | --- | --- |
| Advance stale spec reconciliation | Remove stale owner-doc wording that can mislead the next product slice | Product work can start from current authority without another docs archaeology pass |
| Verify Review Card in use | Apply the v1.8 review/autonomy rules to the next reviewable artifact | Confirms freeform review works in practice rather than only as documentation |
| Audit MkDocs warning noise | Separate legacy excluded-path warnings from actionable broken links | Future docs builds become clearer validation evidence |
