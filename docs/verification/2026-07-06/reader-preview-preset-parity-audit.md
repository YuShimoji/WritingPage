# Reader preview preset parity audit

## Purpose

Human review of `output/showcase/full-2026-07-05T18-27-48` found that full showcase `14` to `16` did not clearly show state differences, the Editor-side `dialogue` / `monologue` textbox presets were too hard to distinguish, and Reader preview looked less stable than Editor for inner-description tilt and strikethrough.

## Findings

- `monologue` / inner-description tilt is intentional current preset semantics, not a Reader-only rendering accident. `TextboxPresetRegistry` defines `monologue` as `tilt:-2`, `scale:0.98`, italic, fade-in, and soft ornament. Reader and Editor should therefore both show a slight tilt.
- A real parity bug existed in WYSIWYG serialization: `.decor-strikethrough` could round-trip as `[strikethrough]`, while the render path recognizes `[strike]`; native `<s>` / `<del>` / `<strike>` also lacked an explicit Turndown rule. Reader could then receive Markdown with missing or unsupported strikethrough markup after opening from WYSIWYG.
- The full-showcase WYSIWYG fixture was hand-written HTML that skipped the textbox renderer class/wrapper/style path, so Editor evidence made `dialogue` and `monologue` look closer than product-rendered presets.
- The earlier `14` / `15` / `16` captures were mostly the same clean editor composition. They were weak evidence because state changed but the frame did not expose the shell state.

## Changes

- `js/editor-wysiwyg.js` now maps `.decor-strikethrough` back to `[strike]...[/strike]` and serializes native `<s>` / `<del>` / `<strike>` as `~~...~~`.
- `css/style.css` explicitly applies `line-through` to native strike tags in WYSIWYG, Markdown preview, and Reader preview.
- `js/modules/editor/TextboxEffectRenderer.js` normalizes DSL segment `<br>` separators before escaping, preventing literal `<br>` text inside rendered textbox evidence.
- `scripts/capture-full-showcase.js` now seeds one Markdown fixture through the product renderer, records preset/strike readbacks without manuscript body text, and adds capture-only state labels:
  - `14-focus-compat.png`: focus compatibility, reader closed, writing canvas only.
  - `15-normal-shell.png`: normal shell with structure sidebar category open.
  - `16-editor-normal.png`: clean editor canvas with strike and `dialogue` / `monologue` preset fixture.
  - `19-reader-preview.png`: Reader overlay with the same strike and preset fixture.

## Latest Artifact

- `output/showcase/full-2026-07-05T18-56-08`
- `manifest.json` and `readback.json` include `focus_compat`, `normal_shell`, `editor_parity`, and `reader_parity` readbacks.
- `editor_parity` and `reader_parity` both report `nativeStrikeCount=1`, `decorStrikeCount=1`, `strikeComputedLineThrough=true`, `dialogue` with `rotate(0deg)`, and `monologue` with `rotate(-2deg)`.

## Validation

- `node --check scripts\capture-full-showcase.js`: pass
- `node --check js\editor-wysiwyg.js`: pass
- `node --check js\modules\editor\TextboxEffectRenderer.js`: pass
- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js --workers=1`: 16 passed
- `node scripts\capture-full-showcase.js`: pass, 19 screenshots at `output/showcase/full-2026-07-05T18-56-08`
- `npm run test:ui:capture`: pass, output at `output/playwright/manual-verification-2026-07-05T18-59-26-581Z`
- `npx playwright test e2e/design-cockpit.spec.js --workers=1`: 2 passed
- `npm run test:smoke`: pass
- `npm run lint:js:check`: pass
- `npm run build`: pass

## Boundary

This was a rendering parity and evidence-quality slice. It did not change storage schema, autosave semantics, cloud/account/public sharing, Design Cockpit behavior, or broad UI design. Generated `output/` artifacts remain local ignored verification output.
