# EDITOR_HELP Stale Settings Route Cleanup

Date: 2026-05-11

## Purpose

`docs/EDITOR_HELP.md` is the active help SSOT. This slice removes a stale settings route that still described an old Focus-panel gear entry and a three-route settings model.

## Scope

- Updated the settings note after the keyboard shortcuts table in `docs/EDITOR_HELP.md`.
- Synced `docs/CURRENT_STATE.md` and `docs/USER_REQUEST_LEDGER.md`.
- Kept runtime code, in-app help rendering, command palette, settings modal, keybindings, and `docs/VISUAL_PROFILE.md` unchanged.

## Boundary

- Current settings entries are `Ctrl+,` and command palette `open-settings`.
- Settings contents are reached from the left nav / sidebar `詳細設定` category.
- Visual Profile UI-mode wording remains a separate stale-doc candidate.

## Verification

- `node -e "JSON.parse(require('fs').readFileSync('docs/spec-index.json','utf8'))"` -> pass
- `git grep -n "Focus 章パネル\\|Focus 章パネル歯車\\|3 経路" -- docs/EDITOR_HELP.md` -> no matches
- `npm run test:smoke` -> pass
- `git diff --check` -> pass

## Next Candidate

The next narrow candidate is `docs/VISUAL_PROFILE.md` wording audit: confirm whether the remaining UI-mode design comments should be rewritten as internal compatibility wording or left as historical design context.
