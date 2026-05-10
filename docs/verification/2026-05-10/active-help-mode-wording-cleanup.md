# Active Help Mode Wording Cleanup

Date: 2026-05-10
Status: implemented / verified

## Purpose

Active help / shortcut resources に残っていた旧 `Normal / Focus / 表示モード切替` 語彙を削り、現行の command palette / left nav / Reader surface / Local Gadget モデルへ同期する。

## Changed

- `docs/EDITOR_HELP.md` の UI mode 説明を、画面導線と editor / Reader surface 説明へ置換。
- `js/gadgets-help.js` の in-app help で `F2` を command palette 表示として説明し、旧 mode list を画面導線 section へ置換。
- `js/gadgets-markdown-ref.js` の shortcut description から `UIモード切替` / `通常モードに戻る` を削除。
- `docs/CURRENT_STATE.md` / `docs/USER_REQUEST_LEDGER.md` を同期。

## Unchanged

- Runtime behavior and keybindings.
- `FocusMode` gadget behavior and label.
- `setUIMode('normal'|'focus')` compatibility symbols.
- Historical / archive docs and broader VisualProfile spec cleanup.

## Verification

- `.serena/project.yml` tool noise restored before staging.
- `node --check js/gadgets-help.js js/gadgets-markdown-ref.js` -> pass
- `node -e "JSON.parse(require('fs').readFileSync('docs/spec-index.json','utf8'))"` -> pass
- `git grep -n "表示モード切替\\|通常モードに戻る\\|通常モード (Normal)\\|フォーカスモード (Focus)\\|UIモード切替" -- docs/EDITOR_HELP.md js/gadgets-help.js js/gadgets-markdown-ref.js` -> no matches
- `npx playwright test e2e/command-palette.spec.js --workers=1 --reporter=line --grep "F2"` -> pass
- `git diff --check` -> pass
