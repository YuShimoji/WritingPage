# Freeform Review Autonomy Remote Handoff

This handoff preserves the v1.8 Freeform Review / Long-Run Autonomy context in
repository files so another terminal can resume without relying on chat history.

## Current Sync State Before This Handoff

- Branch: `main`.
- Pre-handoff local state: clean `## main...origin/main`.
- Pre-handoff remote comparison: `git rev-list --left-right --count 'HEAD...@{u}'`
  returned `0 0`.
- Latest pushed context before this handoff:
  `d4de62d docs: add freeform review autonomy guidance`.
- No product/runtime files were dirty before this handoff.

## What The v1.8 Review / Autonomy Work Added

- `docs/OPERATOR_REVIEW_UX.md` is the canonical entry point for Review Card,
  Freeform Review Intake, Review Debt, and Long-Run Autonomy.
- `AGENTS.md` points agents to the new review/autonomy doc while staying thin.
- `docs/ai/STATUS_AND_HANDOFF.md` now defines Operation Cockpit checkpoint
  fields, including Review Card / Review Debt, optional Freeform Review Intake
  Result, User-Side Work, and Handoff Gate result.
- `docs/ai/WORKFLOWS_AND_PHASES.md`, `docs/INTERACTION_NOTES.md`, and
  `docs/OPERATOR_WORKFLOW.md` now separate narrow mechanical confirmation from
  freeform artifact review.
- `README.md`, `docs/README.md`, `docs/index.md`, `docs/PROJECT_OVERVIEW.md`,
  `mkdocs.yml`, and `docs/local-view/docs/OPERATOR_REVIEW_UX.md` make the new
  review/autonomy rules findable in the local docs view.

## Validation Already Run

- `git diff --check` passed, with the existing `mkdocs.yml` line-ending warning.
- `git diff --cached --check` passed before commit `d4de62d`.
- JSON parse passed for `js/plugins/manifest.json`, `manifest.webmanifest`, and
  `docs/spec-index.json`.
- `python -m mkdocs build --clean` completed successfully. Existing warnings
  remain from docs links to excluded code/E2E/generated paths and wrapper-local
  links; the new `OPERATOR_REVIEW_UX` local-view link warning was resolved.
- `npx markdownlint docs/OPERATOR_REVIEW_UX.md docs/local-view/docs/OPERATOR_REVIEW_UX.md`
  passed.
- A broader changed-doc markdownlint run hit pre-existing formatting violations
  in legacy docs such as `AGENTS.md`, `STATUS_AND_HANDOFF.md`, and
  `WORKFLOWS_AND_PHASES.md`; those were not introduced by the new review doc.
- `npm run test:smoke` passed.

## Restart Route From Another Terminal

1. Run `git pull --ff-only origin main`.
2. Confirm `git status --short --branch` is clean on `main...origin/main`.
3. Confirm `git rev-list --left-right --count 'HEAD...@{u}'` returns `0 0`.
4. Read `docs/CURRENT_STATE.md`.
5. Read `docs/INVARIANTS.md`.
6. Read `docs/INTERACTION_NOTES.md`.
7. For the review/autonomy context specifically, read:
   - `docs/OPERATOR_REVIEW_UX.md`
   - `docs/ai/STATUS_AND_HANDOFF.md`
   - `docs/ai/WORKFLOWS_AND_PHASES.md`
   - `docs/OPERATOR_WORKFLOW.md`

## Non-Targets Preserved

- `docs/RUNTIME_STATE.md` was not recreated. Current restart and runtime facts
  remain anchored in `docs/CURRENT_STATE.md`.
- No product runtime code, storage/import/export behavior, Electron/package
  behavior, dependencies, DB/auth/API contract, or external deployment changed.
- No fixed review phrases were introduced as user-facing requirements.
- No next-agent prompt is required unless a future handoff gate is actually met.

## Next Practical Entry Points

| Entry | Purpose | What becomes possible |
| --- | --- | --- |
| Verify review UX in use | Apply the new Review Card shape in the next reviewable artifact report | Confirms the rules are usable without asking the user to learn fixed phrases |
| Audit MkDocs warnings | Separate existing excluded-path warnings from actionable docs-link issues | Future docs builds become quieter and more useful as validation evidence |
| Advance product work | Return to a selected product slice from `ROADMAP` / `USER_REQUEST_LEDGER` | Review/autonomy docs stop being the active bottleneck and become operating support |
