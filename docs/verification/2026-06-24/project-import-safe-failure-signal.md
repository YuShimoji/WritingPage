# Project Import Safe Failure Signal

## Purpose

This product slice returns to the Editor Trust lane after Rich heading closure by making failed JSON project import recovery visible to the writer. The storage path already kept existing documents unchanged; this pass makes the UI say that explicitly.

## Selected Slice

- Family: Project Recovery / failed import recovery.
- Scope: JSON project import failure notification only.
- Non-targets: import schema, export schema, storage mutation rules, cloud sync, Electron packaging, Rich heading, broad docs cleanup, GitHub cleanup.

## What Changed

- Added `PROJECT_IMPORT_SAFE_FAILURE` to `window.UILabels`.
- Documents `入出力 > JSON読み込み` now reports: `JSON読み込みに失敗しました。現在の文書は保持されています。`
- JSON drag/drop import and Electron menu import use the same safe-failure message when the import returns `null`.
- `e2e/editor-trust-workflow.spec.js` now asserts the recovery signal during the invalid JSON import path, in addition to the existing current-doc and docs-snapshot invariance checks.
- `docs/EDITOR_TRUST_WORKFLOW.md` now records that failed JSON import should tell the writer the current document was kept.

## Validation

- `node --check js/ui-labels.js`
- `node --check js/gadgets-documents-hierarchy.js`
- `node --check js/app.js`
- `node --check js/electron-bridge.js`
- `node --check e2e/editor-trust-workflow.spec.js`
- `git diff --check`
- `npx playwright test e2e/editor-trust-workflow.spec.js --workers=1 --reporter=line`
- `npm run lint:js:check`

## Trust Effect

This does not claim a new import capability. It reduces recovery uncertainty: after a malformed JSON import, the writer sees that the current manuscript is still the active safe copy, while the focused test continues to prove the underlying document snapshot did not change.
