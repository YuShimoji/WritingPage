# Docs Authority Hygiene After Active Help Cleanup

Date: 2026-05-10

## Purpose

Active help wording cleanup 後に残った docs authority drift を解消する。対象は `ROADMAP` と `FEATURE_REGISTRY` FR-009 を中心に、現行 restart / roadmap / feature registry の説明を command palette / left nav / Reader surface / Local Gadget モデルへ揃えること。

## Scope

- Updated `docs/ROADMAP.md` current state and recent done notes.
- Updated `docs/FEATURE_REGISTRY.md` FR-009 to remove stale help authority.
- Synced `docs/CURRENT_STATE.md` and `docs/USER_REQUEST_LEDGER.md` with this docs-only closeout.
- Kept runtime behavior, keybindings, Local Mod behavior, loadout behavior, manifest schema, and E2E specs unchanged.

## Boundary

- This slice does not change `docs/EDITOR_HELP.md`, `js/gadgets-help.js`, or `js/gadgets-markdown-ref.js`; those were handled by the prior active help wording cleanup.
- This slice does not reopen Local Gadget Mod migration. The externalized set remains `MarkdownPreview` / `HUDSettings` / `PomodoroTimer`.
- This slice does not add a new help surface or settings entry.

## Verification

- `node -e "JSON.parse(require('fs').readFileSync('docs/spec-index.json','utf8'))"` -> pass
- `git grep -n "Focus 章パネル\\|28ガジェット一覧\\|2026-04-16" -- docs/CURRENT_STATE.md docs/FEATURE_REGISTRY.md docs/ROADMAP.md docs/USER_REQUEST_LEDGER.md` -> no matches
- `git diff --check` -> pass

## Next Candidate

The next recommended non-Mod slice is `Writing status visibility follow-up`, limited to one concrete status-chip behavior such as saved-history visibility or settings exposure. Do not combine it with WP-004 / WP-001 fixes unless a new failure report names that surface.
