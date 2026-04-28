# Main Hub Panel Dead Code Cleanup — 2026-04-28

## Summary

- 目的: DOM 実体のない `main-hub-panel` 由来の active source refs を削除する。
- 結論: CSS / UI editor selector / active source comment の orphan refs は削除済み。
- 範囲外: hidden legacy command compatibility、gadget pruning、Floating memo lab、Writing status 拡張。

## Changes

- `.main-hub-panel` CSS、responsive rules、未使用 `panel-fade-in` keyframes を削除。
- reduced-motion の suppression list から `.main-hub-panel` を削除。
- UI editor の bulk toolbar selector から `#main-hub-panel` を削除。
- active source comments から MainHubPanel が現存するように読める記述を削除。

## Verification

| Check | Result |
|------|--------|
| `rg -n "#main-hub-panel|\\.main-hub-panel" css js index.html` | PASS / no active source refs |
| `npm run test:smoke` | PASS |
| `npm run lint:js:check` | PASS |
| `npm run build` | PASS |
| `npm run test:unit` | PASS / 11 tests |
| `npm run test:e2e:ui -- --workers=1 --reporter=line` | PASS / 49 tests |
| `git diff --check` | PASS |

Historical docs/spec mentions remain only as prior audit context.
