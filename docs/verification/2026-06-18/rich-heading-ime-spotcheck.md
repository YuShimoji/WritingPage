# Rich Heading IME Spot-check

Date: 2026-06-18

## Purpose

Verify the Rich editing typed heading shortcut on current `main` with a real
local app launch, then separate agent-verifiable behavior from the remaining
native Japanese IME check. This is a verification/docs slice only.

## Current State Readback

- Branch: `main`.
- After `git fetch --prune origin`, local `main` was behind `origin/main` by
  one commit and was fast-forwarded with `git pull --ff-only origin main`.
- Post-pull check: `git status --short --branch` showed clean
  `## main...origin/main`.
- Post-pull comparison: `git rev-list --left-right --count HEAD...origin/main`
  returned `0 0`.
- Pre-note `HEAD` before this verification handoff was written:
  `977e7a5 docs: hand off current sync context`.
- Final spot-check handoff commit after the note was pushed:
  `b56e925 docs: record rich heading ime spotcheck`.

## Authority Documents Inspected

- `docs/CURRENT_STATE.md`
- `docs/INVARIANTS.md`
- `docs/INTERACTION_NOTES.md`
- `docs/USER_REQUEST_LEDGER.md`
- `docs/OPERATOR_REVIEW_UX.md`
- `docs/ai/STATUS_AND_HANDOFF.md`
- `docs/ai/WORKFLOWS_AND_PHASES.md`
- `docs/OPERATOR_WORKFLOW.md`
- `docs/verification/2026-06-08/remote-sync-context-handoff-after-ledger-anchor.md`
- `docs/verification/2026-06-18/remote-sync-context-handoff.md`

## Local App Access

- Local app URL: `http://127.0.0.1:8080/index.html`
- Launch command used: `node scripts/dev-server.js`
- HTTP readback: `200`
- Dev server process: listening on `127.0.0.1:8080`
- Screenshot artifact: `output/playwright/rich-heading-ime-spotcheck.png`

## Agent-side Verification

The agent could verify the shortcut mechanics and the composition gate with
browser automation, but not native OS Japanese IME candidate-window behavior.

| Check | Result | Meaning |
| --- | --- | --- |
| Local app launch | PASS | The current app opened from the repo on `127.0.0.1:8080`. |
| `#` + Space typed at line start | PASS | The Rich editing block converted to `h1`. |
| `##` + Space typed at line start | PASS | The Rich editing block converted to `h2`. |
| `###` + Space typed at line start | PASS | The Rich editing block converted to `h3`. |
| Immediate Undo after conversion | PASS | One `Ctrl+Z` removed the heading block and restored the typed marker text. |
| Synthetic `compositionstart` / `compositionend` around `# Composing Heading` | PASS | No heading block was created while the editor was in the synthetic composition state. |
| Focused E2E grep: `heading shortcut` | PASS | `10 passed`; positive, negative, paste, synthetic IME, Undo, and Markdown source round-trip coverage stayed green. |

Focused command:

```powershell
npx playwright test e2e/wysiwyg-editor.spec.js --workers=1 --reporter=line --grep "heading shortcut"
```

## Native IME Limitation

The Windows user language list includes Japanese and the culture is `ja-JP`, but
the available browser automation path types DOM/key events rather than driving
the OS Japanese IME candidate window. The synthetic composition check proves the
implemented guard reacts to composition events, but it is not the same as a
human operating Microsoft IME in the browser.

## USER_RUN_REQUIRED Review Card

status: required

type: USER_RUN_REQUIRED

target: local Rich editing screen

access: `http://127.0.0.1:8080/index.html`

look_for: IME composition misfire; intended `#` / `##` / `###` + Space shortcut
conversion; immediate Undo behavior

input_mode: freeform

completion_signal: reply with `OK` or `NG` plus concrete observation, for
example `OK: no conversion during IME composition; #/##/### convert after
normal direct input; Undo restores #` or `NG: while composing ..., it converted
to H1`.

Suggested spot-check:

1. Open the local URL and focus the Rich editing body.
2. Turn Japanese IME on and start a composition near a line-leading `#` marker.
   Use Space for candidate selection while the IME underline/candidate window is
   active. OK means no `h1` / `h2` / `h3` appears during composition.
3. In normal direct input, type `#` + Space, `##` + Space, and `###` + Space at
   the start of an empty block. OK means they convert to H1/H2/H3 respectively.
4. Immediately after a conversion, press `Ctrl+Z`. OK means the typed marker is
   restored instead of leaving an empty heading or losing the marker.

If the user reports NG, the next assistant slice should stay narrow: record the
exact reproduction, expected result, actual result, browser/IME mode, and then
inspect `js/editor-wysiwyg.js` around the composition gate and typed heading
shortcut only.

## Intentionally Untouched

- No implementation code changed.
- No E2E body changed.
- No storage/import/export behavior changed.
- No Electron/package behavior changed.
- No dependencies, DB/auth/API contracts, or GitHub Issue / PR state changed.

## Validation

- `git diff --check` is required after this note is added.
- If staged later, run `git diff --cached --check`.
