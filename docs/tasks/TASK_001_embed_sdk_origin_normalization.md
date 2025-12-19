# Task: Embed SDK の origin 検証と same-origin 判定の正規化（P0-1）

Status: DONE
Tier: 2
Branch: feature/p0-embed-origin-normalization
Owner: Worker-1
Created: 2025-12-19T15:09:00+09:00
Report: docs/inbox/REPORT_001_20251219_1810.md

## Objective

- `js/embed/zen-writer-embed.js` の `sameOrigin` 判定と `postMessage` の origin 検証を、安全側かつ互換性を保つ形で正規化する
- DoD（`docs/AUDIT_TASK_BREAKDOWN.md` の P0-1）を満たす

## Context

- SSOT: `docs/AUDIT_TASK_BREAKDOWN.md` の **P0-1**
- 現状の懸念:
  - `sameOrigin` デフォルトが `true` で自動判定されない
  - `postMessage` 受信時の検証が弱くなる余地
  - エラーメッセージが誤誘導になるケース

## Focus Area

- `js/embed/zen-writer-embed.js`
- `js/embed/child-bridge.js`
- （必要なら）`docs/EMBED_SDK.md`

## Forbidden Area

- `openspec/**`（仕様再編は別チケット）
- `js/**` の embed 以外（影響範囲を限定する）

## Constraints

- テスト: 主要パスのみ（網羅テストは後続タスクへ分離）
- フォールバック: 新規追加禁止
- 互換性: 破壊的変更（オプション削除など）は行わない（監査SSOTの案Aを前提）

## DoD

- [x] `docs/AUDIT_TASK_BREAKDOWN.md` の P0-1 DoD を満たす
- [x] `npm run test:smoke` が通る
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- 実装方針は「案A（推奨）」を採用（srcのoriginから推定、ユーザー指定で上書き）
