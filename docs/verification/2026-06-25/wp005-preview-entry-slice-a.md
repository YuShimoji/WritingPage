# WP-005 Preview Entry Slice A

## Purpose

WP-005 Slice A cleans up stale public entry points around preview and comparison. The goal is not a full preview redesign; it is to stop the old split-view comparison path from looking like a current writing workflow entry while keeping the future comparison implementation isolated for Slice C.

## Selected Slice

- Family: WP-005 / preview and comparison entry cleanup.
- Scope: retire public split-view comparison entry points from structure sidebar, command palette, and Electron menu.
- Non-targets: rich preview implementation, Reader rendering redesign, chapter comparison redesign, snapshot diff redesign, storage/import/export, Project import recovery, Rich heading, GitHub cleanup.

## What Changed

- Removed the public structure-sidebar `章比較` and `スナップショット差分` buttons.
- Removed the Electron menu item that opened the chapter comparison split view.
- Removed renderer IPC and click handlers that existed only to open that public split-view route.
- Hid command palette `compare-chapter` and `compare-snapshot` commands so they no longer appear as current public entries.
- Removed CSS dedicated to the retired sidebar comparison controls.
- Updated `e2e/ui-mode-consistency.spec.js` so the contract is now explicit: public structure UI and normal command palette do not expose comparison entries, and the split view remains closed.

## Validation

- `node --check js/app-ui-events.js`
- `node --check js/command-palette.js`
- `node --check js/electron-bridge.js`
- `node --check electron/main.js`
- `node --check electron/preload.js`
- `node --check e2e/ui-mode-consistency.spec.js`
- `git diff --check`
- `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line --grep "WP-005 Slice A"`
- `npm run lint:js:check`
- `npx markdownlint docs/verification/2026-06-25/wp005-preview-entry-slice-a.md`

## Trust Effect

The current preview entry model is clearer: MD preview remains the editor-adjacent rendering panel, Reader remains the read-only review overlay, and comparison is no longer presented as a normal entry before WP-005 Slice C defines its future shape.
