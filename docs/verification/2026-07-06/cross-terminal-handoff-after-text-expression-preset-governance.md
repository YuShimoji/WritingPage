# Cross-terminal handoff after text expression preset governance

Date: 2026-07-06

## Purpose

The user requested that the current project context be kept inside the project, that local tracked state be reflected to remote, and that another terminal can resume immediately.

This is a maintenance / handoff pass only. It does not change product source, runtime behavior, UI behavior, storage schema, autosave semantics, cloud/account/public sharing, document model, Design Cockpit behavior, package config, or generated showcase artifacts.

## Starting sync state

- `git status --short --branch`: `main...origin/main`, with only `.serena/project.yml` dirty.
- `git fetch --prune origin`: completed.
- `git rev-list --left-right --count "HEAD...origin/main"`: `0 0`.
- Latest accepted commit before this handoff docs update: `ad04ee9 fix: govern text expression presets`.

## Current durable anchors

- Current state / restart map: `docs/CURRENT_STATE.md`.
- Invariants: `docs/INVARIANTS.md`.
- Interaction and reporting notes: `docs/INTERACTION_NOTES.md`.
- Review cockpit: `docs/PROJECT_COCKPIT.md`.
- Preset catalog: `docs/TEXT_EXPRESSION_PRESETS.md`.
- Accepted slice verification: `docs/verification/2026-07-06/text-expression-preset-governance.md`.
- Latest accepted broad showcase artifact, local ignored: `output/showcase/full-2026-07-05T20-43-23`.
- Latest accepted UI capture artifact, local ignored: `output/playwright/manual-verification-2026-07-05T20-46-28-951Z`.

If the ignored visual artifacts are not available in the next terminal, regenerate the relevant evidence instead of treating their absence as source drift:

```powershell
node scripts/capture-full-showcase.js
npm run test:ui:capture
```

## Accepted project state to preserve

- Built-in `monologue` is the upright standard inner-description preset.
- Explicit `tilted-monologue` carries the opt-in slanted inner-description behavior.
- `inner-voice` remains a valid legacy / strong inner voice preset, but it is not the canonical current monologue sample.
- Reader preview and Editor still share the textbox DSL projection path; no Reader-only renderer fork was introduced.
- Strikethrough and textbox preset parity are covered by the accepted slice verification note.
- Full showcase images `14`, `15`, `16`, and `19` have current review roles documented in `docs/verification/2026-07-06/text-expression-preset-governance.md`.

## Restart instructions

From another terminal:

```powershell
git pull --ff-only origin main
git status --short --branch
git rev-list --left-right --count "HEAD...origin/main"
```

Expected tracked state after pulling this handoff commit:

- Branch is `main...origin/main`.
- `git rev-list --left-right --count "HEAD...origin/main"` returns `0 0`.
- `.serena/project.yml` may still appear as local-only dirt on this machine; do not stage it for this handoff.

Then read, in order:

1. `docs/CURRENT_STATE.md`
2. `docs/INVARIANTS.md`
3. `docs/INTERACTION_NOTES.md`
4. `docs/PROJECT_COCKPIT.md`

Only use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` when selecting a new product slice.

## Validation for this handoff pass

Run before committing / pushing:

```powershell
npm run test:smoke
git diff --check
git diff --cached --check
```

## Boundaries

- Do not reopen storage schema, autosave semantics, cloud/account/public sharing, Design Cockpit redesign, or document model work from this handoff alone.
- Do not treat absence of ignored `output/` artifacts in a later terminal as committed source loss.
- Do not stage `.serena/project.yml`; it remains pre-existing local dirt for this slice.
