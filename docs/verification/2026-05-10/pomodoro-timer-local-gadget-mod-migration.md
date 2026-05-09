# PomodoroTimer Local Gadget Mod Migration

Date: 2026-05-10
Status: implemented

## Purpose

`PomodoroTimer` は小説執筆そのものの基盤ではない個人用途の補助として扱い、標準 assist rack から外して Local Gadget Mod 化する。

## Changed

- `api.gadgets.registerSettings()` を追加し、Local Gadget Mod が main gadget と settings UI を同じ Mod 境界へ登録できるようにした。
- `PomodoroTimer` の built-in wrapper / settings UI を `pomodoro-timer-gadget` Local Mod へ移動。
- `js/plugins/manifest.json` に disabled `pomodoro-timer-gadget` entry を追加。
- built-in loadout presets と legacy normalization から `PomodoroTimer` を default 除外へ更新。
- `e2e/pomodoro.spec.js` は Mod enabled 前提へ変更し、`e2e/plugin-manager.spec.js` に listed / enabled behavior を追加。

## Kept

- `js/pomodoro-timer.js`
- `window.ZenWriterPomodoro`
- Pomodoro settings / session / state storage
- HUD notification through `window.ZenWriterHUD`
- Local Mod enable storage: `zw_plugin_manager_enabled`
- loadout schema

## Runtime Behavior

- 初期状態では `PomodoroTimer` は assist group に表示されない。
- 設定モーダル `ローカルMod` で `pomodoro-timer-gadget` を enable し reload すると、`PomodoroTimer` は `source: "plugin"` / `pluginId: "pomodoro-timer-gadget"` の gadget として assist group に表示される。
- Pomodoro settings UI も `api.gadgets.registerSettings()` 経由で同じ Mod 境界に登録される。

## Verification

- `node --check js/plugin-api.js js/gadgets-pomodoro.js js/gadgets-loadouts.js js/gadgets-utils.js js/loadouts-presets.js js/command-palette.js js/plugins/pomodoro-timer-gadget/index.js`
- `node -e "JSON.parse(require('fs').readFileSync('js/plugins/manifest.json','utf8'))"`
- `node -e "JSON.parse(require('fs').readFileSync('docs/spec-index.json','utf8'))"`
- `npx playwright test e2e/plugin-manager.spec.js e2e/gadgets.spec.js e2e/pomodoro.spec.js e2e/command-palette.spec.js --workers=1 --reporter=line`
- `npm run test:smoke`
- `npm run lint:js:check`
- `npm run build`
- `git diff --check`
