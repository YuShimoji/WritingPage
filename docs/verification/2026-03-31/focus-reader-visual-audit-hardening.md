# 2026-03-31 Focus / Reader / Visual Audit Hardening

## Scope

- Make `e2e/visual-audit.spec.js` detect screenshot collapse instead of silently refreshing near-identical images
- Fix Focus mode layout regressions around toolbar hiding and left edge panel overlap
- Fix Reader preview fallback so existing content is rendered instead of the empty state
- Remove the edit-mode return bar overlay after leaving Reader and stabilize Reader -> Focus round-trip

## User-visible issues addressed

- Visual audit screenshots were being refreshed without proving the UI states were actually different
- Focus mode hid the toolbar visually but left a top gap in the editor layout
- Focus mode left panel could overlap the writing surface
- Reader mode could show `コンテンツがありません` even when the current document already had content
- Leaving Reader could leave a large return bar over the editing UI
- Clicking the Reader back button from Focus could fall through to `normal` because a stale click listener was still attached

## Fixes applied

- `e2e/visual-audit.spec.js`
  - Switched sample loading to the real content/save path through `ZWContentGuard`
  - Added screenshot hash diversity checks
  - Normalized sidebar audit setup so each accordion is captured in a distinct state
  - Updated help / Focus / WYSIWYG / left dock / loadout captures to use real UI flows

- `css/style.css`
  - Hide the toolbar with fixed positioning in Focus so it no longer reserves layout height
  - Shift the editor surface when the Focus left panel is active so it does not overlap the writing area

- `js/app.js`
  - Keep root toolbar-hidden state aligned with `setUIMode()` for `focus` and `reader`

- `js/reader-preview.js`
  - Fall back to current editor/document content when chapter data is empty
  - Stop showing the large return bar after exiting Reader
  - Make the Reader back button binding idempotent so stale listeners do not force a `focus -> reader -> normal` fallthrough

- `e2e/ui-mode-consistency.spec.js`
  - Added regressions for Focus top-gap removal, Focus left-panel overlap, and Reader empty-state fallback

- `e2e/reader-preview.spec.js`
  - Updated Reader return-flow assertions to match the current UI contract
  - Re-enter Reader through the toolbar toggle instead of the removed compact quick entry

- `e2e/sp081-reader-audit.spec.js`
  - Updated Reader re-entry audit to use the current toolbar-driven flow

## Verification

- `npx playwright test e2e/visual-audit.spec.js --reporter=line`
  - result: 22 passed

- `npx playwright test e2e/ui-mode-consistency.spec.js e2e/reader-preview.spec.js e2e/sp081-reader-audit.spec.js --reporter=line --workers=1`
  - result: 30 passed

- `node -c js/reader-preview.js`
  - result: passed

## Manual follow-up worth checking

- Confirm the Reader toolbar button styling is acceptable next to the edit-mode controls
- Confirm Focus left-panel spacing still feels right on your usual window sizes, not only in automated viewport checks
