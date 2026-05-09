# HUDSettings Local Gadget Mod Migration

Date: 2026-05-10
Status: implemented / verified

## Purpose

`MarkdownPreview` migration 後の高優先 Mod 化候補として、低頻度設定 UI の `HUDSettings` built-in wrapper だけを Local Gadget Mod へ移す。

## Boundary

Changed:

- `HUDSettings` の登録場所を built-in wrapper から `hud-settings-gadget` Local Mod へ移動。
- `js/plugins/manifest.json` に disabled `hud-settings-gadget` entry を追加。
- built-in loadout presets と legacy normalization から `HUDSettings` を default 除外へ更新。
- HUDSettings 関連 E2E を Local Mod enabled 前提へ更新。
- `docs/GADGETS.md` / `docs/CURRENT_STATE.md` / `docs/USER_REQUEST_LEDGER.md` を同期。

Unchanged:

- HUD 本体 / `ZenWriterHUD`
- autosave HUD / command palette HUD 表示
- Local Mod runtime API / manifest schema / loadout schema
- `choice` command plugin
- MarkdownPreview / StoryWiki / LinkGraph / Images / LoadoutManager / GadgetPrefs / PomodoroTimer

## Behavior

- Manifest 既定では `hud-settings-gadget` は disabled。
- 設定モーダル `ローカルMod` で enable し reload すると、`HUDSettings` は `source: 'plugin'` / `pluginId: 'hud-settings-gadget'` の gadget として `advanced` group に表示される。
- Gadget UI は従来どおり HUD の位置・表示時間・背景色・文字色・不透明度・幅・フォントサイズ・メッセージ・固定表示を保存し、`ZenWriterHUD.applyConfig()` へ即時反映する。

## Verification

- `.serena/project.yml` tool noise restored before implementation.
- `node --check js/gadgets-hud.js js/gadgets-loadouts.js js/gadgets-utils.js js/loadouts-presets.js js/plugin-manager.js js/plugin-api.js js/gadgets-plugin-manager.js js/plugins/sample-word-count-gadget/index.js js/plugins/markdown-preview-gadget/index.js js/plugins/hud-settings-gadget/index.js` -> pass
- `node -e "JSON.parse(require('fs').readFileSync('js/plugins/manifest.json','utf8'))"` -> pass
- `node -e "JSON.parse(require('fs').readFileSync('docs/spec-index.json','utf8'))"` -> pass
- `npx playwright test e2e/plugin-manager.spec.js e2e/gadgets.spec.js e2e/decorations.spec.js --workers=1 --reporter=line` -> 35 passed
- `npm run test:smoke` -> pass
- `npm run lint:js:check` -> pass
- `npm run build` -> pass
- `git diff --check` -> pass

## Next

次の Mod 化候補は未選定。候補化するなら `PomodoroTimer` が次点だが、専用 E2E と HUD integration の影響を確認してから 1 gadget の別スライスで扱う。
