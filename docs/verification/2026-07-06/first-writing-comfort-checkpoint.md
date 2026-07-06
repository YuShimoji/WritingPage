# First Writing Comfort Checkpoint

This slice makes the fresh launch / empty Rich editing surface easier to trust without changing the save model or adding permanent chrome.

## Change

- Added a non-persistent empty Rich editing hint: `ここから書き始められます。本文はこの端末に自動保存されます。`
- The hint is rendered from `data-empty` / CSS only; it is not inserted into manuscript content.
- Added focused E2E coverage for fresh launch -> empty editor hint -> Japanese input -> status chip -> command-palette manual save -> reload/resume -> Design Cockpit focus return.

## Boundaries

- No storage schema, autosave semantics, document model, import/export behavior, cloud/account/public sharing, Electron packaging, Design Cockpit behavior, textbox preset semantics, or Reader rendering changed.
- Manual save remains the existing command palette route; no large permanent save button or onboarding wizard was added.
- Design Cockpit summaries still avoid manuscript body leakage.

## Validation

- `node --check js/editor-wysiwyg.js` -> pass.
- `node --check e2e/first-writing-comfort.spec.js` -> pass.
- `npx playwright test e2e/first-writing-comfort.spec.js --workers=1 --reporter=line` -> 1 passed.
- `npm run test:ui:capture` -> pass; latest ignored evidence: `output/playwright/manual-verification-2026-07-06T13-25-36-581Z`.
- `node scripts/capture-full-showcase.js` -> pass; latest ignored evidence: `output/showcase/full-2026-07-06T13-25-52`.
- `npx playwright test e2e/design-cockpit.spec.js --workers=1 --reporter=line` -> 2 passed.
- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js --workers=1 --reporter=line` -> 16 passed.
- `npm run test:smoke` -> pass with `ALL TESTS PASSED`.
- `npm run lint:js:check` -> pass.
- `npm run build` -> pass.
- `git diff --check` -> pass; only warning was the pre-existing `.serena/project.yml` CRLF notice.
