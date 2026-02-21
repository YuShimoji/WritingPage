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

## Test Phase
Stable

## Test Plan
- テスト対象: `EditorManager` の公開インターフェース互換性、`EditorCore`/`EditorSearch`/`EditorUI` の分割後連携
- テスト種別: Unit（推奨）, E2E（必須）, Smoke（必須）, Build（推奨）
- 期待結果:
  - 既存呼び出し側から `EditorManager` 利用時に破壊的変更がない
  - `npm run test:smoke` が成功
  - `npm run test:e2e` が成功

## Milestone
- SG-1（Batch 1 の実装着手順序を確定）
- MG-1（リファクタリングと型安全化の完了）

## 停止条件
- `EditorManager` の外部互換を維持できない構造変更が必要と判明した場合は停止し、設計見直しを要求する。
