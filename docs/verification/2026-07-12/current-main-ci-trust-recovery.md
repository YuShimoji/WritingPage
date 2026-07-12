# Current-main CI trust recovery verification

Date: 2026-07-12

## Scope

- Recover current-main CI trust after the latest remote baseline had chapter-mode data-retention failure and legacy current-shell test failures.
- Keep the slice limited to chapterMode unnamed-chapter retention, current-shell test contract updates, CI runtime contract, and documentation sync.
- Exclude UI redesign, storage schema migration, autosave semantics changes, Reader/export format changes, Electron packaging changes, and external publication settings.

## Implementation proof

- `js/chapter-model.js`: heading parsing now accepts marker + whitespace + empty title as a valid chapter boundary while rejecting bare hash lines without required whitespace.
- `js/chapter-store.js`: `splitIntoChapters()` preserves existing unnamed empty chapters instead of overwriting/removing them during named-heading matching.
- `js/chapter-list.js`: Normal→Focus sync prefers the direct Markdown textarea value when it contains assembled heading content, avoiding stale Rich-editor source during split.
- `e2e/chapter-mode-sync.spec.js`: adds regression coverage for a newly-created unnamed empty chapter surviving Normal↔Focus round trip without contaminating neighboring chapter bodies.
- `e2e/sidebar-tab-dnd.spec.js`, `e2e/ui-regression.spec.js`, `e2e/visual-audit.spec.js`: update legacy shell/visual expectations to the current root/category shell and manual baseline-refresh contract.
- `.nvmrc`, `package.json`, `package-lock.json`, `.github/workflows/ci-e2e.yml`: align local and CI runtime entrypoints around Node 24.13.0 and `npm run test:ci:acceptance`.

## Local validation

Passed:

- `node --check` on changed JS/test files.
- `npm ls --depth=0`.
- `npm run test:smoke`.
- `npm run test:unit`.
- `npm run lint:js:check`.
- `npm run build`.
- `npx playwright test e2e/chapter-mode-sync.spec.js`.
- `npx playwright test e2e/chapter-mode-sync.spec.js e2e/sidebar-tab-dnd.spec.js e2e/ui-regression.spec.js e2e/visual-audit.spec.js --workers=1 --reporter=line` after skip-contract correction.
- `npx playwright test e2e/dock-panel.spec.js:1068 e2e/heading-typography.spec.js:315 e2e/import-roundtrip-hardening.spec.js:122 --workers=1 --reporter=line`.
- `npx playwright test e2e/sidebar-tab-dnd.spec.js e2e/visual-audit.spec.js --workers=1 --reporter=line` → 6 passed / 2 skipped.
- `node scripts/capture-full-showcase.js --out output/showcase/g1-ci-trust-recovery-2026-07-12` → 19 screenshots, ignored output.
- `npx playwright test e2e/pathtext-handles.spec.js:234 --workers=1 --reporter=line` after editor-scoped locator correction.
- Final `npm run test:ci:acceptance` → smoke pass, unit 16 passed, JS lint pass, build pass, full Playwright 594 passed / 4 skipped in 18.1m.

Observed and classified:

- Initial `npm run test:e2e` ran 596 tests with 585 passed / 8 skipped / 3 failed in 20.5m. The 3 failures were beforeEach/browser context timeout cases in unchanged suites; all three passed in a targeted one-worker replay.
- The first targeted `sidebar-tab-dnd` / `visual-audit` replay exposed accidental suite-level skip caused by callback-less `test.skip('message')`; corrected to explicit skipped test cases with empty callbacks.
- A later full acceptance replay exposed an unrelated strict-locator failure in `e2e/pathtext-handles.spec.js` because `.zw-pathtext` correctly exists in both Rich editor and preview. The test now scopes the preset mutation readback to `#wysiwyg-editor .zw-pathtext`; final acceptance passed after that correction.

## Remote validation

Verified implementation evidence:

- Commit: `cf4b43274600ea21d6b1e6b024b39d9e0f25eed7` (`fix: recover current-main CI trust`).
- GitHub Actions: [`CI E2E` run `29198025986`](https://github.com/YuShimoji/WritingPage/actions/runs/29198025986), triggered from `main` at the implementation commit above.
- Run / job result: run `completed / success`; job `e2e` `completed / success`.
- Acceptance step: `Run acceptance gates` completed with `success`.
- Remote log evidence: smoke reported `ALL TESTS PASSED`; unit reported 16 tests / 16 passed / 0 failed / 0 skipped; full Playwright reported 598 tests with 594 passed / 4 skipped in 10.2m. The build completed at the expected `dist` path; lint and the other commands in the acceptance step returned successfully.

The counts in this section are remote-run evidence and are separate from the local counts above. The later GitHub Actions run for the documentation-only closeout HEAD is reported in the final `AGENT_REPORT` instead of creating a recursive documentation commit that records its own validation run.
