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

## Test Phase
Stable

## Test Plan
- テスト対象: `ZWGadgets.register()` の入力検証、型不正時ログ、正規入力時の登録成功
- テスト種別: Unit（必須）, Smoke（必須）, Build（推奨）
- 期待結果:
  - 必須フィールド欠落時に可観測なエラー出力が行われる
  - 正常入力時は既存ガジェット登録が継続して成功する
  - `npm run test:smoke` が成功

## Milestone
- SG-1（Batch 1 の実装着手順序を確定）
- MG-1（リファクタリングと型安全化の完了）

## 停止条件
- 既存ガジェット定義の大半が互換外となる場合は停止し、移行レイヤー設計を先行する。
