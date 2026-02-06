# Task: Graphic Novel Ruby Text
Status: OPEN
Tier: 2
Branch: feat/ruby-text
Owner: Worker
Created: 2026-02-03T13:55:00+09:00

## Objective
Implement Ruby Text (`{kanji|kana}`) support for Mission 13 / Graphic Novel.

## Context
- Graphic novels often require furigana (ruby text).
- Markdown syntax extension needed.

## Focus Area
- `js/editor-preview.js`
- `js/editor.js` (Syntax highlighting if possible)

## DoD
- [ ] Support `{Kanji|Kana}` or similar syntax.
- [ ] Render as `<ruby>Kanji<rt>Kana</rt></ruby>` in preview.
- [ ] E2E test for rendering.
