# Right window controls / top chrome retirement

Date: 2026-04-28  
Scope: Electron frameless shell / command palette routing / UI E2E

## Summary

- 目的: OS 枠なし Electron app で閉じる手段が見えない問題を解消しつつ、初期画面の上部 clutter を増やさない。
- 結論: visible top chrome surface は廃止し、F2 / Electron menu / legacy toolbar 互換経路は command palette に再割当。最小化・最大化/復元・閉じるは右上 `#electron-window-controls` の局所 hover / focus reveal に移した。
- 非対象: 左上 window grip、left nav、Reader、Floating memo lab、保存/章/データ契約。

## Checks

| Check | Result |
|-------|--------|
| active source static check: `top-chrome-trigger`, `top-chrome-handle`, `show-top-chrome`, visible top chrome CSS, old `#toggle-preview` / `#toggle-theme` source refs | PASS / no active source refs |
| `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line --grep "right window controls\|F2 shortcut\|retired top chrome\|command palette hides"` | PASS / 4 tests |
| `npm run test:smoke` | PASS |
| `npm run lint:js:check` | PASS |
| `npm run build` | PASS |
| `npm run test:unit` | PASS / 11 tests |
| `npm run test:e2e:ui -- --workers=1 --reporter=line` | PASS / 49 tests |
| `git diff --check` | PASS / existing CRLF warning for `e2e/ruby-text.spec.js` only |
| `npm run electron:build` | PASS / after stopping previously opened packaged app that locked `d3dcompiler_47.dll` |
| `npm run app:open:package` | PASS / packaged app opened |

## Notes

- `js/top-chrome-controller.js` remains only as a compatibility shim for existing `ZenWriterTopChrome` callers; it opens / hides command palette state and never creates visible top chrome UI.
- `menu:toggle-toolbar` remains as a legacy IPC channel, but the visible Electron menu item now sends `menu:open-command-palette` and labels F2 as command palette.
