# PomodoroTimer Mod Feasibility Audit

Date: 2026-05-10
Status: docs-only audit / no runtime changes

## Purpose

`MarkdownPreview` / `HUDSettings` Local Mod migration 後の次候補として、`PomodoroTimer` を即移行せず、Local Gadget Mod 化に必要な境界を確認する。

この監査では runtime API、manifest schema、loadout schema、Pomodoro engine、既存 E2E を変更しない。

## Current Evidence

- wrapper: `js/gadgets-pomodoro.js`
  - `ZWGadgets.register('PomodoroTimer', ...)` で assist gadget を登録する。
  - `ZWGadgets.registerSettings('PomodoroTimer', ...)` で作業時間 / 休憩時間 / カスタム時間の settings UI を登録する。
- engine: `js/pomodoro-timer.js`
  - `window.ZenWriterPomodoro` を提供する。
  - `ZenWriterStorage` の `settings.pomodoro` と `localStorage` の session / state keys を使う。
  - `window.ZenWriterHUD.publish()` で timer start / pause / stop / complete を通知する。
- default placement: built-in loadout preset の assist group に `PomodoroTimer` が含まれる。
- current tests: `e2e/pomodoro.spec.js` は `PomodoroTimer` が assist panel に default visible で存在する前提で、render / start / pause / custom mode / progress / global timer / HUD integration を確認する。
- Plugin API: 現行 `api.gadgets` は `register()` / `getSetting()` / `setSetting()` だけを公開し、`registerSettings()` を公開していない。

## Decision

`PomodoroTimer` は現時点では **移行実装しない**。

main gadget だけを Local Mod へ移し settings UI を built-in に残す partial migration は採用しない。移行するなら、`api.gadgets.registerSettings(name, renderSettings)` を Plugin API に追加し、main gadget と settings UI を同じ Mod 境界へ移す。

## Next Implementation Options

1. **PomodoroTimer migration with registerSettings API**
   - `plugin-api.js` に `api.gadgets.registerSettings()` を追加する。
   - `pomodoro-timer-gadget` Local Mod を追加し、main gadget と settings UI を登録する。
   - `PomodoroTimer` は manifest 既定 disabled とし、enable + reload 後だけ assist group に表示する。
   - `js/pomodoro-timer.js` の engine / storage / HUD notification は built-in のまま維持する。

2. **PomodoroTimer built-in retain decision**
   - 標準 assist preset、専用 E2E、HUD integration、settings UI の結合を built-in 理由として記録する。
   - 次の Mod 化候補は無理に探さず、Local Mod migration レーンを一旦 closeout する。

## Verification

This audit is documentation only.

- `docs/spec-index.json` JSON parse
- `git diff --check`

If option 1 is implemented in a later slice, expected verification is:

- `node --check js/plugin-api.js js/gadgets-pomodoro.js js/pomodoro-timer.js js/plugins/pomodoro-timer-gadget/index.js`
- `node -e "JSON.parse(require('fs').readFileSync('js/plugins/manifest.json','utf8'))"`
- `npx playwright test e2e/plugin-manager.spec.js e2e/gadgets.spec.js e2e/pomodoro.spec.js --workers=1 --reporter=line`
- `npm run test:smoke`
- `npm run lint:js:check`
- `npm run build`
