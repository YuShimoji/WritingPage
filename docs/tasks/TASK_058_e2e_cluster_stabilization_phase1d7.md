# Task: E2E高頻度失敗クラスター収束（Phase 1d-7）

Status: OPEN
Tier: 1
Branch: chore/e2e-phase1d7-clusters
Owner: Worker
Created: 2026-02-16T13:50:00+09:00

## Objective

`npm run test:e2e:ci` の失敗 101 件を、共通前提の崩れを修正して段階的に削減する。
まずは上位クラスター（responsive-ui / tags-smart-folders / decorations / ui-editor）を優先し、再現性の高い安定化を行う。

## Baseline

- Command: `npm run test:e2e:ci`
- Result: `101 failed / 66 passed / 167 total` (2026-02-16)

## Scope (Focus Area)

- `e2e/responsive-ui.spec.js`
- `e2e/tags-smart-folders.spec.js`
- `e2e/decorations.spec.js`
- `e2e/ui-editor.spec.js`
- `e2e/helpers.js`
- 必要最小限の `js/app.js` / `js/modules/editor/EditorCore.js`

## Forbidden Area

- `.shared-workflows/**`
- 根拠なく期待値を緩める変更
- 広範囲リファクタ（200行超の無関係変更）

## Approach Candidates (P2.5 Divergent)

1. テスト側前提統一（待機/可視判定/初期化順）
1. アプリ側初期化イベント整流（パネル表示・ロードアウト反映）
1. テストヘルパー + 最小アプリ修正のハイブリッド

## Recommended Approach

- 3) ハイブリッドを採用。
- 理由: 失敗の主因が「テスト前提の揺れ」と「UI初期化順の微差」に分散しており、片側だけでは再発しやすいため。

## Test Plan

- クラスター単位の局所実行:
  - `npx playwright test e2e/responsive-ui.spec.js --reporter=line`
  - `npx playwright test e2e/tags-smart-folders.spec.js --reporter=line`
  - `npx playwright test e2e/decorations.spec.js --reporter=line`
  - `npx playwright test e2e/ui-editor.spec.js --reporter=line`
- 最後に全体実行:
  - `npm run test:e2e:ci`

## DoD

- [ ] 上位4クラスターの失敗要因をチケット内に分類して記録
- [ ] 上位4クラスターで再現率の高い失敗を修正
- [ ] `npm run test:e2e:ci` で失敗件数を 101 より削減
- [ ] 変更内容を `HANDOVER.md` / `docs/PROJECT_HEALTH.md` / `AI_CONTEXT.md` に反映
