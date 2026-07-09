# Runtime State

## Workflow stamp

```text
CODEX_REKICKSTART_KIT=2026-07-09.v1
GLOBAL_CODEX_WORKING_CONTRACT=v1
BUILD_EVIDENCE_LOOP=v1
PROJECT_CAPSULE=v1
```

## Current branch

`main`

## Last accepted remote-aligned commit before this re-kickstart update

`643a204 fix: launch update script on Windows`

## Last known good state

As of 2026-07-10 00:24 +09:00, `main` and `origin/main` read back at `0 0` before local Project Capsule edits. The repo had one pre-existing local dirty file, `.serena/project.yml`, which is not part of this re-kickstart work.

The latest product state remains Documents Selection-to-Writing Focus Return + Marker Width Evidence. The user-side tactile review gate is still open for the empty Rich editing hint, the Documents `現在` marker density, and Documents tree selection focus return.

## Last validation

| Check | Command | Result | Date |
|---|---|---|---|
| dependency presence | `Test-Path package-lock.json; Test-Path node_modules` | pass (`True` / `True`) | 2026-07-10 |
| node/npm readback | `node --version`; `npm --version` | pass (`v24.13.0` / `11.6.2`) | 2026-07-10 |
| smoke | `npm run test:smoke` | pass, `ALL TESTS PASSED` | 2026-07-10 |
| build | `npm run build` | pass, `dist/` rebuilt | 2026-07-10 |
| parity | `git rev-list --left-right --count "HEAD...origin/main"` | pass before local edits, `0 0` | 2026-07-10 |

## Current active slice

Re-kickstart BUILD: install Project Capsule docs without overwriting existing authority docs, fill validation commands from repo reality, and leave at least one material evidence record.

## Known blockers

- The operator tactile review is still human-owned; do not convert it into an autonomous polish slice without feedback.
- `.serena/project.yml` remains pre-existing local dirt and should not be staged for this work.
- UI-specific acceptance still needs fresh screenshot or real-window evidence if the next BUILD changes UI behavior.

## Next BUILD candidates

| Candidate | Impact | Effort | Risk | Evidence target |
|---|---:|---:|---:|---|
| Generate a fresh review evidence pack with `npm run test:ui:capture` or `node scripts/capture-full-showcase.js` | high | low | low | screenshot/readback directory under `output/` and ARTIFACT_INDEX entry |
| Apply one narrow tactile-review polish if user feedback names a concrete issue | high | medium | medium | focused E2E or screenshot proof plus CURRENT_STATE update |
| Audit stale owner docs against the current shell/writing-trust state | medium | low | low | docs diff plus `git diff --check` |

## Last material evidence

2026-07-10 re-kickstart validation:

- `npm run test:smoke` passed with `ALL TESTS PASSED`.
- `npm run build` passed and rebuilt `dist/`.
- Evidence note: `docs/verification/2026-07-10/re-kickstart-build.md`.
