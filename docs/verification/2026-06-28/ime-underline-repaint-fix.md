# IME Underline Repaint Fix

## Purpose

Japanese IME confirmation could leave a thin native composition underline in
Rich editing until another screen repaint occurred. The launcher path was only
where the issue was observed; the target is the Rich editing composition/repaint
boundary.

## Change

- Added a paint-only repaint tick after `compositionend` in `js/editor-wysiwyg.js`.
- The repaint tick temporarily sets `data-ime-repaint='pending'`, then removes
  it after two animation frames.
- The hook does not change editor HTML, Markdown content, selection, storage, or
  Undo behavior.
- Added a focused Playwright regression proving synthetic composition end runs
  the repaint hook while keeping content and selection intact.

## Boundaries

- No launcher, storage, import/export, command palette, Markdown source, typed
  heading semantics, or rich decoration persistence behavior changed.
- Native OS IME painting itself cannot be fully reproduced in headless
  automation; this slice covers the app-owned repaint trigger and leaves final
  native visual confirmation as review debt if needed.

## Verification

- `node --check js/editor-wysiwyg.js`
- `npx playwright test e2e/wysiwyg-editor.spec.js --workers=1 --reporter=line --grep "IME compositionend|heading shortcut does not run during IME composition|heading shortcut undo"`
- `npm run lint:js:check`
- `git diff --check`
