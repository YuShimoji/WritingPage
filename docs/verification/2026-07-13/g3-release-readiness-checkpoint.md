# G3 release-readiness checkpoint

Date: 2026-07-13

## Outcome

Release evidence no longer requires manual comparison across CI notes, capture
folders, and package paths. `npm run release:checkpoint` now produces one
ignored timestamped evidence package with a stable JSON schema, Japanese-first
decision Markdown, a bounded Electron operator sheet, and the UI capture used
by the decision.

## Evidence boundaries

| Evidence lane | What is verified | What it does not claim |
| --- | --- | --- |
| Web remote | Repository anchor for run `29198025986`, commit `cf4b432`, 594 passed / 4 skipped | Newly executed local full Playwright |
| Web local | Smoke, Node unit suite, JS lint, and dist build executed by the checkpoint | Package-only Electron behavior |
| UI capture | Dist capture owner, generator, commit, dirty state, time, mode/root, screenshot and readback inventory | Human visual acceptance or Electron behavior |
| Electron package | Directory build success plus executable path, size, mtime, SHA-256, and source identity | Launch, input, persistence, or restart observation |
| Human gate | Pending operator sheet bound to the package SHA-256 | Automatic acceptance from any machine artifact |

Dirty source is a blocking gate even if all generated machine artifacts pass.
On a clean commit, passing Web/capture/package evidence with pending Electron
observation synthesizes `HOLD_FOR_ELECTRON_OBSERVATION`. Only recorded human
observation may unlock `READY_FOR_INTERNAL_RELEASE_REVIEW`.

## Implementation

- `scripts/release-readiness-checkpoint.js` owns orchestration, environment and
  Git readback, bounded commands, explicit capture output, package metadata,
  ignored artifact generation, and overall status assembly.
- `scripts/release-readiness-lib.js` owns stable evidence-state validation,
  decision synthesis, SHA-256 and artifact inventory, and Japanese operator
  document rendering.
- `scripts/capture-ui-verification.js` and
  `scripts/capture-full-showcase.js` now record capture schema, owner,
  generator, source commit/dirty/branch, mode/root, creation time, and artifact
  inventory in their manifests.
- `test/release-readiness.test.js` covers pending-human HOLD, machine-gate
  BLOCKED, dirty-source BLOCKED, observed-human READY, and the human/package
  wording boundary without manuscript fixture leakage.

## Validation and inspected output

The first real dirty-HEAD generation produced bounded Web passes, seven dist
screenshots with readback, and a hashed Electron directory package. Inspection
found that dirty evidence still synthesized HOLD. The decision rule was
corrected so `source.dirty=true` is BLOCKED, while a clean source with pending
Electron observation is HOLD.

Required syntax checks, the focused release-readiness test, the full Node unit
suite, smoke, JS lint, dist build, explicit dist capture, Electron directory
build, JSON parse/readback, generated Markdown inspection, and `git diff
--check` protect this slice. Full Playwright and SP-071 were intentionally not
rerun because current remote evidence is already accepted and product runtime
did not change.

The final clean-HEAD command ran against implementation commit `10b4b0a`. The
parsed result recorded `source.dirty=false`, local bounded checks pass, seven
capture screenshots plus readback pass, package pass, Electron observation
pending, and overall `HOLD_FOR_ELECTRON_OBSERVATION`. The package executable
was `201233408` bytes and its independently matched SHA-256 was
`6253997b504407f4148f7396812409a628381664027c52d9c04796204b494779`.
No manuscript fixture text appeared in the generated JSON or operator-facing
Markdown.

The timestamped output and package remain ignored terminal-local evidence.
Another terminal recreates them from its own clean commit with the canonical
command instead of treating this hash as a transferable binary artifact.

## Boundary and next gate

No UI, storage, autosave, document-model, Reader/export, package-content,
dependency, signing, publication, account, or cloud behavior changed. H0 ends
at the generated checkpoint. H1 begins only when a person opens the exact
hashed package and records observer, time, PASS/FAIL/HOLD, and bounded findings
in `ELECTRON_OPERATOR_REVIEW.md`.
