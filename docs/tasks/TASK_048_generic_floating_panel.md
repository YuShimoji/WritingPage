# Task: Generic Floating Panel
Status: OPEN
Tier: 3
Branch: feat/generic-floating-panel
Owner: Worker
Created: 2026-02-03T13:55:00+09:00

## Objective
Allow ANY gadget (not just specific ones) to be detached into a floating panel.
Generalize the logic from TASK_029/TASK_030.

## Context
- Currently, only `structure` or specific panels might support floating behavior nicely.
- Goal is to have a "Detach" button on every gadget header.

## Focus Area
- `js/gadgets-core.js`
- `js/floating-panel.js` (if exists) or new module
- `css/style.css`

## DoD
- [ ] "Detach" button added to standard Gadget Header.
- [ ] Clicking Detach creates a floating panel containing the gadget.
- [ ] Closing floating panel returns gadget to sidebar (or hides it, depending on spec).
- [ ] State (floating vs docked) is persisted.
- [ ] E2E tests for detach/attach flow.
