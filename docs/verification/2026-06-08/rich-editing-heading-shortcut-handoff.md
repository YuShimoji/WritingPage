# Rich editing typed heading shortcut handoff

Date: 2026-06-08

## Current product proof

- Product proof commit: `1e33e38 feat: add rich editing heading shortcut`.
- Active product behavior: Rich editing adopts the heading shortcut only as a limited typed trigger.
- Previous import-trust proof remains `a56671b test: harden import roundtrip`; do not confuse that import baseline with this editor shortcut proof.

## Behavior fixed by this slice

- In Rich editing normal contenteditable input, line-start `# ` / `## ` / `### ` confirmed by Space converts the current paragraph/div to H1/H2/H3.
- The trigger is queued on Space keydown and consumed on the following input event, after the browser has inserted the space.
- IME composition is gated by `compositionstart` / `compositionend` state and `KeyboardEvent.isComposing`.
- Undo captures the pre-conversion DOM before replacing the block, so Undo immediately after conversion restores the typed marker.
- The shortcut leaves `#hashtag`, inline `# `, and `#### ` literal.

## Boundaries preserved

- No generic Markdown shortcut engine was added.
- Paste, import, Markdown source round-trip, `markdownToHtml`, and `htmlToMarkdown` stay on their existing conversion paths.
- Existing toolbar / `formatBlock` heading behavior remains separate.
- Sections / chapterMode behavior is unchanged. The shortcut only creates real heading blocks in the editor surface and does not replace `+ 新しい章` or ChapterStore creation.
- WP-004 parity, docs hygiene, package gate, Cloud sync, EPUB, DOCX, Floating memo, Gadget changes, old top chrome, PR #119, and Issue #118 cleanup were not mixed into this slice.

## Validation

Run before product commit:

```powershell
node --check js/editor-wysiwyg.js
npx playwright test e2e/wysiwyg-editor.spec.js --workers=1 --reporter=line --grep "heading shortcut"
npm run test:smoke
npm run lint:js:check
git diff --check
```

Results:

- `node --check js/editor-wysiwyg.js`: PASS
- focused Playwright `heading shortcut`: PASS, 10 passed
- `npm run test:smoke`: PASS, `ALL TESTS PASSED`
- `npm run lint:js:check`: PASS
- `git diff --check`: PASS

## Restart route on another terminal

Run:

```powershell
git pull --ff-only origin main
git status --short --branch
git rev-list --left-right --count HEAD...origin/main
```

Expected:

- `git status --short --branch` shows `## main...origin/main` with no file entries.
- `git rev-list --left-right --count HEAD...origin/main` returns `0 0`.

Then read:

1. `docs/CURRENT_STATE.md`
2. `docs/INVARIANTS.md`
3. `docs/INTERACTION_NOTES.md`
4. Only when choosing the next slice: `docs/USER_REQUEST_LEDGER.md`
5. Only for roadmap context: `docs/ROADMAP.md`

## Next entry points

| Entry point | Reduces friction in | What becomes possible |
|-------------|---------------------|-----------------------|
| Audit: stale spec reconciliation | Planning authority | Old specs can be reconciled against the current shell, import trust, and editor shortcut state. |
| Verify: Japanese IME spot-check | Release confidence | A human can confirm real IME composition behaves like the automated composition guard. |
| Bookkeeping: GitHub Issue / PR cleanup | Repository hygiene | Stale Issue #118 / PR #119 can be closed or annotated without blocking current-main product work. |

## Remaining risk

The focused test covers synthetic composition events and Undo immediately after conversion. A manual Japanese IME spot-check is useful before a release cut, but no separate product lane is required unless it reveals a failure.
