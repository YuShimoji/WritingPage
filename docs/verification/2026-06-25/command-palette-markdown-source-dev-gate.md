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

## Trust Effect

The command palette is less likely to advertise an unusable editing surface to
regular writers. Rich editing remains the public editing surface, Reader remains
read-only review, and Markdown source remains available for developer-mode
inspection without becoming a normal daily-writing path.
