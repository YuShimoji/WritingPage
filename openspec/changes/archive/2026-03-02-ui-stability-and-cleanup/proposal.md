# OpenSpec Change Proposal: UI Stability and Cleanup

## Summary
Address UI stability issues and clean up hardcoded elements to improve user experience and maintainability.

## Why
A stable and clean UI is essential for a focused writing experience. Removing hardcoded, unrequested features and providing clear mechanisms for UI interaction (tabs, gadgets) ensures the tool remains predictable and customizable.

## Problem
- Sidebar tabs (Gadget and Wiki) cannot be switched in the initial monolithic implementation.
- Loadout is not gadgetized and cannot be saved/restored easily.
- Wiki help content is missing or inaccessible.
- Top menu has unnecessary elements like a calendar and non-optional writing goals.
- Writing goal UI has non-customizable sudden color changes.

## Goal
- Implement functional tab switching in sidebar.
- Gadgetize loadout management.
- Add Wiki help functionality.
- Remove unrequested elements and make goals optional.
- Improve UI feedback controls.
- Document word count behavior.

## What Changes
- Refactored `SidebarManager.js` to handle dynamic tab switching and state preservation.
- Created `gadgets-loadout.js` to manage UI presets.
- Implemented `showHelp()` in `gadgets-wiki.js`.
- Cleaned up `index.html` to remove calendar and unify toolbar structure.
- Updated `app.js` and `gadgets-goal.js` for smoother goal UI transitions.
- Added documentation for space-based word counting.
