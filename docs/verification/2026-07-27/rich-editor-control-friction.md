# Rich Editing control-friction verification

Date: 2026-07-27
Authority: `AUTH-WP-RICH-EDITOR-CONTROL-FRICTION-BRANCH-20260727`
Branch: `codex/rich-editor-control-friction`
Base: `b02ceb1c42fcbad38fa1e5acb40efe7cd3831ef8` (`fix: remediate markdown linkification DoS`)

## Outcome

The single floating Rich Editing toolbar remains the owner of selection controls. It now waits for selection geometry to settle, then chooses a non-overlapping position inside the visible editor viewport. URL / email behavior is verified per surface; Rich direct typing remains plain text until a Markdown render boundary, and already-converted Rich anchors receive a readable underline affordance. The three wider UI observations are bounded in `docs/USER_REQUEST_LEDGER.md` without entering a settings redesign.

## Ownership and root cause

- Owner: `js/editor-wysiwyg.js` `setupFloatingToolbar()` / `_showFloatingToolbar()` and `css/style.css` `.wysiwyg-toolbar--floating`.
- Previous show condition: any non-collapsed selection inside `#wysiwyg-editor`.
- Previous placement: every `selectionchange` immediately measured the toolbar and chose above when `range.getBoundingClientRect().top` was large enough, otherwise below.
- Root cause: the algorithm did not debounce keyboard selection, did not protect the immediately preceding/following line, did not clamp to the actual Rich editor viewport, and did not enforce blur / Escape hiding. A fixed element with `width:auto` also changed its shrink-to-fit width after horizontal repositioning on a narrow viewport.
- Selection preservation: formatting commands already cloned/restored the editor range around `focus()`; the slice preserves that path and adds keyboard focus / Escape continuation for the toolbar.

## Placement and visibility contract

- Pointer selection hides controls until pointer release.
- Selection changes settle for 140ms; repeated Shift+Arrow changes reset the timer.
- The protected band includes all selected client rects plus the immediately preceding and following visible line, including inter-paragraph spacing.
- Placement is above when it fits, otherwise below. Horizontal position and width are clamped to the visible editor rect.
- If neither side fits without collision, the toolbar stays hidden.
- Collapsed selection, caret navigation, editor/control-surface blur, Escape, Markdown source, and Reader hide the toolbar.
- Toolbar keyboard focus keeps the selection; Escape returns focus to the Rich editor.
- Existing formatting command semantics, storage, chapter behavior, and Reader navigation are unchanged.

## Link behavior matrix

| Surface / route | DOM | visible style | click / target | conversion point | evidence grade |
|---|---|---|---|---|---|
| Rich direct typing | text node | body text | not clickable | none during typing | verified |
| Rich plain-text paste | text node | body text | not clickable | none during paste | verified |
| Rich after link-only reload | `<a href="https://…">` / `<a href="mailto:…">` | body-readable color + underline | clickable / no `target` | Markdown→HTML startup render | verified |
| Rich→Markdown→Rich | `<a>` for URL and email | body-readable color + underline | clickable / no `target` | `switchToWysiwyg()` Markdown render | verified |
| MD Preview | `<a>` for URL and email | existing rendered-link style | clickable / no `target` | preview render | verified |
| Reader / replay | `<a>` for URL and email | existing Reader link style | clickable / no `target` | Reader render | verified |
| Story Wiki detail | `<a>` for URL and email | `.wiki-preview a` underline | clickable / no `target` | Wiki Markdown render | verified |
| Electron external-browser handling for auto-links | unknown | n/a | not exercised; no new policy inferred | n/a | unverified |

Direct Rich typing intentionally remains text until a conversion boundary. No live Markdown reparse, MutationObserver parser, caret rewrite, dependency change, or navigation-policy change was added. The only presentation repair is scoped to generated anchors inside `#wysiwyg-editor`.

## Focused evidence

`e2e/rich-editor-control-friction.spec.js` covers:

- top, middle, and bottom selection geometry;
- repeated Shift+Arrow suppression and settled placement;
- collapsed selection, blur, and Escape;
- formatting action selection preservation;
- wide desktop and 520px narrow viewport;
- Rich direct typing, paste, link-only reload, Rich/Markdown conversion, MD Preview, Reader, and Story Wiki URL/email DOM;
- generated Rich anchor underline/readable-color contract and current target attributes.

The passing run generated ignored evidence under `test-results/`:

- `top-selection.png`
- `middle-selection.png`
- `bottom-selection.png`
- `keyboard-settled-selection.png`
- `rich-editor-direct-text-links.png`
- `rich-editor-converted-links.png`
- `reader-rendered-links.png`

All seven images were visually inspected. The four selection images keep the selected and immediately adjacent lines readable. The direct-input image shows intentional plain text; the converted Rich image shows underlined, body-readable anchors; the Reader image confirms rendered URL/email anchors.

## Local validation

- `node --check` passed for the changed runtime and focused test.
- The new focused Playwright spec passed 3/3.
- The existing Rich Editing and external-link specs produced 43 passes and one `browser.newContext()` setup timeout before the test body. The exact timed-out case passed 1/1 on an isolated rerun, closing its behavioral coverage without changing code.
- `npm run test:smoke` passed with `ALL TESTS PASSED`.
- `npm run lint:js:check` passed.
- A strict targeted Markdown-lint run reported only existing `MD038` / `MD025` findings in historical `docs/USER_REQUEST_LEDGER.md` content outside this diff. The interaction contract and this note pass normally; a ledger-scoped run disabling only those two legacy rules passes, so the new ledger block adds no Markdown-lint finding.
- `git diff --check` passed after the final documentation update.

## Scope boundaries

- No save/restart replay; only the required link-only browser reload roundtrip was used.
- No package rebuild.
- No security remediation, dependency, vendor bundle, storage/autosave/document model, chapter, Reader layout/navigation, Electron lifecycle, release tooling, package version, or workflow file changed.
- No main integration and no external release approval.
- Screenshots remain ignored and are not staged.

## 2026-07-28 closeout readback

The implementation commit remains
`19ea9774d45cf969855f2dd93684bd25a613a654`. GitHub Actions CI E2E run
`30213655549` completed successfully for that exact SHA. The branch was also
reconstructed in a separate clean worktree from `origin/main` after the
Markdown linkification remediation, using Node `v22.19.0` and the repository
contract npm `11.6.2`.

| Readback | Result | What it closes |
|---|---|---|
| Changed JavaScript syntax | pass | runtime and focused spec parse in the restart environment |
| Markdown linkification security test | 3/3 pass | the remediation base still resolves `markdown-it 14.3.0` / `linkify-it 5.0.2`, preserves Node/vendor parity, and bounds both pathological inputs |
| Rich control-friction focused Playwright | 3/3 pass | placement, keyboard continuation, narrow viewport, and URL/email surface behavior reproduce outside the implementation session |
| Node unit suite | 36/36 pass | storage, release-evidence, text-expression, and security unit coverage remain green |
| Smoke / JS lint / dist build | pass | repository contract, static runtime checks, lint, and distributable web assets remain valid |
| Exact implementation remote CI | success | full branch acceptance is not inferred from focused local tests alone |

The closeout replaces the stale `docs/CURRENT_STATE.md` live block and updates
the current roadmap authority. It does not alter the accepted runtime
implementation, regenerate screenshots, build or launch an Electron package,
or add an external navigation policy. The remaining supervisor decision is
therefore narrow: approve main integration for `19ea977`, hold with a concrete
finding against this contract, or reject the slice. Candidate generation and
external release remain separate gates.
