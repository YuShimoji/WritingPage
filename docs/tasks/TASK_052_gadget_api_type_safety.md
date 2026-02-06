# Task: Gadget API Type Safety
Status: OPEN
Tier: 2
Branch: chore/gadget-types
Owner: Worker
Created: 2026-02-03T13:55:00+09:00

## Objective
Add JSDoc/Types validation for `ZWGadgets.register()` to prevent runtime errors.

## Context
- `registerGadget` accepts an object, but required fields aren't strictly validated at runtime, leading to silent failures or hard-to-debug UI issues.

## Focus Area
- `js/gadgets-core.js`

## DoD
- [ ] Add JSDoc types for Gadget Definition.
- [ ] Add runtime validation in `ZWGadgets.register`.
- [ ] Log useful errors if validation fails.
