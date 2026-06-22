# Rich Heading Placeholder Polish

Date: 2026-06-22

## Purpose

Consume the user review intake for the Rich editing typed heading shortcut and
fix the remaining empty-heading placeholder / caret visual debt without changing
shortcut semantics or IME handling.

## Current State Readback

- Branch: `main`.
- `git fetch --prune origin` found `origin/main` ahead of the local checkout.
- `git pull --ff-only origin main` fast-forwarded local `main` from `b56e925`
  to `05c3379`.
- Post-pull check: `git status --short --branch` showed clean
  `## main...origin/main`.
- Post-pull comparison: `git rev-list --left-right --count HEAD...origin/main`
  returned `0 0`.

## Review Intake Consumed

The attached user/supervisor review reported the Microsoft IME and direct
`#` / `##` / `###` + Space shortcut behavior as functionally OK. The remaining
issue was visual: after shortcut conversion, the empty heading placeholder
`章タイトルを入力` could briefly compete with the caret before the user typed the
heading text.

Interpretation:

- Target: Rich editing typed heading shortcut empty heading state.
- Intent: keep the shortcut behavior and IME guard unchanged, but remove the
  placeholder / caret visual friction.
- Constraint: CSS-first, narrow polish only; no general Markdown shortcut work.
- Confidence: high.

## Change

- `css/style.css` now keeps the empty heading placeholder out of normal text
  flow by positioning the `::before` hint absolutely.
- The placeholder pseudo-element is not generated while the Rich editing surface
  has focus, so it cannot push or appear to sit before the caret during active
  typing.
- The placeholder remains available when the heading is empty and the editor is
  not focused.
- `e2e/wysiwyg-editor.spec.js` adds focused coverage that the active empty
  heading has no generated placeholder content during editing, then regains the
  hint after focus leaves the editor.

## Intentionally Untouched

- No changes to `js/editor-wysiwyg.js`.
- No changes to `#` / `##` / `###` shortcut semantics.
- No changes to IME composition gating.
- No storage/import/export, Electron/package, dependency, DB/auth/API, GitHub
  Issue / PR, embed security, or AGENTS behavior changes.

## Validation

- `node --check e2e/wysiwyg-editor.spec.js` passed.
- `git diff --check` passed before docs were added.
- `npx playwright test e2e/wysiwyg-editor.spec.js --workers=1 --reporter=line --grep "heading shortcut"` passed: 11 passed.
- `npm run lint:js:check` passed.

## Review State

Required user-side work: none.

Review debt is resolved for the submitted intake because the reported functional
IME path stayed unchanged and the placeholder / caret debt is now covered by a
focused automated readback. A later human visual feel check may still be useful
before release, but it is not a blocker for this slice.
