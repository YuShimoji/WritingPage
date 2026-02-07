# Task: editor.js Refactoring
Status: OPEN
Tier: 2
Branch: refactor/editor-js
Owner: Worker
Created: 2026-02-03T13:55:00+09:00

## Objective
Refactor `js/editor.js` (currently >1700 lines) into smaller, strictly defined modules to improve maintainability and testability.
Target modules: `EditorCore`, `EditorSearch`, `EditorUI`.

## Context
- `js/editor.js` has become a monolithic file combining core logic, UI handling, and search functionality.
- It exceeds the soft limit of 500 lines by a large margin.
- This blocks efficient parallel development and unit testing.

## Focus Area
- `js/editor.js`
- `js/modules/editor/` (New directory)

## Forbidden Area
- Changing the external API of `EditorManager` (Must maintain backward compatibility for now)
- `js/app.js` (unless strictly necessary for instantiation)

## DoD
- [ ] `js/editor.js` is reduced to < 500 lines or removed entirely (replaced by an index).
- [ ] Search logic is isolated in `js/modules/editor/EditorSearch.js`.
- [ ] UI event handlers are isolated in `js/modules/editor/EditorUI.js`.
- [ ] Core editing logic remains in `js/modules/editor/EditorCore.js`.
- [ ] `npm run test:smoke` passes.
- [ ] `npm run test:e2e` passes.
