# Effect Settings Writer-Facing Wording Audit

## Purpose

The command palette dead-entry sweep found no dead writer-facing command, but
it left one useful UX follow-up: the two rich-editing newline effect settings
were functional settings, yet their visible labels and descriptions still used
implementation terms such as `decor` and `BL-002`.

## Scope

- Targeted only `effectBreakAtNewline` and
  `effectPersistDecorAcrossNewline` visible wording.
- Preserved the existing storage keys, defaults, command ids, behavior, and
  settings persistence.
- Did not reopen command palette cleanup, Markdown source dev gate, WP-005,
  Project import recovery, Rich heading, or Rich text block align.

## Product Change

- Command palette labels now describe writer intent:
  - `リッチ編集: 改行後の装飾を切る`
  - `リッチ編集: 改行後も装飾を続ける`
- UI Settings uses the same writer-facing labels.
- Help text now explains the visible editing result: whether Enter carries
  current text decoration into the next line.
- Internal terms remain only in code keys, ids, and technical docs where they
  are needed for compatibility.

## Verification

- `node --check js/command-palette.js`
- `node --check js/gadgets-editor-extras.js`
- `node --check e2e/command-palette.spec.js`
- `node --check e2e/editor-settings.spec.js`
- `npx playwright test e2e/command-palette.spec.js --workers=1 --reporter=line --grep "Effect settings commands"`
- `npx playwright test e2e/editor-settings.spec.js --workers=1 --reporter=line --grep "effect"`
- `npm run lint:js:check`
- `npx markdownlint docs/verification/2026-06-26/effect-settings-writer-facing-wording-audit.md`
- `git diff --check`

## Result

The settings remain connected and persistent, but the normal writer-facing
surfaces no longer require the user to understand `decor`, `BL-002`, or the
storage key names to know what the toggles do.
