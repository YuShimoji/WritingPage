# Command Palette Markdown Source Dev Gate

## Purpose

After Rich text block align persistence, this fresh one-topic product slice
returned to editor surface clarity. Markdown source is a developer-oriented
escape hatch, so the normal command palette should not offer a source switch
that a writer cannot actually use.

## Selected Slice

- Family: Editor surface / command palette discoverability.
- Scope: Gate the `Markdown ソース` command through the existing developer-mode
  command filter and add focused command palette proof.
- Non-targets: WP-005 preview/comparison, Project import recovery, Rich heading,
  paragraph alignment behavior, storage/import/export schema, Electron shell,
  Markdown source removal.

## What Changed

- `js/command-palette.js` now marks `editor-surface-markdown` as `devOnly`.
- The command description now names the developer-mode boundary, so when the
  command is visible in developer mode it is clear that this is an escape hatch.
- `e2e/command-palette.spec.js` now proves both sides of the gate: the command
  is absent when developer mode is false and present again when developer mode
  is true.

## Validation

- `node --check js/command-palette.js`
- `node --check e2e/command-palette.spec.js`
- `npx playwright test e2e/command-palette.spec.js --workers=1 --reporter=line --grep "Markdown source command"`

## Active Authority Reconciliation

Follow-up audit target: active docs that could mislead the next owner after the
developer-mode gate. Runtime behavior stayed unchanged.

- `docs/INTERACTION_NOTES.md`: normal preview confirmation now points to Reader
  / MD preview, and Markdown source is called out as the developer-mode escape
  hatch. The concept diagram uses a `dev only` path for Markdown source.
- `docs/UI_SURFACE_AND_CONTROLS.md`: the editing-surface row now names
  developer-mode Markdown source instead of implying a normal surface.
- `docs/GADGETS.md`: the MarkdownPreview / TextEffects rows now use normal
  writing routes for Reader / Rich editing / MD preview and keep Markdown source
  separated as a developer-mode escape hatch.
- `docs/USER_REQUEST_LEDGER.md`: the MarkdownPreview migration boundary now
  names developer-mode Markdown source when describing built-in surfaces.
- `docs/ROADMAP.md`: the Local Mod lane boundary now treats Markdown source as
  developer-mode when warning against duplicated surfaces.
- Historical dated logs, superseded specs, and implementation-only uses of
  WYSIWYG / `data-ui-mode` were inspected but not rewritten.

## Trust Effect

The command palette is less likely to advertise an unusable editing surface to
regular writers. Rich editing remains the public editing surface, Reader remains
read-only review, and Markdown source remains available for developer-mode
inspection without becoming a normal daily-writing path.
