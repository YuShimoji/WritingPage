# Rich Text Block Align Persistence

## Purpose

After WP-005 A/B/C closed, this fresh one-topic product slice returned to a
small daily-writing friction point: paragraph alignment in Rich editing should
not be a visual-only edit. If a writer right-aligns or centers a paragraph, the
choice needs to persist through the Markdown source, save/reload, MD preview,
and Reader.

## Selected Slice

- Family: Rich editing / save-resume trust.
- Scope: CommandAdapter-backed rich edit commit, `data-zw-align` Markdown
  body rendering, focused persistence proof.
- Non-targets: WP-005 comparison, Project import recovery, Rich heading,
  arbitrary raw HTML enablement, new alignment UI, cloud sync, export redesign.

## What Changed

- `RichTextEnhancedRuntime` now commits successful CommandAdapter edits through
  the same change path used by the editor: sync Rich editing to Markdown, save,
  update word count, and refresh MD preview.
- `ZWMdItBody` now preserves only the allowed paragraph-alignment HTML
  fragments (`p`, `h1`-`h3`, `blockquote`, `li` with
  `data-zw-align="start|center|end"`). It does not turn on arbitrary raw HTML;
  the aligned block body is rendered as inline Markdown with the existing safe
  renderer before the block is restored.
- `rich-text-block-align.spec.js` now proves the full user-facing path:
  align a Rich editing paragraph, observe saved Markdown content, open MD
  preview, open Reader, reload, and confirm the aligned paragraph still has the
  same `data-zw-align` value.

## Validation

- `node --check js/modules/editor/RichTextEnhancedRuntime.js`
- `node --check js/zw-markdown-it-body.js`
- `node --check e2e/rich-text-block-align.spec.js`
- `npx playwright test e2e/rich-text-block-align.spec.js --workers=1 --reporter=line --grep "段落揃えが保存"`
- `npx playwright test e2e/rich-text-block-align.spec.js e2e/reader-wysiwyg-distinction.spec.js --workers=1 --reporter=line`

## Trust Effect

Paragraph alignment is now tied to the writing trust path rather than just the
visible WYSIWYG DOM. A writer can apply alignment during Rich editing and expect
the decision to survive save/reload and remain visible in both editing-adjacent
MD preview and Reader.
