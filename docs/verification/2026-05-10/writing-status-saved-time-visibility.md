# Writing Status Saved-Time Visibility

Date: 2026-05-10

## Purpose

既存の `#writing-status-chip` を、単なる `編集中/保存済み` から、保存安心感につながる最終保存時刻つき表示へ拡張する。

## Scope

- `js/writing-status-chip.js` に保存済み時刻の保持と表示を追加。
- `e2e/accessibility.spec.js` と `e2e/daily-writing-proof.spec.js` に `保存済み HH:mm` / `data-last-saved-at` の確認を追加。
- `docs/FEATURE_REGISTRY.md` / `docs/INVARIANTS.md` / `docs/CURRENT_STATE.md` / `docs/USER_REQUEST_LEDGER.md` を同期。

## Boundary

- New settings UI is not added.
- Storage schema, loadout, Local Mod behavior, Reader, Floating memo lab, and autosave engine are unchanged.
- The chip remains non-interactive and hidden while Reader or Floating memo lab is open.

## Verification

- `node --check js/writing-status-chip.js` -> pass
- `npx playwright test e2e/accessibility.spec.js e2e/daily-writing-proof.spec.js --workers=1 --reporter=line --grep "writing status|daily writing"` -> pass
- `npm run test:smoke` -> pass
- `npm run lint:js:check` -> pass
- `npm run build` -> pass
- `node -e "JSON.parse(require('fs').readFileSync('docs/spec-index.json','utf8'))"` -> pass
- `git diff --check` -> pass

## Next Candidate

The next recommended slice is a dead-code / stale-resource audit, limited to one concrete stale target. Writing status settings exposure should remain deferred unless a concrete user-facing need appears.
