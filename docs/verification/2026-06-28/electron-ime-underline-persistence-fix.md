# Electron IME Underline Persistence Fix

## Purpose

After the paint-only `compositionend` repaint hook, the browser path was covered,
but the Electron Rich editing surface could still show a thin native underline
after Japanese IME confirmation. The reported behavior matched a native
contenteditable spellcheck/composition decoration cache: clicking or repainting
elsewhere did not reliably clear it, while editing inside the affected sentence
did.

## Change

- `#wysiwyg-editor` now declares `spellcheck="false"` in `index.html`.
- `RichTextEditor.init()` also enforces `spellcheck=false` on the live
  contenteditable element, so restored or test-created surfaces keep the same
  contract.
- `compositionend` re-applies the same native spellcheck-off guard before the
  existing paint-only repaint tick.
- The textarea spell checker and Electron `BrowserWindow` settings were left
  unchanged, keeping the fix scoped to the Rich editing contenteditable surface.

## Boundaries

- No editor HTML rewrite, Markdown sync rewrite, storage/import/export change,
  launcher change, packaging redesign, Chromium upgrade, typed heading semantic
  change, or rich decoration persistence change.
- Native OS IME painting still requires manual visual confirmation in the
  packaged Electron app; this slice automates the app-owned surface contract and
  non-destructive repaint behavior.

## Verification

- `node --check js/editor-wysiwyg.js`
- `node --check e2e/wysiwyg-editor.spec.js`
- `npx playwright test e2e/wysiwyg-editor.spec.js --workers=1 --reporter=line --grep "IME compositionend|native spellcheck|heading shortcut does not run during IME composition|heading shortcut undo"`
- `npm run lint:js:check`
- `npm run build`
- `npm run electron:build`
- `npx markdownlint docs/verification/2026-06-28/electron-ime-underline-persistence-fix.md`
- `git diff --check`
