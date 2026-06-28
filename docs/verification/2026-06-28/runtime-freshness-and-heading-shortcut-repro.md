# Runtime Freshness and Heading Shortcut Repro

## Purpose

Re-check the user report that Web and Electron still reproduced the first-line
heading shortcut issue after `42299f9 fix: handle first-line rich heading
shortcut`. This pass does not treat that fix as accepted until launched
artifacts are inspected.

## Finding

- Source `js/editor-wysiwyg.js` contained the `42299f9` first-line root fix.
- `dist/js/editor-wysiwyg.js` was stale before this pass: it had the
  `89bcccf` spellcheck fix but did not contain the root `replaceChildren`
  first-line shortcut path.
- `build/win-unpacked/resources/app.asar` was also older than this pass and
  needed a fresh Electron dir build before packaged-app verification.
- This makes stale launched artifacts the credible cause of the user seeing the
  same behavior in both Web and Electron after the source commit.

## Action

- Ran `npm run build` to refresh `dist/`.
- Confirmed `dist/js/editor-wysiwyg.js` now contains the direct-root text node
  handling and `replaceChildren(heading)` path.
- Ran `npm run electron:build` to refresh `build/win-unpacked`.
- Extracted `js/editor-wysiwyg.js` from the refreshed app asar and confirmed it
  contains both the native spellcheck guard and the first-line root shortcut fix.

## Real-Path Readback

Opening `dist/index.html` directly with Playwright, the initial Rich editing
surface started as an empty contenteditable root. Typing `#` + Space produced:

```json
{
  "html": "<h1><br></h1>",
  "h1": 1,
  "h1Border": "1px solid rgb(0, 0, 0)",
  "spellcheck": "false"
}
```

The horizontal line is therefore the intentional H1 border style, not a failed
heading conversion and not the native IME/spellcheck residual.

## Boundaries

- No source code changes were needed in this pass.
- No IME/spellcheck behavior changed.
- No heading typography redesign was made.
- No storage, import/export, command palette, launcher behavior, Markdown source
  gate, WP-005, Project import recovery, or effect settings behavior changed.

## Verification

- `git fetch --prune origin`
- `git pull --ff-only origin main`
- `git rev-list --left-right --count "HEAD...@{u}"` -> `0 0`
- `npm run build`
- `npm run electron:build`
- asar extract readback for `js/editor-wysiwyg.js`
- direct `dist/index.html` Playwright readback for first-line `#` + Space
- `npm run app:update:dry-run`
- `npx playwright test e2e/wysiwyg-editor.spec.js --workers=1 --reporter=line --grep "heading shortcut converts|initial empty first line|heading shortcut does not run during IME composition|native spellcheck|heading shortcut undo"` -> 7 passed
- `git diff --check`
