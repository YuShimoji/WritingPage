# Documents Selection-to-Writing Focus Return

日付: 2026-07-07
Active Artifact: `documents-selection-focus-return`

Documents tree で文書を選んだ後、現在文書は切り替わっているが、そのまま書くには editor へ追加クリックが必要になり得た。日常の原稿棚としては「選ぶ -> 書く」へ戻るほうが自然なので、通常の document row selection だけ editor focus return を追加した。

## 変更

- `js/gadgets-documents-hierarchy.js` の Documents tree selection 経路で、文書切替後の次フレームに visible editor surface へ focus を戻す。
- scope は `onSelectDocument` からの通常文書選択だけ。JSON import、create document、multi-select の Ctrl/Shift 経路、context menu には広げていない。
- `e2e/daily-document-lifecycle.spec.js` を更新し、文書行クリック後に `#wysiwyg-editor` が focused になることを確認する。
- 同じ E2E で `現在` marker の readback を通常幅と 240px 制約幅で確認する。assert は marker text、marker width、document label の残り幅、label/marker の非重なり、row overflow なしを見る。

## 境界

- storage schema、autosave semantics、document model、import/export format、folder architecture、cloud/account/public sharing は変更していない。
- `現在` marker の文言・CSS は変更していない。
- First Writing Comfort、Design Cockpit、text expression preset catalog、Reader / Editor parity は再設計していない。
- manuscript body は dashboard / generated readback summaries に出していない。
- `.serena/project.yml` は既存 local dirt のままで、このスライスには含めていない。

## Validation

| コマンド | 結果 |
|---|---|
| `node --check js/gadgets-documents-hierarchy.js` | pass |
| `node --check e2e/daily-document-lifecycle.spec.js` | pass |
| `npx playwright test e2e/daily-document-lifecycle.spec.js --workers=1 --reporter=line` | 1 passed |
| `npx playwright test e2e/first-writing-comfort.spec.js --workers=1 --reporter=line` | 1 passed |
| `npm run test:ui:capture` | pass。local evidence: `output/playwright/manual-verification-2026-07-06T17-22-39-216Z` |
| `node scripts/capture-full-showcase.js` | pass。19 screenshots。local evidence: `output/showcase/full-2026-07-06T17-22-52` |
| `npx playwright test e2e/design-cockpit.spec.js --workers=1 --reporter=line` | 2 passed |
| `npm run test:smoke` | pass with `ALL TESTS PASSED` |
| `npm run lint:js:check` | pass |
| `npm run build` | pass |
| `git diff --check` | pass。warning は既存 local dirt `.serena/project.yml` の CRLF notice のみ |

`reader-wysiwyg-distinction` は editor rendering path を変更していないため、このスライスでは再実行していない。
