# WP-005 Comparison Isolation Slice C

## Purpose

WP-005 Slice C closes the preview/comparison cleanup lane by isolating
comparison material from the current public writing workflow. Slice A retired
public split-view entries, and Slice B restored MD preview as a visible
rich-preview surface. This slice keeps comparison as future/internal material
instead of a hidden command path inside preview, Reader, sidebar, or command
palette flows.

## Selected Slice

- Family: WP-005 / preview and comparison entry cleanup.
- Scope: command palette comparison route removal, public sidebar wording,
  future/internal split-view boundary, focused public-surface proof.
- Non-targets: new comparison UI, Reader redesign, MD preview redesign,
  Project import recovery, Rich heading, GitHub cleanup, AGENTS rules.

## What Changed

- Removed hidden `compare-chapter` and `compare-snapshot` command definitions
  from `js/command-palette.js`. They were not visible after Slice A, but still
  kept executable comparison routing in the command registry source.
- Updated the structure category description in `js/sidebar-manager.js` so the
  public sidebar no longer describes the structure area as containing
  comparison.
- Marked `js/split-view.js` as future comparison surface material in its file
  header. The implementation remains loaded and hidden, but it is not wired to
  public MD preview, Reader, command palette, sidebar, or Electron menu routes.
- Extended the focused WP-005 UI-mode E2E so searches for `compare`, `比較`,
  and `差分` do not expose comparison commands or categories, and opening MD
  preview / Reader does not open SplitView.

## Validation

- `node --check js/command-palette.js`
- `node --check js/sidebar-manager.js`
- `node --check js/split-view.js`
- `node --check e2e/ui-mode-consistency.spec.js`
- `git diff --check`
- `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line --grep "WP-005 Slice C"`
- `npm run lint:js:check`
- `npx markdownlint docs/verification/2026-06-25/wp005-comparison-isolation-slice-c.md`

## Trust Effect

WP-005 now has a clean three-way boundary: MD preview is the editor-adjacent
rich preview, Reader is the read-only review overlay, and comparison is not a
current public writing workflow. Future comparison work should start from a
dedicated comparison surface or file-comparison design, not from MD preview or
Reader.
