# Heading Shortcut First-Line Boundary

## Purpose

Follow up the Rich editing typed heading shortcut after user observation showed
that `#` + Space on the first line of a freshly opened editor did not enter the heading
state, while later-line shortcuts did. This is separate from the Electron IME
underline residual work.

## Finding

- The startup Rich editing surface can be an empty contenteditable root with no
  initial paragraph wrapper.
- Existing typed heading shortcut detection only accepted `P` / `DIV` block
  containers, so root-level text created by first-line `#` + Space was ignored.
- The black horizontal line shown after successful `#` + Space conversion is app-owned
  H1 styling: `#wysiwyg-editor h1` uses `border-bottom:
  var(--heading-h1-border-bottom)`, and the default variable is
  `1px solid #000`. It is not the native IME underline or spellcheck residual.

## Change

- `_getShortcutBlock()` now treats the Rich editing root as the block only when
  the selection is directly on that root or a direct root text node.
- `_applyTypedHeadingShortcut()` replaces root contents with the new heading in
  that startup-only path, while preserving the existing paragraph/div replacement
  path for normal blocks.
- Added focused Playwright coverage for `#` + Space on the initial empty first line.

## Boundaries

- No IME/spellcheck behavior changed.
- No broad heading typography redesign; the H1 border remains intentional
  app-owned styling.
- No storage, import/export, command palette, launcher, Markdown source gate,
  Electron packaging, or Rich text block align behavior changed.

## Verification

- `node --check js/editor-wysiwyg.js`
- `node --check e2e/wysiwyg-editor.spec.js`
- `npx playwright test e2e/wysiwyg-editor.spec.js --workers=1 --reporter=line --grep "heading shortcut converts|initial empty first line|heading shortcut does not convert hashtag text|heading shortcut only converts at the start of a block|heading shortcut ignores unsupported deep heading markers|heading shortcut does not run during IME composition|native spellcheck|heading shortcut undo"`
- `npm run lint:js:check`
- `npx markdownlint docs/verification/2026-06-28/heading-shortcut-first-line-boundary.md`
- `git diff --check`
