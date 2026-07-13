# Latest-main development-ready supervisor report

Date: 2026-07-13

## Outcome

The local `main` branch now contains the latest accepted remote work and has a
recreated, validated dependency tree. The supervisor can start the next outcome
decision from G3 release readiness without reopening G1 CI trust recovery or
asking this terminal to reconstruct its environment first.

## Remote synchronization

- Clean starting branch: `main` at `9f1bfb3 docs: stabilize handoff metadata`
- `git fetch --prune origin`: advanced `origin/main` to `b74ff6b`
- `git pull --ff-only origin main`: fast-forwarded `9f1bfb3..b74ff6b`
- Pulled head: `b74ff6b docs: hand off G1 closure across terminals`
- Immediate parity readback: `HEAD...origin/main = 0 0`
- No pre-existing local file changes were present

## Development readiness

The repository contract is Node `>=22.12.0 <25`, npm `>=11 <12`, with
`.nvmrc` recommending Node `24.13.0` and `packageManager` selecting npm
`11.6.2`. This terminal used the available Codex bundled Node `v24.14.0` and
Corepack npm `11.6.2`, then ran `npm ci` without changing the lockfile.

After dependency recreation, the following checks passed:

- `npm ls --depth=0`
- `npm run test:smoke` (`ALL TESTS PASSED`)
- `npm run test:unit` (16 passed, 0 failed)
- `npm run lint:js:check`
- `npm run build`

The invalid-JSON and forced-storage-failure messages in the unit output are
expected negative-path diagnostics. Full local Playwright was not repeated:
the pulled authority already records GitHub Actions run `29198025986` with
594 passed and 4 skipped, and no new product code was introduced in this sync.

## Supervisor readback

G1 is closed. The empty-title chapter boundary is preserved through parser,
store, and chapter-list synchronization, while the current shell and visual
capture tests now follow their actual ownership contracts. The next
assistant-owned outcome is G3: combine automated Web acceptance, UI capture
freshness/ownership, and Electron/package-only human gates into one readable
release-readiness checkpoint.

Documents tactile review remains a separate user-owned lane and does not block
G3. Electron/package behavior remains unverified on this terminal and must not
be inferred from Web automation. The terminal's system-default Node/npm are
`v22.19.0` / `10.9.3`; project-contract commands should therefore use a Node 24
runtime and Corepack npm `11.6.2` explicitly.

## Safe continuation

Start from `docs/CURRENT_STATE.md`, then inspect the G3 capture and acceptance
surfaces in `docs/PROJECT_COCKPIT.md`. Do not rerun G1 remote evidence or add
more SP-071 tests without new failure evidence. Keep the G3 package bounded to
the release decision surface; UI redesign, storage migration, Reader/export
changes, Electron packaging changes, dependency additions, and external
publication remain outside this sync.
