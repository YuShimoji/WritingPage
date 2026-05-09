# MarkdownPreview Local Gadget Mod Migration

Date: 2026-05-10
Status: implemented / verified

## Purpose

C2 Gadget Mod boundary audit の最初の実装候補として、`MarkdownPreview` の built-in gadget wrapper だけを Local Gadget Mod へ移す。

## Boundary

Changed:

- `ZWGadgets.register('MarkdownPreview', ...)` の登録場所を built-in から Local Mod へ移動。
- `js/plugins/manifest.json` に disabled `markdown-preview-gadget` entry を追加。
- `e2e/plugin-manager.spec.js` に MarkdownPreview Mod の listed / enabled behavior を追加。
- `docs/GADGETS.md` / `docs/CURRENT_STATE.md` / `docs/USER_REQUEST_LEDGER.md` を同期。

Unchanged:

- Markdown preview engine / `ZenWriterEditor.togglePreview()`
- command palette / Reader / Markdown source
- Local Mod runtime API / manifest schema / loadout schema
- `choice` command plugin
- StoryWiki / LinkGraph / Images / LoadoutManager / GadgetPrefs / HUDSettings / PomodoroTimer

## Behavior

- Manifest 既定では `markdown-preview-gadget` は disabled。
- 設定モーダル `ローカルMod` で enable し reload すると、`MarkdownPreview` は `source: 'plugin'` / `pluginId: 'markdown-preview-gadget'` の gadget として `edit` group に表示される。
- Gadget UI は従来どおり `プレビュー開閉` と `スクロール同期` だけを持つ。

## Verification

- `.serena/project.yml` tool noise restored before implementation.
- `node --check js/gadgets-editor-extras.js js/plugin-manager.js js/plugin-api.js js/gadgets-plugin-manager.js js/plugins/sample-word-count-gadget/index.js js/plugins/markdown-preview-gadget/index.js` -> pass
- `node -e "JSON.parse(require('fs').readFileSync('js/plugins/manifest.json','utf8'))"` -> pass
- `node -e "JSON.parse(require('fs').readFileSync('docs/spec-index.json','utf8'))"` -> pass
- `npx playwright test e2e/plugin-manager.spec.js e2e/gadgets.spec.js --workers=1 --reporter=line` -> 20 passed
- `npm run test:smoke` -> pass
- `npm run lint:js:check` -> pass
- `npm run build` -> pass
- `git diff --check` -> pass

## Next

次の gadget migration 候補は未選定。C2 audit を使う場合も、1 gadget だけを別スライスで扱う。
