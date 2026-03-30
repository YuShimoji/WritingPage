# 2026-03-30 hidden `ui-mode-select` removal

## Scope

- Stop relying on the hidden `#ui-mode-select` compatibility control in `index.html`
- Stop syncing UI mode state through the removed select in `js/app.js`
- Keep command palette mode switching working via `ZenWriterApp.setUIMode()` and visible mode buttons

## Files changed

- `js/app.js`
- `js/command-palette.js`

## Verification

- `npx eslint js/app.js js/command-palette.js`
  - result: passed
- Temporary Playwright spec
  - scenario: command palette switches `normal -> focus -> normal`
  - result: 1 passed
- `npx playwright test e2e/sidebar-writing-focus.spec.js e2e/ui-mode-consistency.spec.js e2e/sidebar-layout.spec.js --reporter=line`
  - result: 18 passed

## Notes

- The hidden select still exists in `index.html` as dormant compatibility DOM. This slice only removed runtime dependence on it.
- `e2e/ui-mode-consistency.spec.js` now matches the current focus-mode contract: the sidebar remains mounted but closed with `aria-hidden="true"`.
- Sidebar accordion initialization also needed a guard in `js/sidebar-manager.js` so the bulk-toggle button does not throw when the chevron icon is no longer a direct child node.
