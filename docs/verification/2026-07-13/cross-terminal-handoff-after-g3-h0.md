# Cross-terminal handoff after G3 H0

Date: 2026-07-13

## Purpose

Preserve the completed G3 release-readiness checkpoint implementation and its
next human gate in repository authority so another terminal can resume without
the ignored output folder or prior chat.

## Tracked state

- Branch: `main`
- G3 implementation: `10b4b0a feat: add release readiness checkpoint`
- G3 start point: `6677b5f docs: report latest-main development readiness`
- G1 evidence remains closed at commit `cf4b432` / GitHub Actions run
  `29198025986`; do not reopen it without a fresh failure.
- At handoff preparation, `HEAD...origin/main` was `0 0` and the worktree was
  clean.

## Completed outcome

`npm run release:checkpoint` now creates a timestamped ignored evidence package
containing `checkpoint.json`, `RELEASE_READINESS.md`,
`ELECTRON_OPERATOR_REVIEW.md`, and a commit-bound dist UI capture. It runs the
bounded Web replay, builds the dist and Electron directory package, records the
executable hash and metadata, and keeps Electron human observation separate.

The final clean `10b4b0a` run passed smoke, unit 21/21, JS lint, dist build,
seven-image capture plus readback, and Electron directory build. Parsed evidence
reported capture/package pass, `source.dirty=false`, human gate pending, and
`HOLD_FOR_ELECTRON_OBSERVATION`. The independently matched local package hash
was `6253997b504407f4148f7396812409a628381664027c52d9c04796204b494779`.

## Non-transferable local evidence

`output/`, `dist/`, and `build/` are intentionally ignored. The previous
terminal's timestamped checkpoint and `Zen Writer.exe` are not supplied by Git.
The hash above proves the inspected local run but is not a binary download or a
substitute for regeneration on another terminal.

## Resume sequence

1. Run `git pull --ff-only origin main` and confirm
   `git rev-list --left-right --count "HEAD...origin/main"` is `0 0`.
2. Read the live block in `docs/CURRENT_STATE.md`, then
   `docs/INVARIANTS.md`, `docs/INTERACTION_NOTES.md`, and
   `docs/PROJECT_COCKPIT.md`.
3. Use Node 24.x and npm 11.6.2. Run `npm ci` if dependencies are absent or the
   lockfile has not been reproduced on that terminal.
4. From a clean tracked HEAD, run `npm run release:checkpoint` and inspect its
   generated `checkpoint.json` and Japanese Markdown.
5. Begin H1 only after regeneration: open the exact generated package with
   `npm run app:open:package` and follow `ELECTRON_OPERATOR_REVIEW.md`.

## Open boundary

H0 is complete. H1 is user-owned Electron observation of launch, short test
input/save, close, reopen, and recovery against the exact package SHA-256. No
human observation has been supplied, so neither the previous nor regenerated
checkpoint may be changed to observed or release-ready yet.

Documents empty hint / current marker / focus-return tactile review remains a
separate nonblocking review debt. Full Playwright, SP-071 replay, signing,
publication, installer distribution, cloud/account work, and product UI/runtime
changes are not the next action.
