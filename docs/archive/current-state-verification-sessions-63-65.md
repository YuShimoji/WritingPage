# Current State — 検証結果退避 (63–65)

正本は [`docs/CURRENT_STATE.md`](../CURRENT_STATE.md)。本ファイルは履歴参照用。

## 実行済み (session 63)

- `npx eslint js/editor-wysiwyg.js` → clean
- `npx playwright test e2e/wysiwyg-editor.spec.js -g "タイプライター ON"` → pass（1 件）

## 実行済み (session 64)

- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js e2e/reader-chapter-nav.spec.js e2e/reader-wikilink-popover.spec.js e2e/reader-genre-preset.spec.js` → pass（16 件）
- `npx playwright test e2e/wysiwyg-editor.spec.js` → pass（21 件・FR-007 含む）

## 実行済み (session 65)

- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js e2e/reader-chapter-nav.spec.js e2e/reader-wikilink-popover.spec.js e2e/reader-genre-preset.spec.js` → pass（16 件）
- `npx playwright test e2e/wysiwyg-editor.spec.js` → pass（23 件・FR-007 4 本含む）
- `npx playwright test --list` → **566 テスト / 68 ファイル**（`docs/ROADMAP.md` 記載用）
- `npx eslint js/editor-wysiwyg.js` → clean
