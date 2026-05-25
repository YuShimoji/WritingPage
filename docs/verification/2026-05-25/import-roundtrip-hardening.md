# Import Roundtrip Hardening

Date: 2026-05-25

## What changed

- `ZenWriterStorage.importProjectJSON(jsonString)` now parses and normalizes the incoming project before it mutates stored documents.
- Explicit `format` remains limited to `zenwriter-` formats. Format-less legacy JSON is accepted only when it contains at least one usable `pages` entry.
- Imports always create a new document ID and new chapter IDs. Existing documents are not overwritten.
- Document name collisions resolve deterministically: `Title`, `Title (読み込み 2)`, `Title (読み込み 3)`, and so on.
- Duplicate chapter titles are preserved. Chapter identity comes from new IDs plus normalized `order`.
- Imported pages are sorted by `order` and original array position, then stored as `0..n-1`. `level` is clamped to `1..6`, invalid `visibility` falls back to `visible`, blank titles become `ページ N`, and non-string content becomes an empty string.
- If imported `document.content` is empty but pages exist, the document body is rebuilt from normalized pages as Markdown headings.

## What stayed out

- No export schema change; `zenwriter-v1` remains the current JSON export shape.
- No public signature change; success still returns a new document ID and failure returns `null`.
- No UI wording or Electron menu route change.
- No Cloud sync, EPUB/DOCX, Rich editing `# 見出し` shortcut, or Floating memo persistence work.

## Verification

- `node --check js/storage.js`
- `npx playwright test e2e/import-roundtrip-hardening.spec.js e2e/export-trust.spec.js e2e/chapter-creation-daily-flow.spec.js --workers=1 --reporter=line`
- `npm run test:smoke`
- `npm run lint:js:check`
- `git diff --check`

Full monolithic E2E and Electron package build were not part of this slice. The covered surface is the storage import contract plus the existing export/chapter trust lane.

## Roadmap position

Import trust is now covered after the earlier export proof. The next useful bottleneck is no longer JSON return-path durability; it is either the Rich editing heading shortcut decision, stale spec reconciliation, or the user-owned WP-004 parity pack if a fresh preview/Reader difference appears.
