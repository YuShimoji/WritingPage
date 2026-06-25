# WP-005 MD Preview Rich Preview Activation

## Purpose

WP-005 Slice B makes the existing MD preview usable as an editor-adjacent
rich-preview surface. Slice A already retired stale public comparison entries;
this slice keeps comparison deferred and proves that MD preview can render rich
Markdown/DSL output during editing without entering the Reader overlay.

## Selected Slice

- Family: WP-005 / preview and comparison entry cleanup.
- Scope: MD preview visibility, rich preview update proof, typing/scroll
  controller activation proof.
- Non-targets: chapter compare, snapshot diff, SplitView redesign, Reader
  redesign, Project import recovery, Rich heading, GitHub cleanup, AGENTS rules.

## What Changed

- Kept the current MD preview activation path through
  `ZenWriterEditor.togglePreview()` / `js/editor-preview.js`.
- Fixed the product-visible preview panel by excluding `#editor-preview` from
  the generic offscreen `[aria-live]` CSS rule. Before this, the panel opened
  and rendered but could be positioned offscreen as an accessibility-only live
  region.
- Added a focused WP-005 E2E that opens MD preview from the command palette,
  verifies rendered heading / typing / scroll DSL output, proves
  `TypingEffectController` and `ScrollTriggerController` activation attributes
  on the preview DOM, updates editor content while the preview is open, and
  confirms Reader overlay and SplitView remain closed.

## Validation

- `node --check e2e/wp005-md-preview-rich-preview.spec.js`
- `npx playwright test e2e/wp005-md-preview-rich-preview.spec.js --workers=1 --reporter=line`

## Trust Effect

MD preview now has a concrete product proof as an editing-adjacent rendered
surface: it is visible when opened, refreshes from editor content changes, and
activates rich preview controllers. Reader remains the read-only review overlay,
and comparison remains isolated for a future WP-005 Slice C.
