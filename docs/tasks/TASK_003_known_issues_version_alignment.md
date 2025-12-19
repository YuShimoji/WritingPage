# Task: docs/KNOWN_ISSUES.md のバージョン表記と実態の整合（P1-3）

Status: OPEN
Tier: 1
Branch: main
Owner: Worker-1
Created: 2025-12-19T18:50:00+09:00
Report:

## Objective

- `docs/KNOWN_ISSUES.md` のバージョン表記（例: v0.3.19 等）と、現行実装/現行バージョン（`package.json`）および関連ドキュメントの実態を整合させる

## Context

- SSOT: `docs/AUDIT_TASK_BREAKDOWN.md` の **P1-3**

## Focus Area

- `docs/KNOWN_ISSUES.md`
- `package.json`
- （必要なら）`AI_CONTEXT.md` / `docs/DEVELOPMENT_STATUS.md`（整合の根拠が分散している場合のみ）

## Forbidden Area

- `js/**`（理由: 今回はドキュメント整合が主目的）
- `.shared-workflows/**`

## Constraints

- テスト: 主要パスのみ（ドキュメント更新中心のため、必要なら `npm run test:smoke` を実行して状態を確認）
- フォールバック: 新規追加禁止
- 事実関係（「改善済み」等）の断定は、コード/テスト/バージョンの根拠が取れる場合のみ行う

## DoD

- [ ] `docs/KNOWN_ISSUES.md` 内のバージョン表記が現行 `package.json` と矛盾しない
- [ ] 「改善済み/未解決」の表記が現状と一致する（根拠をレポートに記載）
- [ ] `docs/inbox/` にレポート（REPORT_...md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- `git grep -nE "v0\\.3\\.(18|19|20)" docs/KNOWN_ISSUES.md` 等で表記揺れを最初に棚卸しするとよい
