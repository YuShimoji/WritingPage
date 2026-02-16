# Task: Lint実行境界の整理（.shared-workflows との責務分離）

Status: DONE
Tier: 1
Branch: chore/lint-scope-boundary
Owner: Worker
Created: 2026-02-16T13:55:00+09:00

## Objective

`npm run lint` 実行時に `.shared-workflows/` 由来の eslint エラー（18件）で失敗する問題を解消し、
このリポジトリ本体コードの品質ゲートとサブモジュール責務を分離する。

## Baseline

- Command: `npm run lint`
- Result: failed (18 errors, mainly `.shared-workflows/scripts/*.js`)

## Scope (Focus Area)

- `.eslintrc.json`
- `package.json` (lint scripts)
- 必要時のみ `docs/TESTING.md`（lint手順の期待値更新）

## Forbidden Area

- `.shared-workflows/**` の直接修正
- 本体コードに無関係なルール緩和

## Approach Candidates (P2.5 Divergent)

1. ESLint ignores で `.shared-workflows/**` を除外
1. lint スクリプトを `eslint . --ignore-pattern .shared-workflows/**` へ変更
1. 本体専用の lint 対象ディレクトリ（`js/`, `scripts/`, `e2e/` など）を明示

## Recommended Approach

- 1) と 3) の併用。
- 理由: 実行境界を設定ファイルで恒久化しつつ、将来の対象拡張にも安全に対応できるため。

## Test Plan

- `npm run lint` が本体対象で成功すること
- `npm run test:smoke` が回帰しないこと

## DoD

- [x] lint の失敗原因が `.shared-workflows` 非依存に整理される
- [x] `npm run lint:js:check` が本体変更での品質ゲートとして機能する
- [x] 設定変更理由を `HANDOVER.md` および `docs/PROJECT_HEALTH.md` に記録する

## Completion Summary

**Completed**: 2026-02-16T13:50:00+09:00

### Changes Made

1. **`.eslintrc.json`**: Added `ignorePatterns` for `.shared-workflows/**`, `node_modules/**`, `*.min.js`
2. **`.eslintignore`**: Created file with explicit exclusions for submodule and dependencies
3. **`package.json`**: Updated lint scripts to use `--ignore-pattern .shared-workflows` flag
   - `lint:js:check`: `eslint . --ignore-pattern .shared-workflows`
   - `lint:js:fix`: `eslint . --fix --ignore-pattern .shared-workflows`

### Verification

- ✅ `npm run lint:js:check` passes (0 errors on repository code)
- ✅ `npm run test:smoke` passes (no regression)
- ✅ Documentation updated in `HANDOVER.md` and `docs/PROJECT_HEALTH.md`

### Rationale

The `.shared-workflows` submodule has its own lint rules and quality gates. This repository's lint should focus on code under direct maintenance. The dual approach (config file + CLI flag) ensures robustness across different ESLint versions and execution contexts.
