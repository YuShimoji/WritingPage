# Task: E2E残件の失敗パターン分析・修正（Phase 1d-6 継続）
Status: READY
Tier: 1
Branch: chore/e2e-phase1d6-continue
Owner: Worker
Created: 2026-02-13T00:00:00+09:00
Updated: 2026-02-16T13:45:00+09:00

## Objective
直近再計測で 101 failed / 66 passed となった E2E テストを継続し、失敗要因を収束させる。
まずは高頻度失敗クラスターを再パターン化し、共通前提（表示/待機/ロードアウト）修正を優先適用する。

## Context
- 前回最終: 64 failed / 104 passed（2026-02-13）
- 完了済み: 1d-1 〜 1d-5
- 継続対象: 1d-6 残件の分析・修正
- 再開時点の環境確認（2026-02-13）
- `git pull --rebase origin main` 済み
- `.shared-workflows` は `3e62f33425eacd1c9959ffe1deab05cfa3b9f2d8` に更新済み
- `npm ci` 済み
- `npm run test:smoke` 成功
- `npm run test:e2e:ci` 再実行済み（結果: 101 failed / 66 passed）

## Focus Area
- `e2e/**/*.spec.js`
- `e2e/helpers.js`
- `js/app.js`
- `js/modules/editor/EditorCore.js`
- Playwright 実行設定とテスト補助層

## Forbidden Area
- `.shared-workflows/**`
- 根拠なく期待値を緩める変更
- 無関係な大規模リファクタ

## Baseline (2026-02-16)
- Command: `npm run test:e2e:ci`
- Result: `101 failed / 66 passed / 167 total`
- 備考: 前回値（64 failed）から悪化。共通前提の崩れ・仕様差分を優先的に監査する必要あり。

### Failure Clusters (by spec)
- `e2e/responsive-ui.spec.js`: 9
- `e2e/tags-smart-folders.spec.js`: 8
- `e2e/decorations.spec.js`: 7
- `e2e/ui-editor.spec.js`: 6
- `e2e/collage.spec.js`: 6
- `e2e/pomodoro.spec.js`: 6
- `e2e/image-position-size.spec.js`: 4
- `e2e/accessibility.spec.js`: 3
- `e2e/editor-settings.spec.js`: 3
- `e2e/gadgets.spec.js`: 3
- `e2e/wikilinks.spec.js`: 3
- `e2e/keybinds.spec.js`: 2
- `e2e/spell-check.spec.js`: 2
- `e2e/split-view.spec.js`: 1
- `e2e/tools-registry.spec.js`: 1

## Worker Start Plan
1. `responsive-ui` + `accessibility` の表示/フォーカス前提を共通ヘルパー化して先行解消
2. `ui-editor` + `decorations` の hidden/visible 前提を修正し、panel open wait を統一
3. `collage` + `image-position-size` + `tags-smart-folders` のガジェット存在前提をロードアウト準拠で修正
4. クラスターごとに局所再実行し、最後に `npm run test:e2e:ci` を再実行

## DoD
- [x] 最新ベースライン（failed/passed）を取得済み
- [ ] 失敗101件の主要クラスターを文書化済み
- [ ] 高頻度クラスターに対する修正を実装済み
- [ ] `npm run test:e2e:ci` 再実行で失敗件数を前回（101）より削減
- [x] 変更内容と残課題を `AI_CONTEXT.md` に記録
