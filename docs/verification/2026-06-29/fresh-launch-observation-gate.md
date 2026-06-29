# Fresh Launch Observation Gate

## Purpose

Record the supervisor review for `runtime-freshness-and-heading-shortcut-repro`
and preserve the current work judgment after syncing from remote on 2026-06-29.

## Supervisor Alignment

- The supervisor accepted the stale artifact diagnosis.
- The source fix is not considered suspect at this point.
- The previous user-visible reproduction in both Web and Electron is best
  explained by stale launched artifacts: `dist/` and Electron `app.asar`.
- The black horizontal line after successful first-line `#` + Space conversion
  is the intentional H1 border, not evidence by itself of a failed shortcut or
  native IME / spellcheck underline.

The supervisor log named `2e68c0e docs: record heading shortcut runtime
freshness` as the latest commit. In the live repo, `2e68c0e` is the latest
product-proof context for this artifact; the actual `HEAD` at the start of this
pass was `dee4221 docs: record cross-terminal handoff`, which is a docs-only
handoff commit and does not change the product judgment.

## Work Judgment

Agent-owned implementation is complete for this slice. No source code,
launcher, package script, UI copy, or typography change is needed from the
current evidence.

The remaining gate is user-side visual observation from a fresh launch:

1. Close old Zen Writer browser / Electron windows.
2. For Web confirmation, launch through `Zen Writer Update and Launch`.
3. For Electron packaged confirmation, use the refreshed
   `build\win-unpacked\Zen Writer.exe` after `npm run electron:build`.
4. Check only whether first-line `#` + Space becomes an H1 and whether the
   visible black line is only the H1 border.

## Agent-Side Freshness Check

Completed in this pass after `git fetch --prune origin` and
`git pull --ff-only origin main`:

- `git rev-list --left-right --count "HEAD...origin/main"` -> `0 0`
- `npm run app:update:dry-run` -> pass; dry-run confirmed the clean-worktree
  update/build/open route without mutating build output
- `npm run build` -> pass; refreshed `dist/`
- `npm run electron:build` -> pass; refreshed `build/win-unpacked`
- `rg -n "replaceChildren\(heading\)|parent === this\.wysiwygEditor|spellcheck" js\editor-wysiwyg.js dist\js\editor-wysiwyg.js` -> source and `dist` both contain the spellcheck guard and first-line root shortcut path
- `npx playwright test e2e/wysiwyg-editor.spec.js --workers=1 --reporter=line --grep "heading shortcut converts|initial empty first line|heading shortcut does not run during IME composition|native spellcheck|heading shortcut undo"` -> 7 passed
- Direct `dist/index.html` Playwright readback after typing `#` + Space:

```json
{
  "html": "<h1><br></h1>",
  "text": "\n",
  "h1": 1,
  "spellcheck": "false",
  "h1Border": "1px solid rgb(0, 0, 0)"
}
```

## Boundary

- This pass does not approve new source changes.
- This pass does not infer user visual confirmation.
- Do not reopen IME underline, heading shortcut logic, launcher behavior,
  effect settings, Markdown source gate, WP-005, Project import recovery, or
  rich text block alignment unless the fresh-launch observation gives new
  evidence.
