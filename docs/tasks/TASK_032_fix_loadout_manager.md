# Task: LoadoutManager をデフォルトプリセットに追加
Status: DONE
Tier: 1
Branch: fix/task-032-loadout-manager
Owner: Worker
Created: 2026-01-19
Report: docs/reports/REPORT_TASK_032.md

## Objective
- デフォルトロードアウト (`novel-standard`) に `LoadoutManager` が含まれていないため、ロードアウト切り替えができない問題を修正する。

## Context
- TASK_031 の検証により、`js/loadouts-presets.js` の定義漏れが判明 (`docs/reports/REPORT_TASK_031.md` 参照)。
- UI上からロードアウト（構成）を変更するために必須のコンポーネント。

## Focus Area
- `js/loadouts-presets.js`

## Forbidden Area
- 他のガジェット定義

## DoD
- [ ] `js/loadouts-presets.js` の `novel-standard` グループ（`structure` カテゴリ推奨）に `'LoadoutManager'` が追加されている
- [ ] 修正後、ブラウザでロードアウト切り替えメニューが操作可能であることを確認（手動またはスクショ検証）
- [ ] `docs/inbox/` にレポートを作成
