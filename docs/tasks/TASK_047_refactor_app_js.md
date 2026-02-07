# Task: app.js Refactoring
Status: OPEN
Tier: 2
Branch: refactor/app-js
Owner: Worker
Created: 2026-02-03T13:55:00+09:00

## Objective
Refactor `js/app.js` (currently >1400 lines) into smaller modules.
Target modules: `AppCore`, `AppUI`, `AppEvents`.

## Context
- `js/app.js` is the main entry point but manages too many responsibilities (layout, global events, dialogs).
- Needs splitting to allow component-level testing.

## Focus Area
- `js/app.js`
- `js/modules/app/` (New directory)

## Forbidden Area
- Changing the initialization flow critically (must ensure `window.app` remains valid if used elsewhere)

## DoD
- [ ] `js/app.js` reduced to < 500 lines.
- [ ] Event listeners isolated in `AppEvents.js`.
- [ ] UI setup code isolated in `AppUI.js`.
- [ ] `npm run test:smoke` passes.
