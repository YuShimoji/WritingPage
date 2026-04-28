# Left Chrome / Left Nav Refinement — 2026-04-28

## Summary

- 目的: Electron hidden chrome 時の左上 grip ノイズ、left nav category から root へ戻る距離、root rail の広すぎる残留範囲を改善する。
- 結論: `#electron-window-grip` は初期透明 hover reveal、`#sidebar-nav-back-rail` は category-only、root rail dismiss は見た目幅同期に更新済み。
- 範囲外: Focus chapter panel、hidden legacy commands、top chrome drag lane、Editor / sidebar の no-drag 契約。

## Changes

- Electron window grip に `move-diagonal-2` icon を追加し、hover 時だけ斜め上から fade-in するよう調整。
- Left nav category 中だけ左列全体の back rail から root へ戻れるよう追加。
- Root icon rail 表示中は back rail を非表示 / non-interactive に維持。
- Normal/root の left edge dismiss 判定を root rail の見た目幅へ同期。

## Verification

| Check | Result |
|------|--------|
| static selector check (`sidebar-nav-back-rail` / `move-diagonal-2` / `LEFT_ROOT_RAIL_CLOSE_BUFFER_PX`) | PASS |
| `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line --grep "frameless Electron window grip\|Electron top chrome owns\|left nav category back rail\|root left nav is hidden"` | PASS / 4 tests |
| `npm run test:smoke` | PASS |
| `npm run lint:js:check` | PASS |
| `npm run build` | PASS |
| `npm run test:unit` | PASS / 11 tests |
| `npm run test:e2e:ui -- --workers=1 --reporter=line` | PASS / 49 tests |
| `git diff --check` | PASS / existing line-ending warnings only |
| `npm run electron:build` | PASS after stopping running packaged app processes that held DLL locks |
| `npm run app:open:package` | PASS |

## Notes

- The first `electron:build` attempt failed because existing `Zen Writer.exe` processes locked `build/win-unpacked/d3dcompiler_47.dll`.
- Existing packaged processes were stopped, then `electron:build` completed and the packaged app was reopened.
