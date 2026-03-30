# 2026-03-30 Reader / Sidebar Stabilization

## Scope

This note records the hotfix context for the Reader/edit round-trip regressions reported after the earlier SP-081 stabilization work.

## User-visible symptoms

- A blank area appeared on the right after clicking the hamburger menu.
- When the sidebar was docked right, the sidebar itself did not behave like a true right-side panel.
- Edit mode no longer had an obvious Reader entry in the compact toolbar.

## Root causes found

1. Right dock layout was being overridden by a generic sidebar open rule.
   - `css/style.css` had `.sidebar.open { left: 0 !important; }`
   - This overrode the right-dock rules in `css/dock-panel.css`, so layout margins switched to right-dock mode while the actual sidebar still opened from the left.

2. Reader entry existed only in the full toolbar path.
   - The existing Reader toggle was in `.toolbar-actions`, which is hidden in the default compact toolbar.
   - As a result, edit mode could still enter Reader programmatically, but the normal compact UI did not expose an obvious control.

## Fixes applied

- `css/style.css`
  - Removed the `!important` override from `.sidebar.open` so right-dock layout can win when `data-dock-sidebar="right"` is active.

- `js/reader-preview.js`
  - Added `ensureQuickToggleButton()`.
  - This creates `#quick-toggle-reader-preview` inside `.toolbar-quick-actions` when the compact toolbar is active.
  - Both the compact button and the existing toolbar button now share the same Reader toggle binding through `[data-reader-preview-toggle]`.

- `e2e/sidebar-layout.spec.js`
  - Added a regression test that switches to right dock, opens the sidebar, and verifies the sidebar opens on the right while main content uses right margin.

- `e2e/reader-preview.spec.js`
  - Added a regression test that verifies the compact toolbar exposes a Reader entry and that the button enters Reader mode.

## Verification

Command run on 2026-03-30:

```bash
npx playwright test e2e/sidebar-layout.spec.js e2e/reader-preview.spec.js --workers=1
```

Result:

- 18 passed
- 0 failed

## Files to inspect first if this regresses again

- `css/style.css`
- `css/dock-panel.css`
- `js/reader-preview.js`
- `e2e/sidebar-layout.spec.js`
- `e2e/reader-preview.spec.js`

## Quick debugging hints

- If a right-side blank area returns, compare the computed `left` and `right` values on `#sidebar` while `data-dock-sidebar="right"` is set.
- If the Reader entry disappears again, check whether compact mode is hiding `.toolbar-actions` and whether `#quick-toggle-reader-preview` is present inside `.toolbar-quick-actions`.
