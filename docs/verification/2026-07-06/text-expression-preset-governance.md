# Text expression preset governance

## Purpose

The previous Reader preview parity slice proved that Editor and Reader used the same textbox rendering path, but it left the default `monologue` preset tilted. Human review then flagged that this made the default inner-description preset feel unstable and made the text box / inner-description distinction difficult to evaluate. This slice reclassified the tilt as an opt-in expression instead of default monologue behavior.

## Findings

- Rendering parity was not the source of the remaining issue. Editor, Markdown preview, and Reader continue to route textbox DSL through `TextboxRichTextBridge` -> `TextboxEffectRenderer` with shared `TextboxPresetRegistry` semantics.
- The weak review signal came from preset governance: `monologue` used a small default tilt, so reviewers had to guess whether a slanted inner-description line was a Reader bug, a default preset feature, or legacy residue.
- `inner-voice` remains a stronger legacy inner voice preset with `tilt:-4`; it is valid for existing content but is no longer the canonical current inner-description sample.

## Changes

- Added `docs/TEXT_EXPRESSION_PRESETS.md` as the review-facing special-display catalog for textbox presets, inline effects, animations, and ornaments.
- Follow-up catalog pass filled the Prompt-required review fields: surface, status, and risk notes for textbox presets, inline effects, animations, ornaments, and the exceptional `zw-typing` / `zw-dialog` / `zw-scroll` / `zw-pathtext` / ruby / kenten displays.
- Changed built-in `monologue` to `tilt:0` while keeping italic, fade-in, soft ornament, and `scale:0.98`.
- Added explicit `tilted-monologue` with `tilt:-2` for opt-in unstable inner voice evidence.
- Updated `.zw-textbox--monologue` styling so the default inner-description preset is still visually distinct from `dialogue` without relying on tilt.
- Updated full showcase fixture/readback to include `dialogue`, `monologue`, and `tilted-monologue`, and scrolled the Editor/Reader parity captures so all three boxes are visible.
- Updated SP-060 docs, feature registry, and focused E2E expectations from 8 to 9 built-in presets.

## Current Classification

| Preset | Classification | Default transform | Review meaning |
| --- | --- | --- | --- |
| `dialogue` | standard | `rotate(0deg) scale(1)` | Plain text box / dialogue baseline. |
| `monologue` | standard | `rotate(0deg) scale(0.98)` | Default inner-description preset; upright, italic, quiet frame. |
| `tilted-monologue` | experimental explicit | `rotate(-2deg) scale(0.98)` | Tilt evidence only when the author asks for unstable inner voice. |
| `inner-voice` | legacy compatibility | `rotate(-4deg) scale(0.98)` | Existing stronger inner-voice content; not the default review fixture. |

## Latest Artifact

- `output/showcase/full-2026-07-06T02-30-01`
- `16-editor-normal.png` and `19-reader-preview.png` now show all three preset rows in-frame.
- `readback.json` reports `dialogue` as `rotate(0deg)`, `monologue` as `rotate(0deg)` / italic, and `tiltedMonologue` as `rotate(-2deg)` on both Editor and Reader.
- `14-focus-compat.png` and `15-normal-shell.png` retain state labels, making the focus compatibility vs normal shell/sidebar state difference visible.

## Validation

- `node --check js\modules\editor\TextboxPresetRegistry.js`: pass
- `node --check js\reader-preview.js`: pass
- `node --check scripts\capture-full-showcase.js`: pass
- `node --check e2e\reader-wysiwyg-distinction.spec.js`: pass
- `node --check e2e\semantic-presets.spec.js`: pass
- `node --check e2e\editor-extended-textbox.spec.js`: pass
- `npx playwright test e2e\reader-wysiwyg-distinction.spec.js e2e\semantic-presets.spec.js e2e\editor-extended-textbox.spec.js --workers=1`: 40 passed
- `node scripts\capture-full-showcase.js`: pass, 19 screenshots at `output/showcase/full-2026-07-06T02-30-01`
- `npx playwright test e2e\reader-wysiwyg-distinction.spec.js --workers=1`: 16 passed
- `npm run test:ui:capture`: pass, output at `output/playwright/manual-verification-2026-07-06T02-30-21-860Z`
- `npx playwright test e2e\design-cockpit.spec.js --workers=1`: 2 passed
- `npm run test:smoke`: pass
- `npm run lint:js:check`: pass
- `npm run build`: pass
- `git diff --check`: pass

## Boundary

No storage schema, autosave semantics, document model, account/cloud/public sharing, Design Cockpit redesign, or Reader-only rendering fork was added. Generated `output/` artifacts remain local ignored verification output.
