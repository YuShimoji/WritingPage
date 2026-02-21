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

## Test Phase
Stable

## Test Plan
- テスト対象: `window.app` の公開参照維持、`AppCore`/`AppUI`/`AppEvents` 分割後の初期化フロー
- テスト種別: Unit（推奨）, Smoke（必須）, E2E（推奨）, Build（推奨）
- 期待結果:
  - 起動時に `window.app` が既存仕様どおり利用可能
  - `npm run test:smoke` が成功
  - 主要E2Eシナリオで初期化失敗が発生しない

## Milestone
- SG-1（Batch 1 の実装着手順序を確定）
- MG-1（リファクタリングと型安全化の完了）

## 停止条件
- 初期化順序変更により既存機能の広範な回帰が避けられない場合は停止し、段階移行案へ切り替える。
