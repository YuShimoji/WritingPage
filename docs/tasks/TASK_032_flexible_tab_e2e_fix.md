# Task: 柔軟タブ配置 E2E テスト修正

Status: OPEN
Tier: 1
Branch: main
Owner: Worker
Created: 2026-01-17T02:00:00+09:00
Report: (未作成)

## Objective

- 柔軟タブ配置機能の E2E テスト（`e2e/flexible-tab-placement.spec.js`）で失敗しているテストケースを修正する
- タブ配置変更（右配置）のテストがタイムアウトしている問題を解決する

## Context

- `js/sidebar-manager.js` に applyTabPlacement, saveTabPlacement, getTabOrder 等は実装済み
- E2E テスト結果: 一部失敗（should change tab placement to right and persist）
- 実装は存在するがテストのセレクタまたは待機条件に問題がある可能性

## Focus Area

- `js/sidebar-manager.js`（タブ配置機能）
- `js/gadgets-editor-extras.js`（タブ順序変更 UI）
- `e2e/flexible-tab-placement.spec.js`（E2E テスト）

## Forbidden Area

- `.shared-workflows/**`（submodule 内の変更は禁止）

## Constraints

- テスト: `npx playwright test e2e/flexible-tab-placement.spec.js` で全テスト成功
- 外部通信: 不要（クライアントサイドのみ）

## DoD

- [ ] 失敗している E2E テストがすべて成功する
- [ ] 既存の成功テストが引き続き成功する
- [ ] 実装変更の場合、意図しない副作用がないことを確認
- [ ] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- タイムアウトの原因はセレクタ、待機条件、または CSS/DOM 構造の問題の可能性
- まず失敗テストを個別に `--debug` オプションで実行し、問題を特定することを推奨

## 停止条件

- Forbidden Area に触れないと完遂できない
- 仕様の仮定が 3 つ以上必要
- 既存の成功テストが失敗するような変更が必要
